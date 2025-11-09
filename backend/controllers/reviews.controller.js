import asyncHandler from "../utils/asyncHandler.js";
import * as reviewServices from "../services/reviews.service.js";

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
    reviewData
  );
  return res.status(201).json({ message: "Review submitted successfully." });
});

/**
 * Controller to get all reviews for a product (public).
 */
export const getReviewController = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await reviewServices.getReviewsForProduct(productId);
  return res
    .status(201)
    .json({ message: "Reviews fetched successfully", reviews });
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
    req.body
  );
  return res.status(201).json({ message: "Review updated successfully." });
});

/**
 * Controller for a user to delete their own review.
 */
export const deleteReviewController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;
  const result = await reviewServices.deleteUserReview(reviewId, userId);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * Review controller for admin to approve or reject a user's review for a specific product.
 */
export const getPendingReviewsController = asyncHandler(async (req, res) => {
  const result = await reviewServices.getPendingReviews(req);

  if (result.total === 0) {
    return res.status(200).json({
      message:
        "No pending review(s) found. All products are verified. Nice work.",
      ...result,
    });
  }

  return res.status(200).json({
    message: `Found ${result.total} review(s) pending for review.`,
    ...result,
  });
});
