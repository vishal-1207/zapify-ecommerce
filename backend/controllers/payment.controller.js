import asyncHandler from "../utils/asyncHandler.js";
import * as paymentServices from "../services/payment.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Stripe from "stripe";
import * as orderService from "../services/order.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  const order = await orderService.getOrderDetailsForCustomer(orderId, userId);
  if (!order) {
    throw new ApiError(404, "Order not found or you do not have permission to pay for it.");
  }

  const paymentIntent =
    await paymentServices.createStripePaymentIntent(orderId);

  res.status(200).json(
    new ApiResponse(
      200,
      { clientSecret: paymentIntent.client_secret },
      "Payment Intent created.",
    ),
  );
});

export const stripeWebhookHandler = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  await paymentServices.handleStripeWebhook(event);

  res.status(200).json({ recieved: true });
});

export const getSellerTransactions = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const transactions = await paymentServices.getSellerTransactions(
    sellerId,
    page,
    limit,
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        transactions,
        "Seller transactions fetched successfully.",
      ),
    );
});
