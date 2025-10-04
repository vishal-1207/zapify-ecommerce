import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import * as paymentServices from "../services/payment.service.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const paymentIntent = await paymentServices.createStripePaymentIntent(
    orderId
  );

  res.status(200).json({
    message: "Payment Intent created.",
    clientSecret: paymentIntent.client_secret,
  });
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
