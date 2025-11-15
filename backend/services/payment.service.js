import Stripe from "stripe";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getSellerProfile } from "./seller.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Sends a detailed order confirmation email to the customer.
 * @param {object} order - The full order object with all associations.
 * @private
 */
const sendOrderConfirmationEmail = async (order) => {
  if (!order?.User?.email) {
    console.error(
      `Skipping confirmation email for order ${order.id}: No user email found.`
    );
    return;
  }

  const subject = `Your Order Confirmation (#${order.id.slice(0, 8)})`;
  const itemsHtml = order.OrderItems.map(
    (item) =>
      `<li>${item.quantity} x ${item.Offer.Product.name} (Sold by: ${item.Offer.SellerProfile.storeName}) - ₹${item.priceAtTimeOfPurchase}</li>`
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
// const sendOrderConfirmationSms = async (order) => {
//   if (!order?.User?.phoneNumber) {
//     console.log(`Skipping SMS for order ${order.id}: No phone number found.`);
//     return;
//   }
//   const messageBody = `Thank you! Your order #${order.id.slice(0, 8)} for ₹${
//     order.totalAmount
//   } has been placed successfully.`;
//   await sendSms(order.User.phoneNumber, messageBody);
// };

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
      8
    )}`;
    const itemsHtml = items
      .map(
        (item) =>
          `<li>${item.quantity} x ${item.Offer.Product.name} at ₹${item.priceAtTimeOfPurchase} each</li>`
      )
      .join("");

    const html = `
      <h1>You've made a sale!</h1>
      <p>Please prepare the following items from Order #${order.id.slice(
        0,
        8
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
      paymentIntentData
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

    const payment = db.Payment.findOne({
      where: { gatewayTransactionId: paymentIntent.id },
    });

    if (payment && payment.status === "pending") {
      payment.status = "succeeded";
      payment.paymentMethod = paymentIntent.payment_method_types[0];
      await payment.save();

      const order = await db.Order.findByPk(orderId, {
        include: [
          {
            model: db.User,
            attributes: ["id", "email", "fullname", "phoneNumber"],
          },
          {
            model: db.OrderItem,
            as: "orderItem",
            include: [
              {
                model: db.Offer,
                as: "offer",
                include: [
                  { model: db.Product, as: "product" },
                  { model: db.SellerProfile, as: "sellerProfile" },
                ],
              },
            ],
          },
        ],
      });
      if (order) {
        order.status = "processing";
        await order.save();

        sendOrderConfirmationEmail(order).catch((err) =>
          console.error("Failed to send confirmation email:", err)
        );
        // sendOrderConfirmationSms(order).catch(err => console.error("Failed to send confirmation SMS:", err)); // Uncomment to enable
        notifySellersOfNewOrder(order).catch((err) =>
          console.error("Failed to notify sellers:", err)
        );
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const payment = await db.findOne({
      where: { gatewayTransactionId: paymentIntent.id },
    });

    if (payment) {
      payment.status = "failed";
      payment.failureCode = paymentIntent.last_payment_error?.code;
      payment.failureMessage = paymentIntent.last_payment_error?.message;
      await payment.save();
    }
  }
};

// Seller Payment History
/**
 * Fetches a seller's transaction history (i.e., completed order items).
 */
export const getSellerTransactions = async (userId) => {
  const profile = await getSellerProfile(userId);
  return db.OrderItem.findAll({
    where: { status: "Delivered" },
    attributes: ["id", "priceAtTimeOfPurchase", "quantity", "updatedAt"],
    include: [
      {
        model: db.Offer,
        as: "offer",
        where: { sellerProfileId: profile.id },
        attributes: [],
        include: [{ model: db.Product, as: "product", attributes: ["name"] }],
      },
      { model: db.Order, as: "order", attributes: ["id"] },
    ],
    order: [["updatedAt", "DESC"]],
    limit: 100,
    raw: true,
    nest: true,
  });
};
