import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  reviewSchema,
  reviewReportSchema,
  sellerResponseSchema,
} from "../utils/validationSchema.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import * as reviewControllers from "../controllers/reviews.controller.js";

const router = express.Router();

// ── Public ──────────────────────────────────────────────────────────────────────
// GET all approved reviews for a product
router.route("/product/:productId").get(reviewControllers.getReviewController);

// ── User (buyer) ────────────────────────────────────────────────────────────────

// Get user's own reviews (My Reviews)
router
  .route("/my-reviews")
  .get(
    authenticate,
    authorizeRoles("user"),
    reviewControllers.getUserReviewsController,
  );

// Submit a new review for a purchased order item
router
  .route("/order-item/:orderItemId")
  .post(
    authenticate,
    authorizeRoles("user"),
    csrfProtection,
    upload.array("gallery", 5),
    validate(reviewSchema),
    reviewControllers.createReviewController,
  );

// Update or delete own review
router
  .route("/:reviewId")
  .patch(
    authenticate,
    authorizeRoles("user"),
    csrfProtection,
    upload.array("gallery", 5),
    validate(reviewSchema),
    reviewControllers.updateReviewController,
  )
  .delete(
    authenticate,
    authorizeRoles("user"),
    csrfProtection,
    reviewControllers.deleteReviewController,
  );

// Like / dislike a review
router
  .route("/:reviewId/vote")
  .post(
    authenticate,
    authorizeRoles("user"),
    csrfProtection,
    reviewControllers.toggleReviewVoteController,
  );

// Report a review (user or seller)
router
  .route("/:reviewId/report")
  .post(
    authenticate,
    authorizeRoles("user", "seller"),
    csrfProtection,
    validate(reviewReportSchema),
    reviewControllers.reportReviewController,
  );

// ── Seller ──────────────────────────────────────────────────────────────────────
// Get all reviews for this seller's products (with filters)
router
  .route("/seller/my-reviews")
  .get(
    authenticate,
    authorizeRoles("seller"),
    reviewControllers.getSellerReviewsController,
  );

// Add or update a public seller response on a review
router
  .route("/:reviewId/response")
  .post(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    validate(sellerResponseSchema),
    reviewControllers.addSellerResponseController,
  );

// ── Admin ───────────────────────────────────────────────────────────────────────
// Get paginated review queue (filterable by status: pending, flagged, approved, rejected, hidden, all)
router
  .route("/admin/queue")
  .get(
    authenticate,
    authorizeRoles("admin"),
    reviewControllers.getReviewQueueController,
  );

// Approve / reject / flag / hide a review
router
  .route("/admin/review/:reviewId/moderate")
  .post(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    reviewControllers.adminModerateReviewController,
  );

// Get all review reports (filterable by status: open, resolved, dismissed, all)
router
  .route("/admin/reports")
  .get(
    authenticate,
    authorizeRoles("admin"),
    reviewControllers.getReviewReportsController,
  );

// Resolve or dismiss a specific report
router
  .route("/admin/reports/:reportId")
  .post(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    reviewControllers.resolveReportController,
  );

export default router;
