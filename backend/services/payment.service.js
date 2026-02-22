import Stripe from "stripe";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getSellerProfile } from "./seller.service.js";
import paginate from "../utils/paginate.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Sends a detailed order confirmation email to the customer.
 * @param {object} order - The full order object with all associations.
 * @private
 */
const sendOrderConfirmationEmail = async (order) => {
  if (!order?.User?.email) {
    console.error(
      `Skipping confirmation email for order ${order.id}: No user email found.`,
    );
    return;
  }

  const subject = `Your Order Confirmation (#${order.id.slice(0, 8)})`;
  const itemsHtml = order.OrderItems.map(
    (item) =>
      `<li>${item.quantity} x ${item.Offer.Product.name} (Sold by: ${item.Offer.SellerProfile.storeName}) - ₹${item.priceAtTimeOfPurchase}</li>`,
  ).join("");

  const html = `
    <h1>Thank you for your order, ${order.User.fullname}!</h1>
    <p>We've received your payment and your order is now being processed. You can view your order details in your account.</p>
    <h3>Order Summary:</h3>
    <ul>${itemsHtml}</ul>
    <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
  `;

  await sendEmail(order.User.email, subject, html);
};

/**
 * Sends an order confirmation SMS to the customer. (Currently disabled because of paid feature.)
 * @param {object} order - The full order object with associations.
 * @private
 */
const sendOrderConfirmationSms = async (order) => {
  if (!order?.User?.phoneNumber) {
    console.log(`Skipping SMS for order ${order.id}: No phone number found.`);
    return;
  }
  const messageBody = `Thank you! Your order #${order.id.slice(0, 8)} for ₹${
    order.totalAmount
  } has been placed successfully.`;
  await sendSms(order.User.phoneNumber, messageBody);
};

/**
 * Notifies each seller involved in an order about the new items they need to fulfill.
 * @param {object} order - The full order object with all associations.
 * @private
 */
const notifySellersOfNewOrder = async (order) => {
  if (!order?.OrderItems) return;

  const itemsBySeller = {};

  // Group order items by seller
  for (const item of order.OrderItems) {
    const sellerId = item.Offer.SellerProfile.id;
    if (!itemsBySeller[sellerId]) {
      itemsBySeller[sellerId] = {
        seller: item.Offer.SellerProfile,
        items: [],
      };
    }
    itemsBySeller[sellerId].items.push(item);
  }

  // Send a separate email to each seller
  for (const sellerId in itemsBySeller) {
    const { seller, items } = itemsBySeller[sellerId];
    const sellerUser = await seller.getUser();
    if (!sellerUser?.email) continue;

    const subject = `New Sale! You have items to fulfill for Order #${order.id.slice(
      0,
      8,
    )}`;
    const itemsHtml = items
      .map(
        (item) =>
          `<li>${item.quantity} x ${item.Offer.Product.name} at ₹${item.priceAtTimeOfPurchase} each</li>`,
      )
      .join("");

    const html = `
      <h1>You've made a sale!</h1>
      <p>Please prepare the following items from Order #${order.id.slice(
        0,
        8,
      )} for shipment:</p>
      <ul>${itemsHtml}</ul>
      <p>Please update the shipment status in your seller dashboard once the items are dispatched.</p>
    `;

    await sendEmail(sellerUser.email, subject, html);

    // --- Send In-App Notification ---
    const message = `New Sale! You have ${
      items.length
    } new item(s) to fulfill for Order #${order.id.slice(0, 8)}.`;
    const linkUrl = `/seller/orders/${order.id}`; // Example link to the seller's order page
    createNotification(sellerUser.id, "new_order", message, linkUrl);
  }
};

/**
 * Create a stripe payment intent for a given order.
 * @param {string} orderId - The ID of the order to be paid for.
 * @returns {object} The created payment intent object containing the client secret.
 */
export const createStripePaymentIntent = async (orderId) => {
  const order = await db.Order.findByPk(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  const amountInPaise = Math.round(order.totalAmount * 100);
  let payment = await db.Payment.findOne({ where: { orderId } });

  const paymentIntentData = {
    amount: amountInPaise,
    currency: "inr",
    metadata: { orderId: order.id },
  };

  let paymentIntent;

  if (payment && payment.gatewayTransactionId) {
    paymentIntent = await stripe.paymentIntents.update(
      payment.gatewayTransactionId,
      paymentIntentData,
    );
  } else {
    paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
  }

  if (payment) {
    payment.gatewayTransactionId = paymentIntent.id;
    await payment.save();
  } else {
    await db.Payment.create({
      orderId: order.id,
      amount: order.totalAmount,
      currency: "INR",
      status: "pending",
      gatewayTransactionId: paymentIntent.id,
      paymentGateway: "Stripe",
    });
  }

  return paymentIntent;
};

/**
 * Handles incoming Stripe webhooks to update order and payment status.
 * @param {object} event - The verified Stripe event object.
 */
export const handleStripeWebhook = async (event) => {
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    // BUG FIX: was missing `await` — payment was a Promise object, not the record
    const payment = await db.Payment.findOne({
      where: { gatewayTransactionId: paymentIntent.id },
    });

    if (payment && payment.status === "pending") {
      // Retrieve expanded PaymentIntent from Stripe for full method details
      let paymentMethodType = paymentIntent.payment_method_types?.[0] || "card";
      let paymentMethodDetails = null;
      try {
        const fullIntent = await stripe.paymentIntents.retrieve(
          paymentIntent.id,
          {
            expand: ["payment_method"],
          },
        );
        paymentMethodType =
          fullIntent.payment_method?.type || paymentMethodType;
        paymentMethodDetails =
          fullIntent.payment_method?.[paymentMethodType] || null;
      } catch (err) {
        console.warn("Could not retrieve expanded PaymentIntent:", err.message);
      }

      payment.status = "succeeded";
      payment.paymentMethod = paymentMethodType;
      payment.paymentMethodDetails = paymentMethodDetails;
      payment.gatewayResponse = {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
      };
      await payment.save();

      const order = await db.Order.findByPk(orderId, {
        include: [
          {
            model: db.User,
            attributes: ["id", "email", "fullname", "phoneNumber"],
          },
          {
            model: db.OrderItem,
            as: "orderItems",
            include: [
              {
                model: db.Offer,
                include: [
                  { model: db.Product, as: "product" },
                  { model: db.SellerProfile, as: "sellerProfile" },
                ],
              },
            ],
          },
          {
            model: db.Payment,
            as: "payments",
          },
        ],
      });
      if (order) {
        order.status = "processing";
        await order.save();

        sendOrderConfirmationEmail(order).catch((err) =>
          console.error("Failed to send confirmation email:", err),
        );
        // sendOrderConfirmationSms(order).catch(err => console.error("Failed to send confirmation SMS:", err)); // Uncomment to enable
        notifySellersOfNewOrder(order).catch((err) =>
          console.error("Failed to notify sellers:", err),
        );
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    // BUG FIX: was `db.findOne` — wrong model reference
    const payment = await db.Payment.findOne({
      where: { gatewayTransactionId: paymentIntent.id },
    });

    if (payment) {
      payment.status = "failed";
      payment.failureCode = paymentIntent.last_payment_error?.code;
      payment.failureMessage = paymentIntent.last_payment_error?.message;
      payment.gatewayResponse = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        last_payment_error: paymentIntent.last_payment_error,
      };
      await payment.save();
    }
  }
};

/**
 * Fetches a seller's transaction history (i.e., completed order items).
 */
export const getSellerTransactions = async (userId, page = 1, limit = 10) => {
  const profile = await getSellerProfile(userId);
  return paginate(
    db.OrderItem,
    {
      where: { status: "Delivered" },
      attributes: ["id", "priceAtTimeOfPurchase", "quantity", "updatedAt"],
      include: [
        {
          model: db.Offer,
          where: { sellerProfileId: profile.id },
          attributes: [],
          include: [{ model: db.Product, as: "product", attributes: ["name"] }],
        },
        { model: db.Order, attributes: ["id", "orderId"] },
      ],
      order: [["updatedAt", "DESC"]],
      raw: true,
      nest: true,
    },
    page,
    limit,
  );
};

/**
 * Initiates a full or partial Stripe refund for an order's payment.
 * @param {string} orderId - The order to refund.
 * @param {number|null} amount - Refund amount in INR (null = full refund).
 * @param {string} reason - Stripe refund reason: 'duplicate', 'fraudulent', or 'requested_by_customer'.
 */
export const initiateRefund = async (
  orderId,
  amount = null,
  reason = "requested_by_customer",
) => {
  const payment = await db.Payment.findOne({ where: { orderId } });

  if (!payment)
    throw new ApiError(404, "Payment record not found for this order.");
  if (payment.status !== "succeeded") {
    throw new ApiError(
      400,
      `Cannot refund a payment with status "${payment.status}".`,
    );
  }

  const validReasons = ["duplicate", "fraudulent", "requested_by_customer"];
  if (!validReasons.includes(reason)) {
    throw new ApiError(
      400,
      `Invalid refund reason. Must be one of: ${validReasons.join(", ")}.`,
    );
  }

  const refundParams = {
    payment_intent: payment.gatewayTransactionId,
    reason,
  };

  // Partial refund: Stripe expects amount in paise (smallest currency unit)
  if (amount !== null) {
    if (amount <= 0 || amount > parseFloat(payment.amount)) {
      throw new ApiError(
        400,
        "Refund amount must be greater than 0 and not exceed the original payment amount.",
      );
    }
    refundParams.amount = Math.round(amount * 100);
  }

  const stripeRefund = await stripe.refunds.create(refundParams);

  const isFullRefund = !amount || amount >= parseFloat(payment.amount);
  payment.status = isFullRefund ? "refunded" : "succeeded"; // partial: keep as succeeded
  payment.refundAmount = amount ?? parseFloat(payment.amount);
  payment.gatewayResponse = {
    ...payment.gatewayResponse,
    refund: {
      id: stripeRefund.id,
      amount: stripeRefund.amount,
      status: stripeRefund.status,
      reason: stripeRefund.reason,
      created: stripeRefund.created,
    },
  };
  await payment.save();

  // Cascade order status to cancelled on full refund
  if (isFullRefund) {
    await db.Order.update({ status: "cancelled" }, { where: { id: orderId } });
    await db.OrderItem.update({ status: "cancelled" }, { where: { orderId } });
  }

  return payment;
};
