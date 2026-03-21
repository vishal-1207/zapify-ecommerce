import * as paymentControllers from "../controllers/payment.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import express from "express";
import csrfProtection from "../middleware/csrf.middleware.js";
import isVerified from "../middleware/isVerified.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

router
  .route("/webhook")
  .post(
    express.raw({ type: "application/json" }),
    paymentControllers.stripeWebhookHandler,
  );

router.use(authenticate);

router
  .route("/create-intent")
  .post(csrfProtection, isVerified, paymentControllers.createPaymentIntent);

router.route("/my-transactions").get(paymentControllers.getMyTransactions);

router.route("/verify").post(paymentControllers.verifyPayment);

router
  .route("/:orderId/refund")
  .post(
    csrfProtection,
    authorizeRoles("admin"),
    paymentControllers.refundPayment,
  );

export default router;
