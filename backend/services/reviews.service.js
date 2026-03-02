import cloudinary from "../config/cloudinary.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import paginate from "../utils/paginate.js";
import { getSellerProfile } from "./seller.service.js";

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
      { where: { id: productId } },
    );
  } catch (error) {
    console.error(
      `Failed to update average rating for product ${productId}:`,
      error,
    );
  }
};
/**
 * Helper function to calculate and update a seller's average rating based on all reviews for their products.
 * @private
 */
const updateSellerAverageRating = async (sellerProfileId) => {
  if (!sellerProfileId) return;

  try {
    const [result] = await db.sequelize.query(
      `
      SELECT 
        AVG(R.rating) as averageRating,
        COUNT(R.id) as reviewCount
      FROM Reviews R
      INNER JOIN OrderItems OI ON R.orderItemId = OI.id
      INNER JOIN Offers O ON OI.offerId = O.id
      WHERE O.sellerProfileId = :sellerProfileId AND R.status = 'approved'
    `,
      {
        replacements: { sellerProfileId },
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    const averageRating = result?.averageRating
      ? parseFloat(result.averageRating).toFixed(2)
      : 0.0;
    const reviewCount = result?.reviewCount || 0;

    await db.SellerProfile.update(
      { averageRating, reviewCount },
      { where: { id: sellerProfileId } },
    );
  } catch (error) {
    console.error(
      `Failed to update average rating for seller ${sellerProfileId}:`,
      error,
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
      { model: db.Order, attributes: ["userId"] },
      { model: db.Offer, attributes: ["productId", "sellerProfileId"] },
    ],
  });

  if (!orderItem) throw new ApiError(404, "Order item not found.");

  if (orderItem.Order.userId !== userId)
    throw new ApiError(
      403,
      "Forbidden: You can only review items you have purchased.",
    );

  const existingReview = await db.Review.findOne({ where: { orderItemId } });
  if (existingReview) {
    throw new ApiError(
      409,
      "You have already submitted a review for this item.",
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
      { transaction },
    );

    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.path, process.env.CLOUDINARY_REVIEW_FOLDER),
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
    }

    await transaction.commit();

    // Self Note: For large-scale application it is better to use background jobs for such process.
    await updateProductAverageRating(orderItem.Offer.productId);
    await updateSellerAverageRating(orderItem.Offer.sellerProfileId);

    return db.Review.findByPk(newReview.id, {
      include: [{ model: db.Media, as: "media" }],
    });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to create review.", error);
  }
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
        as: "user",
        attributes: ["id", "fullname"],
      },
      {
        model: db.Media,
        as: "media",
      },
      {
        model: db.OrderItem,
        attributes: ["id"],
        include: [
          {
            model: db.Offer,
            attributes: ["id"],
            include: [
              {
                model: db.SellerProfile,
                as: "sellerProfile",
                attributes: ["id", "storeName", "slug"],
              },
            ],
          },
        ],
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
  newFiles,
) => {
  const transaction = await db.sequelize.transaction();

  try {
    const review = await db.Review.findOne({
      where: { id: reviewId, userId },
      include: [
        { model: db.Media, as: "media" },
        {
          model: db.OrderItem,
          include: [{ model: db.Offer, attributes: ["sellerProfileId"] }],
        },
      ],
    });
    if (!review) {
      throw new ApiError(
        404,
        "Review not found or you do not have permission to edit it.",
      );
    }

    const { rating, comment, mediaToDelete } = updateData;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    if (mediaToDelete && mediaToDelete.length > 0) {
      const parsedMediaToDelete = JSON.parse(mediaToDelete);
      const mediaRecordsToDelete = review.media.filter((m) =>
        parsedMediaToDelete.includes(m.id),
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
        uploadToCloudinary(file.path, process.env.CLOUDINARY_REVIEW_FOLDER),
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
    if (review.OrderItem?.Offer?.sellerProfileId) {
      await updateSellerAverageRating(review.OrderItem.Offer.sellerProfileId);
    }

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
      include: [
        { model: db.Media, as: "media" },
        {
          model: db.OrderItem,
          include: [{ model: db.Offer, attributes: ["sellerProfileId"] }],
        },
      ],
      transaction,
    });

    if (!review)
      throw new ApiError(
        404,
        "Review not found or you do not have permission to delete it.",
      );

    const productId = review.productId;

    if (review.media && review.media.length > 0) {
      const publicIds = review.media.map((m) => m.publicId);
      await cloudinary.api.delete_resources(publicIds);
    }

    await review.destroy({ transaction });
    await transaction.commit();

    await updateProductAverageRating(productId);
    if (review.OrderItem?.Offer?.sellerProfileId) {
      await updateSellerAverageRating(review.OrderItem.Offer.sellerProfileId);
    }

    return { message: "Review deleted successfully." };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to delete review.", error);
  }
};

/**
 * Toggles a like or dislike vote on a review.
 * @param {string} reviewId - The ID of the review.
 * @param {string} userId - The ID of the voting user.
 * @param {string} voteType - Either "like" or "dislike".
 * @returns {object} The updated review object.
 */
export const toggleReviewVote = async (reviewId, userId, voteType) => {
  const transaction = await db.sequelize.transaction();
  try {
    const review = await db.Review.findOne({
      where: { id: reviewId },
      transaction,
    });

    if (!review) throw new ApiError(404, "Review not found.");

    // Parse existing JSON arrays carefully.
    let likedBy = review.likedBy || [];
    let dislikedBy = review.dislikedBy || [];

    if (typeof likedBy === "string") likedBy = JSON.parse(likedBy);
    if (typeof dislikedBy === "string") dislikedBy = JSON.parse(dislikedBy);

    const hasLiked = likedBy.includes(userId);
    const hasDisliked = dislikedBy.includes(userId);

    // Default counters based on arrays just to be safe
    let likes = likedBy.length;
    let dislikes = dislikedBy.length;

    if (voteType === "like") {
      if (hasLiked) {
        // Toggle OFF (remove like)
        likedBy = likedBy.filter((id) => id !== userId);
        likes -= 1;
      } else {
        // Toggle ON (add like)
        likedBy.push(userId);
        likes += 1;
        // If they had previously disliked it, remove the dislike.
        if (hasDisliked) {
          dislikedBy = dislikedBy.filter((id) => id !== userId);
          dislikes -= 1;
        }
      }
    } else if (voteType === "dislike") {
      if (hasDisliked) {
        // Toggle OFF (remove dislike)
        dislikedBy = dislikedBy.filter((id) => id !== userId);
        dislikes -= 1;
      } else {
        // Toggle ON (add dislike)
        dislikedBy.push(userId);
        dislikes += 1;
        // If they had previously liked it, remove the like.
        if (hasLiked) {
          likedBy = likedBy.filter((id) => id !== userId);
          likes -= 1;
        }
      }
    } else {
      throw new ApiError(
        400,
        "Invalid vote type. Must be 'like' or 'dislike'.",
      );
    }

    // Ensure we don't go below 0 purely as a defensive measure
    review.likes = Math.max(0, likes);
    review.dislikes = Math.max(0, dislikes);
    review.likedBy = likedBy;
    review.dislikedBy = dislikedBy;

    await review.save({ transaction });
    await transaction.commit();

    return review;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to process review vote.", error);
  }
};

// ======== ADMIN SERVICES FOR REVIEWS ========
/**
 * Admin review service to get the list of pending reviews for verification.
 */
export const getPendingReviews = async (page, limit) => {
  const result = await paginate(
    db.Review,
    {
      where: { status: "pending" },
      include: [
        { model: db.User, as: "user", attributes: ["id", "fullname"] },
        { model: db.Product, attributes: ["id", "name"] },
      ],
      order: [["createdAt", "ASC"]],
    },
    page,
    limit,
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
export const moderateReview = async (reviewId, decision) => {
  const review = await db.Review.findOne({
    where: { id: reviewId, status: "pending" },
    include: [
      { model: db.Product, attributes: ["name"] },
      { model: db.User, as: "user", attributes: ["id"] },
      {
        model: db.OrderItem,
        include: [{ model: db.Offer, attributes: ["sellerProfileId"] }],
      },
    ],
  });
  if (!review) throw new ApiError(404, "Pending review not found.");

  review.status = decision;
  await review.save();

  if (decision === "approved") {
    await updateProductAverageRating(review.productId);
    if (review.OrderItem?.Offer?.sellerProfileId) {
      await updateSellerAverageRating(review.OrderItem.Offer.sellerProfileId);
    }
  }

  // Notify the user who wrote the review about the admin's decision.
  const message = `Your review for '${review.Product.name}' has been ${decision}.`;
  const linkUrl = `/products/${review.productId}?review=${review.id}`;
  createNotification(review.User.id, `review_${decision}`, message, linkUrl);

  return review;
};

// Seller dashboard reviews service (read only)
/**
 * Fetches all (approved) reviews written about a seller's products.
 */
export const getMyProductReviews = async (userId, page, limit) => {
  const profile = await getSellerProfile(userId);
  return paginate(
    db.Review,
    {
      where: { status: "approved" },
      include: [
        {
          model: db.Product,
          as: "product",
          attributes: ["id", "name"],
          required: true,
          include: [
            {
              model: db.Offer,
              as: "offers",
              attributes: [],
              required: true,
              where: { sellerProfileId: profile.id },
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    },
    page,
    limit,
  );
};
