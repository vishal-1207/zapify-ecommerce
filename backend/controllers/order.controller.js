import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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
    .json(
      new ApiResponse(
        201,
        newOrder,
        "Order created successfully. Proceed to payment.",
      ),
    );
});

/**
 * Controller to get the authenticated user's order history (summary view).
 */
export const getOrdersForCustomer = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrdersForCustomer(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Order history fetched successfully."));
});

/**
 * Controller to get the details of a specific order belonging to the user.
 */
export const getOrderDetailsForCustomer = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const orderDetails = await orderService.getOrderDetailsForCustomer(
    orderId,
    req.user.id,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, orderDetails, "Order details fetched successfully."),
    );
});

/**
 * Controller to get shipment and tracking details for a specific order.
 */
export const getOrderTrackingDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const trackingDetails = await orderService.getOrderTrackingDetails(
    orderId,
    req.user.id,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, trackingDetails, "Tracking details fetched."));
});

export const getActiveOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const orders = await orderService.getActiveOrders(req.user.id, page, limit);
  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Active orders fetched"));
});

/**
 * Controller to get order history (completed) for seller.
 */
export const getSellerOrdersHistory = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const orderList = await orderService.getSellerOrdersHistory(sellerId);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        orderList,
        "Order history list fetched successfully.",
      ),
    );
});

/**
 *
 */
export const getOrdersForFulfillment = asyncHandler(async (req, res) => {
  const sellerId = req.params;
  const fulfillmentOrderDetails =
    await orderService.getOrdersForFulfillment(sellerId);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        fulfillmentOrderDetails,
        "Fulfillment order details fetched.",
      ),
    );
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
    trackingData,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, item, "Order status updated."));
});

/**
 * Cancel an order (user-initiated). Allowed for pending/processing orders.
 * Automatically refunds if payment was completed.
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    throw new ApiError(
      400,
      "Please provide a reason for cancellation (min 5 characters).",
    );
  }

  const order = await orderService.cancelOrderService(
    orderId,
    req.user.id,
    reason,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        order,
        "Order cancelled successfully. Refund will be processed within 5-7 business days.",
      ),
    );
});

/**
 * Request a return & refund for a delivered order (within 7 days).
 */
export const requestReturn = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    throw new ApiError(
      400,
      "Please provide a reason for the return (min 5 characters).",
    );
  }

  const order = await orderService.requestReturnService(
    orderId,
    req.user.id,
    reason,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        order,
        "Return request submitted. Refund will be processed within 5-7 business days.",
      ),
    );
});
