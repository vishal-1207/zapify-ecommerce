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
export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrdersForCustomer(req.user.id);
  return res
    .status(200)
    .json({ message: "Order history fetched successfully.", orders });
});

/**
 * Controller to get the details of a specific order belonging to the user.
 */
export const getUserOrderDetails = asyncHandler(async (req, res) => {
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
export const getOrderTracking = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const trackingDetails = await orderService.getOrderTrackingDetails(
    orderId,
    req.user.id
  );
  return res
    .status(200)
    .json({ message: "Tracking details fetched.", trackingDetails });
});

/**
 * Controller to get order history (completed) for seller.
 */
export const orderHistoryForSeller = asyncHandler(async (req, res) => {
  const sellerId = req.params;
  const orderList = await orderService.getOrdersForSeller(sellerId);
  return res
    .status(200)
    .json({ message: "Order history list fetched successfully.", orderList });
});

/**
 *
 */
export const getOrderDetailsForFulfillment = asyncHandler(async (req, res) => {
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
    status === "Shipped" ? { trackingNumber, shippingCarrier } : null;

  const item = await sellerService.updateOrderItemStatus(
    req.user.id,
    orderItemId,
    status,
    trackingData
  );
  return res
    .status(200)
    .json(new ApiResponse(200, item, "Order status updated."));
});
