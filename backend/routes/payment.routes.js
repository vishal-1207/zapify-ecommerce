import * as paymentControllers from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import { csrfProtection } from "../middleware/csrf.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/create-intent")
  .post(csrfProtection, paymentControllers.createPaymentIntent);

router
  .route("/webhook")
  .post(
    csrfProtection,
    express.raw({ type: "application/json" }),
    paymentControllers.stripeWebhookHandler
  );

export default router;
