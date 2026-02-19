import * as paymentControllers from "../controllers/payment.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import express from "express";
import csrfProtection from "../middleware/csrf.middleware.js";

import isVerified from "../middleware/isVerified.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/create-intent")
  .post(csrfProtection, isVerified, paymentControllers.createPaymentIntent);

router
  .route("/webhook")
  .post(
    csrfProtection,
    express.raw({ type: "application/json" }),
    paymentControllers.stripeWebhookHandler
  );

export default router;
