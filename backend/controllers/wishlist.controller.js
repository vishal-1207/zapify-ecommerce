import * as wishlistServices from "../services/wishlist.service.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get wishlist for user
export const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const wishlistItems = await wishlistServices.getWishlistForUser(userId);
  res.status(200).json({ success: true, data: wishlistItems });
});

// Add to wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;
  const wishlistItem = await wishlistServices.addToWishlist(userId, productId);
  res.status(201).json({ success: true, data: wishlistItem });
});

// Remove from wishlist
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;
  await wishlistServices.removeFromWishlist(userId, productId);
  res
    .status(200)
    .json({ success: true, message: "Product removed from wishlist." });
});
