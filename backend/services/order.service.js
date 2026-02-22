import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getSellerProfile } from "./seller.service.js";
import { createNotification } from "./notification.service.js";
import { getCart, clearCart } from "./cart.service.js";
import { Sequelize, Op } from "sequelize";

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
    const {
      items: cartItems,
      subtotal,
      discount,
      totalAmount,
      couponDetails,
    } = await getCart(userId);

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
        "Shipping address not found or does not belong to this user.",
      );
    }

    let mrpTotal = 0;
    for (const item of cartItems) {
      const prod = item.details.product || item.details.Product;
      if (item.details.stockQuantity < item.quantity) {
        throw new ApiError(
          400,
          `Not enough stock for ${prod?.name || "Product"}.`,
        );
      }
      const mrp = parseFloat(prod?.price || 0);
      const offerPrice = parseFloat(item.details.price || 0);
      mrpTotal +=
        Math.max(mrp, offerPrice, parseFloat(item.details.activePrice || 0)) *
        item.quantity;
    }

    // Generate a unique order ID
    const orderId = `ORD-${Date.now().toString().slice(-6)}${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0")}`;

    // Create the main order record.
    const newOrder = await db.Order.create(
      {
        orderId,
        userId,
        mrp: mrpTotal,
        subtotalAmount: subtotal,
        discountAmount: mrpTotal - subtotal + discount,
        deliveryFee: 0,
        totalAmount,
        shippingAddress: address.toJSON(),
        status: "pending",
      },
      { transaction },
    );

    if (couponDetails) {
      await db.OrderDiscounts.create(
        {
          orderId: newOrder.id,
          discountId: couponDetails.discountId,
          appliedAmount: discount,
        },
        { transaction },
      );
    }

    const orderItemsData = cartItems.map((item) => ({
      orderId: newOrder.id,
      offerId: item.offerId,
      quantity: item.quantity,
      priceAtTimeOfPurchase: item.details.activePrice || item.details.price,
      status: "pending",
    }));
    await db.OrderItem.bulkCreate(orderItemsData, { transaction });

    // Decrement stock for each offer
    await Promise.all(
      cartItems.map((item) =>
        db.Offer.update(
          {
            stockQuantity: Sequelize.literal(
              `stockQuantity - ${item.quantity}`,
            ),
          },
          { where: { id: item.offerId }, transaction },
        ),
      ),
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
    attributes: ["id", "orderId", "totalAmount", "status", "createdAt"],
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
        as: "orderItems",
        include: [
          {
            model: db.Offer,
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
      "Order not found or you do not have permission to view it.",
    );
  }

  return order;
};

/**
 * Service to get all order items that belongs to a specific seller for their dash board.
 * Supports pagination and filtering.
 * @param {string} userId - User ID of the seller.
 * @param {object} query - Query params (page, limit, status, search).
 */
export const getSellerOrdersHistory = async (userId, query = {}) => {
  console.log("getSellerOrdersHistory called for userId:", userId);
  try {
    const profile = await getSellerProfile(userId);
    console.log("Seller profile found:", profile?.id);
    const { page = 1, limit = 10, status, search } = query;
    const offset = (page - 1) * limit;

    const whereClause = {
      // Basic filter for order items if needed directly on OrderItem
    };

    if (status) {
      whereClause.status = status;
    }

    // Search
    let productWhere = {};
    let orderWhere = {};

    if (search) {
      if (search.toUpperCase().startsWith("ORD-")) {
        orderWhere = {
          orderId: { [Op.like]: `%${search}%` },
        };
      } else {
        productWhere = {
          name: { [Op.like]: `%${search}%` },
        };
      }
    }

    const { count, rows } = await db.OrderItem.findAndCountAll({
      include: [
        {
          model: db.Offer,
          required: true,
          where: { sellerProfileId: profile.id }, // Only items from this seller
          include: [
            {
              model: db.Product,
              as: "product",
              where: productWhere,
              attributes: ["name", "slug"],
              include: [
                {
                  model: db.Media,
                  as: "media",
                  attributes: ["url", "fileType"],
                },
              ],
            },
          ],
        },
        {
          model: db.Order,
          attributes: [
            "id",
            "orderId",
            "createdAt",
            "totalAmount",
            "status",
            "shippingAddress",
          ],
          where: orderWhere,
          include: [
            {
              model: db.User,
              as: "user",
              attributes: [["fullname", "name"], "email"],
            },
          ],
        },
      ],
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      distinct: true,
      subQuery: false,
    });

    return {
      orders: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count,
    };
  } catch (error) {
    console.error("Error in getSellerOrdersHistory:", error);
    throw error;
  }
};

/**
 * Fetches all active order items that a seller needs to fulfill.
 */
export const getOrdersForFulfillment = async (sellerId) => {
  return db.OrderItem.findAll({
    include: [
      {
        model: db.Offer,
        include: [
          { model: db.Product, as: "product", attributes: ["id", "name"] },
        ],
      },
      {
        model: db.Order,
        as: "order",
        attributes: ["id", "orderId", "shippingAddress", "createdAt"],
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
  trackingData,
) => {
  const profile = await getSellerProfile(userId);
  const item = await db.OrderItem.findByPk(orderItemId, {
    include: [
      {
        model: db.Offer,
        include: [{ model: db.Product, as: "product", attributes: ["name"] }],
      },
      { model: db.Order, attributes: ["id", "userId"] },
    ],
  });

  if (!item) throw new ApiError(404, "Order item not found.");

  if (item.Offer.sellerProfileId !== profile.id) {
    throw new ApiError(
      403,
      "Forbidden: You do not have permission to update this item.",
    );
  }

  const transaction = await db.sequelize.transaction();
  try {
    item.status = status;
    await item.save({ transaction });

    // Sync status with parent Order
    await syncOrderStatus(item.orderId, transaction);

    if (status === "Shipped") {
      if (!trackingData?.trackingNumber || !trackingData?.shippingCarrier) {
        throw new ApiError(
          400,
          "Tracking number and shipping carrier are required to mark as shipped.",
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
        { transaction },
      );
    }

    await transaction.commit();

    const customerId = item.Order.userId;
    const message = `Update: Your item '${item.Offer.product.name}' has been ${status}.`;
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
      "Order not found or you do not have permission to view it.",
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

/**
 * Helper function to sync parent Order status based on all OrderItems statuses.
 * @param {string} orderId
 * @param {object} transaction
 */
const syncOrderStatus = async (orderId, transaction) => {
  const items = await db.OrderItem.findAll({
    where: { orderId },
    transaction,
  });

  if (!items || items.length === 0) return;

  const statuses = items.map((i) => i.status);
  let newStatus = "pending";

  const isCancelled = statuses.every((s) => s === "cancelled");
  const isDelivered = statuses.every((s) => s === "delivered");
  const isShipped = statuses.every((s) =>
    ["shipped", "delivered", "cancelled"].includes(s),
  );
  const isProcessing = statuses.some((s) =>
    ["processing", "shipped", "delivered"].includes(s),
  );

  if (isCancelled) {
    newStatus = "cancelled";
  } else if (isDelivered) {
    newStatus = "delivered";
  } else if (isShipped) {
    // If all are processed (shipped/delivered/cancelled) but not all delivered/cancelled
    newStatus = "shipped";
  } else if (isProcessing) {
    newStatus = "processing";
  } else {
    newStatus = "pending";
  }

  await db.Order.update(
    { status: newStatus },
    { where: { id: orderId }, transaction },
  );
};

/**
 * Cancel an order (user-initiated). Allowed while status is pending or processing.
 * Automatically triggers a refund if payment was completed.
 */
export const cancelOrderService = async (orderId, userId, reason) => {
  const order = await db.Order.findOne({
    where: { id: orderId, userId },
    include: [{ model: db.Payment, as: "payments" }],
  });

  if (!order) throw new ApiError(404, "Order not found.");

  const cancellable = ["pending", "processing"];
  if (!cancellable.includes(order.status)) {
    throw new ApiError(
      400,
      `This order cannot be cancelled — it is already "${order.status}". Please contact support for assistance.`,
    );
  }

  // Cancel the order + items
  await db.Order.update(
    { status: "cancelled", cancellationReason: reason },
    { where: { id: orderId } },
  );
  await db.OrderItem.update({ status: "cancelled" }, { where: { orderId } });

  // Auto-refund if a succeeded payment exists
  // order.payments is a single object (hasOne), not an array
  const payment = order.payments;
  if (payment?.status === "succeeded") {
    try {
      const { initiateRefund } = await import("./payment.service.js");
      await initiateRefund(orderId, null, "requested_by_customer");
    } catch (refundErr) {
      // Refund failure should not block the cancellation — log and continue
      console.error(
        "Auto-refund failed for cancelled order:",
        refundErr.message,
      );
    }
  }

  return await db.Order.findByPk(orderId);
};

/**
 * Request a return & refund for a delivered order.
 * Allowed only when status is 'delivered', within 7 days.
 */
export const requestReturnService = async (orderId, userId, reason) => {
  const order = await db.Order.findOne({
    where: { id: orderId, userId },
    include: [{ model: db.Payment, as: "payments" }],
  });

  if (!order) throw new ApiError(404, "Order not found.");

  if (order.status !== "delivered") {
    throw new ApiError(
      400,
      `Returns are only accepted for delivered orders. Current status: "${order.status}".`,
    );
  }

  // 7-day return window check
  const deliveredAt = new Date(order.updatedAt);
  const daysSinceDelivery =
    (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 7) {
    throw new ApiError(
      400,
      "The 7-day return window for this order has expired.",
    );
  }

  // Mark order as return-requested
  await db.Order.update(
    { status: "return_requested", cancellationReason: reason },
    { where: { id: orderId } },
  );
  await db.OrderItem.update(
    { status: "return_requested" },
    { where: { orderId } },
  );

  // Trigger refund via Stripe
  // order.payments is a single object (hasOne), not an array
  const payment = order.payments;
  if (payment?.status === "succeeded") {
    try {
      const { initiateRefund } = await import("./payment.service.js");
      await initiateRefund(orderId, null, "requested_by_customer");
    } catch (refundErr) {
      // Refund failure should not block the return — log and continue
      console.error(
        "Auto-refund failed for return request:",
        refundErr.message,
      );
    }
  }

  return await db.Order.findByPk(orderId);
};
