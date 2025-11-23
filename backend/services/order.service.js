import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getSellerProfile } from "./seller.service.js";
import { createNotification } from "./notification.service.js";

/**
 * Creates a new order for a user based on the contents of their cart.
 * This function is atomic and runs inside a database transaction.
 * @param {string} userId - The ID of the user placing the order.
 * @param {string} addressId - The ID of the user's chosen shipping address.
 * @returns {Promise<Order>} The newly created order.
 */
export const createOrderFromCart = async (userId, addressId) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { items: cartItems, totalAmount } = getCart(userId);
    const address = await db.Address.findOne({
      where: { id: addressId, addressableId: userId, addressableType: "User" },
      transaction,
    });

    if (!cartItems || cartItems.length === 0) {
      throw new ApiError(400, "Your cart is empty.");
    }

    if (!address) {
      throw new ApiError(
        404,
        "Shipping address not found or does not belong to this user."
      );
    }

    for (const item of cartItems) {
      if (item.details.stockQuantity < item.quantity) {
        throw new ApiError(
          400,
          `Not enough stock for ${item.details.Product.name}.`
        );
      }
    }

    // Create the main order record.
    const newOrder = await db.Order.create(
      {
        userId,
        totalAmount,
        shippingAddress: address.toJSON(),
        status: "pending",
      },
      { transaction }
    );

    // Create OrderItem records from cart items
    const orderItemsData = cartItems.map((item) => ({
      orderId: newOrder.id,
      offerId: item.offerId,
      quantity: item.quantity,
      priceAtTimeOfPurchase: item.details.price,
    }));
    await db.OrderItem.bulkCreate(orderItemsData, { transaction });

    // Decrement stock for each offer
    await Promise.all(
      cartItems.map((item) =>
        db.Offer.update(
          {
            stockQuantity: Sequelize.literal(
              `stockQuantity - ${item.quantity}`
            ),
          },
          { where: { id: item.offerId }, transaction }
        )
      )
    );

    await transaction.commit();

    await clearCart(userId);

    return newOrder;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to create order.", error);
  }
};

/**
 * Oder service which fetches order history for a specific customer (summary view).
 * @param {string} userId - User Id for which the order history/summary will be fetched.
 */
export const getOrdersForCustomer = async (userId) => {
  const result = await db.Order.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "totalAmount", "status", "createdAt"],
  });

  return result;
};

/**
 * Order service which fetches the complete details of a single order for a customer.
 * @param {string} orderId - Order Id for which the details will be fetched.
 * @param {string} userId - User Id for which that order belongs to.
 */
export const getOrderDetailsForCustomer = async (orderId, userId) => {
  const order = await db.Order.findOne({
    where: { id: orderId, userId },
    include: [
      {
        model: db.OrderItem,
        as: "orderItem",
        include: [
          {
            model: db.Offer,
            as: "offer",
            include: [
              {
                model: db.Product,
                as: "product",
                attributes: ["id", "name"],
                include: [{ model: db.Media, as: "media" }],
              },
              {
                model: db.SellerProfile,
                as: "sellerProfile",
                attributes: ["id", "storeName"],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!order) {
    throw new ApiError(
      404,
      "Order not found or you do not have permission to view it."
    );
  }

  return order;
};

/**
 * Service to get all order items that belongs to a specific seller for their dash board.
 * @param {string} sellerProfileId - Seller for which the order items will be fetched.
 */
export const getSellerOrdersHistory = async (sellerId) => {
  const orders = await db.OrderItem.findAll({
    include: [
      {
        model: db.Order,
        as: "order",
        attributes: ["id", "shippingAddress", "createdAt"],
      },
      {
        model: db.Offer,
        as: "offer",
        where: { sellerProfileId: sellerId },
        include: [
          {
            model: db.Product,
            as: "product",
            attributes: ["name"],
            include: [
              {
                model: db.Media,
                as: "media",
                where: { tag: "thumbnail" },
                required: false,
              },
            ],
          },
        ],
      },
    ],
    order: [[db.Order, "createdAt", "DESC"]],
  });

  return orders;
};

/**
 * Fetches all active order items that a seller needs to fulfill.
 */
export const getOrdersForFulfillment = async (sellerId) => {
  return db.OrderItem.findAll({
    include: [
      {
        model: db.Offer,
        as: "offer",
        where: { sellerProfileId: sellerId },
        include: [
          { model: db.Product, as: "product", attributes: ["id", "name"] },
        ],
      },
      {
        model: db.Order,
        as: "Order",
        attributes: ["id", "shippingAddress", "createdAt"],
      },
    ],
    where: { status: { [Op.in]: ["Pending", "Processing"] } },
    order: [["createdAt", "ASC"]],
  });
};

/**
 * Allows a seller to update the fulfillment status of one of their order items
 * AND creates a shipment record when the item is marked as 'Shipped'.
 */
export const updateOrderItemStatus = async (
  userId,
  orderItemId,
  status,
  trackingData
) => {
  const profile = await getSellerProfile(userId);
  const item = await db.OrderItem.findByPk(orderItemId, {
    include: [
      {
        model: db.Offer,
        as: "offer",
        include: [{ model: db.Product, as: "product", attributes: ["name"] }],
      },
      { model: db.Order, as: "order", attributes: ["id", "userId"] },
    ],
  });

  if (!item) throw new ApiError(404, "Order item not found.");

  if (item.Offer.sellerProfileId !== profile.id) {
    throw new ApiError(
      403,
      "Forbidden: You do not have permission to update this item."
    );
  }

  const transaction = await db.sequelize.transaction();
  try {
    item.status = status;
    await item.save({ transaction });

    if (status === "Shipped") {
      if (!trackingData?.trackingNumber || !trackingData?.shippingCarrier) {
        throw new ApiError(
          400,
          "Tracking number and shipping carrier are required to mark as shipped."
        );
      }
      await db.Shipment.create(
        {
          trackingNumber: trackingData.trackingNumber,
          shippingCarrier: trackingData.shippingCarrier,
          status: "Shipped",
          orderId: item.orderId,
          sellerProfileId: profile.id,
        },
        { transaction }
      );
    }

    await transaction.commit();

    const customerId = item.Order.userId;
    const message = `Update: Your item '${item.Offer.Product.name}' has been ${status}.`;
    const linkUrl = `/my-orders/${item.Order.id}`;
    createNotification(customerId, "order_status_update", message, linkUrl);

    return item;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to update order status.", error);
  }
};

/**
 * Fetches all shipment and tracking details for a specific order.
 * @param {string} orderId - The ID of the order.
 * @param {string} userId - The ID of the user (for security).
 * @returns {Promise<Array<Shipment>>} A list of shipments for the order.
 */
export const getOrderTrackingDetails = async (orderId, userId) => {
  const order = await db.Order.findOne({ where: { id: orderId, userId } });
  if (!order) {
    throw new ApiError(
      404,
      "Order not found or you do not have permission to view it."
    );
  }

  const shipments = db.Shipment.findAll({
    where: { orderId },
    include: [
      {
        model: db.SellerProfile,
        as: "sellerProfile",
        attributes: ["id", "storeName"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return shipments;
};
