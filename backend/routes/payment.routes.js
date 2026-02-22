import * as paymentControllers from "../controllers/payment.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import express from "express";
import csrfProtection from "../middleware/csrf.middleware.js";
import isVerified from "../middleware/isVerified.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

// ─── PUBLIC: Stripe webhook ───────────────────────────────────────────────────
// Must be BEFORE router.use(authenticate) and must NOT have csrfProtection.
// Stripe sends unauthenticated POST requests — any auth/csrf middleware will 401/403 them.
// express.raw() must come before the handler so Stripe signature verification gets the raw body.
router
  .route("/webhook")
  .post(
    express.raw({ type: "application/json" }),
    paymentControllers.stripeWebhookHandler,
  );

// ─── PROTECTED: all routes below require a valid JWT ────────────────────────
router.use(authenticate);

router
  .route("/create-intent")
  .post(csrfProtection, isVerified, paymentControllers.createPaymentIntent);

// Admin: issue a full or partial refund for an order
router
  .route("/:orderId/refund")
  .post(
    csrfProtection,
    authorizeRoles("admin"),
    paymentControllers.refundPayment,
  );

export default router;
