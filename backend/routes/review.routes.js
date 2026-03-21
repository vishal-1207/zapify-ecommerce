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

router.route("/product/:productId").get(reviewControllers.getReviewController);


router
  .route("/my-reviews")
  .get(
    authenticate,
    authorizeRoles("user"),
    reviewControllers.getUserReviewsController,
  );

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

router
  .route("/:reviewId/vote")
  .post(
    authenticate,
    authorizeRoles("user"),
    csrfProtection,
    reviewControllers.toggleReviewVoteController,
  );

router
  .route("/:reviewId/report")
  .post(
    authenticate,
    authorizeRoles("user", "seller"),
    csrfProtection,
    validate(reviewReportSchema),
    reviewControllers.reportReviewController,
  );

router
  .route("/seller/my-reviews")
  .get(
    authenticate,
    authorizeRoles("seller"),
    reviewControllers.getSellerReviewsController,
  );

router
  .route("/:reviewId/response")
  .post(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    validate(sellerResponseSchema),
    reviewControllers.addSellerResponseController,
  );

router
  .route("/admin/queue")
  .get(
    authenticate,
    authorizeRoles("admin"),
    reviewControllers.getReviewQueueController,
  );

router
  .route("/admin/review/:reviewId/moderate")
  .post(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    reviewControllers.adminModerateReviewController,
  );

router
  .route("/admin/reports")
  .get(
    authenticate,
    authorizeRoles("admin"),
    reviewControllers.getReviewReportsController,
  );

router
  .route("/admin/reports/:reportId")
  .post(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    reviewControllers.resolveReportController,
  );

export default router;
