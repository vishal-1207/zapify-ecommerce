import asyncHandler from "../utils/asyncHandler.js";
import * as reviewServices from "../services/reviews.service.js";
import * as adminServices from "../services/admin.service.js";
import ApiError from "../utils/ApiError.js";

/**
 * Controller to create a new review for a purchased order item.
 */
export const createReviewController = asyncHandler(async (req, res) => {
  const { orderItemId } = req.params;
  const userId = req.user.id;
  const reviewData = req.body;

  const newReview = await reviewServices.createReview(
    userId,
    orderItemId,
    reviewData,
    req.files,
  );
  return res.status(201).json({
    message:
      "Review submitted successfully. It will be visible after moderation.",
    review: newReview,
  });
});

/**
 * Controller to get all approved reviews for a product (public).
 */
export const getReviewController = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await reviewServices.getReviewsForProduct(productId);
  return res
    .status(200)
    .json({ message: "Reviews fetched successfully", reviews });
});

/**
 * Controller to get all reviews submitted by the logged-in user.
 */
export const getUserReviewsController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const result = await reviewServices.getUserReviews(userId, page, limit);

  return res.status(200).json({
    message: "User reviews fetched successfully",
    ...result, // spreads data, total, page, totalPages
  });
});

/**
 * Controller for a user to update their own review.
 */
export const updateReviewController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;
  const updatedReview = await reviewServices.updateUserReview(
    reviewId,
    userId,
    req.body,
    req.files,
  );
  return res.status(200).json({
    message: "Review updated. It has been resubmitted for moderation.",
    review: updatedReview,
  });
});

/**
 * Controller for a user to delete their own review.
 */
export const deleteReviewController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;
  const result = await reviewServices.deleteUserReview(reviewId, userId);
  return res.status(200).json({ message: result.message, result });
});

/**
 * Controller to toggle like/dislike on a review.
 */
export const toggleReviewVoteController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { voteType } = req.body;
  const userId = req.user.id;

  if (!voteType || !["like", "dislike"].includes(voteType)) {
    throw new ApiError(400, "Invalid voteType. Expected 'like' or 'dislike'.");
  }

  const updatedReview = await reviewServices.toggleReviewVote(
    reviewId,
    userId,
    voteType,
  );
  return res.status(200).json({
    message: `Review ${voteType} updated successfully.`,
    likes: updatedReview.likes,
    dislikes: updatedReview.dislikes,
    likedBy: updatedReview.likedBy,
    dislikedBy: updatedReview.dislikedBy,
  });
});

// ── Seller Controllers ──────────────────────────────────────────────────────────

/**
 * Seller: get all reviews for their products (with filters + pagination).
 */
export const getSellerReviewsController = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    hasResponse,
    rating,
    sortBy,
    search,
  } = req.query;
  const result = await reviewServices.getSellerReviews(
    req.user.id,
    page,
    limit,
    { status, hasResponse, rating, sortBy, search },
  );
  return res.status(200).json({ message: "Reviews fetched.", ...result });
});

/**
 * Seller: add or update a public response to a review.
 */
export const addSellerResponseController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { responseText } = req.body;

  if (!responseText || responseText.trim().length === 0) {
    throw new ApiError(400, "Response text is required.");
  }

  const review = await reviewServices.addSellerResponse(
    reviewId,
    req.user.id,
    responseText,
  );
  return res
    .status(200)
    .json({ message: "Response posted successfully.", review });
});

/**
 * User / Seller: report a review for abuse.
 */
export const reportReviewController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reason, description } = req.body;
  const reporterRole = req.user.roles.includes("seller") ? "seller" : "user";

  if (!reason) throw new ApiError(400, "Report reason is required.");

  const report = await reviewServices.reportReview(
    reviewId,
    req.user.id,
    reporterRole,
    reason,
    description,
  );
  return res
    .status(201)
    .json({ message: "Report submitted successfully.", report });
});

// ── Admin Controllers ───────────────────────────────────────────────────────────

/**
 * Admin: get paginated review queue filterable by status.
 */
export const getReviewQueueController = asyncHandler(async (req, res) => {
  const { status = "pending", page = 1, limit = 10 } = req.query;
  const result = await adminServices.getReviewQueue(status, page, limit);

  if (!result.total) {
    return res
      .status(200)
      .json({ message: `No ${status} reviews found.`, ...result });
  }

  return res.status(200).json({
    message: `Found ${result.total} review(s) with status '${status}'.`,
    ...result,
  });
});

/**
 * Admin: approve, reject, flag, or hide a review.
 */
export const adminModerateReviewController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { decision, reason, note } = req.body;

  if (!decision) throw new ApiError(400, "Decision is required.");

  const review = await adminServices.adminModerateReview(
    reviewId,
    req.user.id,
    decision,
    reason,
    note,
  );
  return res
    .status(200)
    .json({ message: `Review ${decision} successfully.`, review });
});

/**
 * Admin: get paginated list of review reports.
 */
export const getReviewReportsController = asyncHandler(async (req, res) => {
  const { status = "open", page = 1, limit = 10 } = req.query;
  const result = await adminServices.getReviewReports(status, page, limit);
  return res
    .status(200)
    .json({ message: "Reports fetched successfully.", ...result });
});

/**
 * Admin: resolve or dismiss a review report.
 */
export const resolveReportController = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { resolution } = req.body;

  if (!resolution) throw new ApiError(400, "Resolution is required.");

  const report = await adminServices.resolveReport(
    reportId,
    req.user.id,
    resolution,
  );
  return res.status(200).json({ message: `Report ${resolution}.`, report });
});
