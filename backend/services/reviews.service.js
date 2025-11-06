import cloudinary from "../config/cloudinary.js";
import db from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary } from "../utils/cloudinary.util.js";
import { paginate } from "../utils/paginate.js";

/**
 * Helper function to calculate and update a product's average rating.
 * @private
 */
const updateProductAverageRating = async (productId) => {
  if (!productId) return;

  try {
    const result = await db.Review.findOne({
      where: { productId },
      include: [
        [db.sequelize.fn("AVG", db.sequelize.col("rating")), "averageRating"],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "reviewCount"],
      ],
      raw: true,
    });

    const averageRating = result?.averageRating
      ? parseFloat(result.averageRating).toFixed(2)
      : 0.0;
    const reviewCount = result?.reviewCount || 0;

    await db.Product.update(
      { averageRating, reviewCount },
      { where: { id: productId } }
    );
  } catch (error) {
    console.error(
      `Failed to update average rating for product ${productId}:`,
      error
    );
  }
};

/**
 * Creates a new review for a purchased item ("Verified Purchase"), with optional media.
 * @param {string} userId - The ID of the user writing the review.
 * @param {string} orderItemId - The ID of the order item being reviewed.
 * @param {object} reviewData - The review content { rating, comment }.
 * @param {Array} files - Optional array of uploaded media files from multer.
 * @returns {Promise<Review>} The newly created review.
 */
export const createReview = async (userId, orderItemId, reviewData, files) => {
  const { rating, comment } = reviewData;

  const orderItem = await db.OrderItem.findOne({
    where: { id: orderItemId },
    include: [
      { model: db.Order, as: "order", attributes: ["userId"] },
      { model: db.Offer, as: "offer", attributes: ["productId"] },
    ],
  });

  if (!orderItem) throw new ApiError(404, "Order item not found.");

  if (orderItem.Order.userId !== userId)
    throw new ApiError(
      403,
      "Forbidden: You can only review items you have purchased."
    );

  const existingReview = await db.Review.findOne({ where: { orderItemId } });
  if (existingReview) {
    throw new ApiError(
      409,
      "You have already submitted a review for this item."
    );
  }

  const transaction = await db.sequelize.transaction();

  try {
    const newReview = await db.Review.create(
      {
        rating,
        comment,
        userId,
        orderItemId,
        productId: orderItem.Offer.productId,
      },
      { transaction }
    );

    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.path, process.env.CLOUDINARY_REVIEW_FOLDER)
      );
      const uploadResults = await Promise.all(uploadPromises);

      const mediaEntries = uploadResults.map((upload) => ({
        publicId: upload.public_id,
        url: upload.secure_url,
        fileType: upload.resource_type,
        tag: "gallery",
        associatedType: "review",
        associatedId: newReview.id,
      }));
      await db.Media.bulkCreate(mediaEntries, { transaction });

      await transaction.commit();

      // For large-scale application it is better to use background jobs for such process.
      await updateProductAverageRating(orderItem.Offer.productId);

      return db.Review.findByPk(newReview.id, {
        include: [{ model: db.Media, as: "media" }],
      });
    }
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to create review.", error);
  }

  return newReview;
};

/**
 * Fetches all reviews for a given product.
 */
export const getReviewsForProduct = async (productId) => {
  return db.Review.findAll({
    where: { productId },
    include: [
      {
        model: db.User,
        attributes: ["id", "fullname"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Allows a user to update their own review.
 * @param {string} reviewId - The ID of the review to update.
 * @param {string} userId - The ID of the user attempting to update the review.
 * @param {object} reviewData - The review data object which will be updated.
 * @param
 */
export const updateUserReview = async (
  reviewId,
  userId,
  updateData,
  newFiles
) => {
  const transaction = await db.sequelize.transaction();

  try {
    const review = await db.Review.findOne({ where: { id: reviewId, userId } });
    if (!review) {
      throw new ApiError(
        404,
        "Review not found or you do not have permission to edit it."
      );
    }

    const { rating, comment } = updateData;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    if (mediaToDelete && mediaToDelete.length > 0) {
      const parsedMediaToDelete = JSON.parse(mediaToDelete);
      const mediaRecordsToDelete = review.media.filter((m) =>
        parsedMediaToDelete.includes(m.id)
      );
      if (mediaRecordsToDelete.length > 0) {
        const publicIds = mediaRecordsToDelete.map((m) => m.publicId);

        await cloudinary.api.delete_resources(publicIds);

        await db.Media.destroy({
          where: { id: mediaRecordsToDelete.map((m) => m.id) },
          transaction,
        });
      }
    }

    if (newFiles && newFiles.length > 0) {
      const uploadPromises = newFiles.map((file) =>
        uploadToCloudinary(file.path, process.env.CLOUDINARY_REVIEW_FOLDER)
      );
      const uploadResults = await Promise.all(uploadPromises);

      const mediaEntries = uploadResults.map((upload) => ({
        publicId: upload.public_id,
        url: upload.secure_url,
        fileType: upload.resource_type,
        tag: "gallery",
        associatedType: "review",
        associatedId: review.id,
      }));
      await db.Media.bulkCreate(mediaEntries, { transaction });
    }

    await review.save({ transaction });
    await transaction.commit();

    await updateProductAverageRating(review.productId);

    return db.Review.findByPk(review.id, {
      include: [{ model: db.Media, as: "media" }],
    });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to update review.", error);
  }
};

/**
 * Allows a user to permanently delete their own review.
 * @param {string} reviewId - The ID of the review to delete.
 * @param {string} userId - The ID of the user attempting to delete the review.
 * @returns {object} A success message.
 */
export const deleteUserReview = async (reviewId, userId) => {
  const transaction = await db.sequelize.transaction();

  try {
    const review = await db.Review.findOne({
      where: { id: reviewId, userId },
      include: [{ model: db.Media, as: "media" }],
      transaction,
    });

    if (!review)
      throw new ApiError(
        404,
        "Review not found or you do not have permission to delete it."
      );

    const productId = review.productId;

    if (review.media && review.media.length > 0) {
      const publicIds = review.media.map((m) => m.publicId);
      await cloudinary.api.delete_resources(publicIds);
    }

    await review.destroy({ transaction });
    await transaction.commit();

    await updateProductAverageRating(productId);

    return { message: "Review deleted successfully." };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to delete review.", error);
  }
};

// ======== ADMIN SERVICES FOR REVIEWS ========
/**
 * Admin review service to get the list of pending reviews for verification.
 */
export const getPendingReviews = async (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const result = await paginate(
    db.Review,
    {
      where: { status: "pending" },
      include: [
        { model: db.User, attributes: ["id", "fullname"] },
        { model: db.Product, attributes: ["id", "name"] },
      ],
    },
    page,
    limit
  );

  return result;
};

/**
 * Service for admin to check and review users rating and/or comment for a specific product.
 * Allows admin to approve or reject a user's review.
 * @param {*} reviewId - Users review which will be reviewed for a specific product.
 * @param {*} decision - Admin decision to either approve or reject a review.
 * @returns
 */
export const approveOrRejectReview = async (reviewId, decision) => {
  const review = await db.Review.findOne({
    where: { id: reviewId, status: "pending" },
  });
  if (!review) throw new ApiError(404, "Pending review not found.");

  review.status = decision;
  await review.save();

  if (decision === "approved") {
    await updateProductAverageRating(review.productId);
  }

  // Notify the user who wrote the review about the admin's decision.
  const message = `Your review for product '${review.Product.name}' has been ${decision}.`;
  createNotification(review.userId, `review_${decision}`, message);

  return review;
};
