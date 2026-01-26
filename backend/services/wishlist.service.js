import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

/**
 * Service to get wishlist items for a specific user
 */
export const getWishlistForUser = async (userId) => {
  try {
    const wishlistItems = await db.Wishlist.findAll({
      where: { userId },
      include: [
        {
          model: db.Product,
          as: "product",
          include: [
            { model: db.Brand, as: "brand" },
            { model: db.Category, as: "category" },
          ],
        },
      ],
    });
    return wishlistItems;
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    throw new ApiError(500, "Failed to fetch wishlist.");
  }
};

/**
 * Service to add a product to the user's wishlist
 */
export const addToWishlist = async (userId, productId) => {
  try {
    const existingItem = await db.Wishlist.findOne({
      where: { userId, productId },
    });
    if (existingItem) {
      throw new ApiError(400, "Product already in wishlist.");
    }

    const wishlistItem = await db.Wishlist.create({ userId, productId });
    return wishlistItem;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to add product to wishlist.");
  }
};

/**
 * Service to remove a product from the user's wishlist
 */
export const removeFromWishlist = async (userId, productId) => {
  try {
    const deletedCount = await db.Wishlist.destroy({
      where: { userId, productId },
    });
    if (deletedCount === 0) {
      throw new ApiError(404, "Product not found in wishlist.");
    }
    return;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to remove product from wishlist.");
  }
};
