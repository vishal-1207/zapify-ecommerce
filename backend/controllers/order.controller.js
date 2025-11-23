import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import * as orderService from "../services/order.service.js";

/**
 * Controller to create a new order from the user's cart.
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;
  const userId = req.user.id;

  if (!addressId) {
    throw new ApiError(400, "Shipping address Id is required.");
  }

  const newOrder = await orderService.createOrderFromCart(userId, addressId);
  return res
    .status(201)
    .json({ message: "Order created successfully. Proceed to payment." });
});

/**
 * Controller to get the authenticated user's order history (summary view).
 */
export const getOrdersForCustomer = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrdersForCustomer(req.user.id);
  return res
    .status(200)
    .json({ message: "Order history fetched successfully.", orders });
});

/**
 * Controller to get the details of a specific order belonging to the user.
 */
export const getOrderDetailsForCustomer = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const orderDetails = await orderService.getOrderDetailsForCustomer(
    orderId,
    req.user.id
  );
  return res
    .status(200)
    .json({ message: "Order details fetched successfully.", orderDetails });
});

/**
 * Controller to get shipment and tracking details for a specific order.
 */
export const getOrderTrackingDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const trackingDetails = await orderService.getOrderTrackingDetails(
    orderId,
    req.user.id
  );
  return res
    .status(200)
    .json({ message: "Tracking details fetched.", trackingDetails });
});

export const getActiveOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const orders = await orderService.getActiveOrders(req.user.id, page, limit);
  return res.status(200).json({ message: "Active orders fetched", orders });
});

/**
 * Controller to get order history (completed) for seller.
 */
export const getSellerOrdersHistory = asyncHandler(async (req, res) => {
  const sellerId = req.params;
  const orderList = await orderService.getSellerOrdersHistory(sellerId);
  return res
    .status(200)
    .json({ message: "Order history list fetched successfully.", orderList });
});

/**
 *
 */
export const getOrdersForFulfillment = asyncHandler(async (req, res) => {
  const sellerId = req.params;
  const fulfillmentOrderDetails = await orderService.getOrdersForFulfillment(
    sellerId
  );
  return res.status(200).json({
    message: "Fulfillment order details fetched.",
    fulfillmentOrderDetails,
  });
});

/**
 *
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderItemId } = req.params;
  const { status, trackingNumber, shippingCarrier } = req.body;

  if (!status) throw new ApiError(400, "Status is required.");

  const trackingData =
    status === "shipped" ? { trackingNumber, shippingCarrier } : null;

  const item = await sellerService.updateOrderItemStatus(
    req.user.id,
    orderItemId,
    status,
    trackingData
  );
  return res.status(200).json({ message: "Order status updated.", item });
});
