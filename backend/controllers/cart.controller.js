import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import * as cartService from "../services/cart.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Controller to add a new item to the cart.
 */
export const addItem = asyncHandler(async (req, res) => {
  const { offerId, quantity } = req.body;
  if (!offerId || !quantity) {
    throw new ApiError(400, "offerId and quantity are required.");
  }
  const cart = await cartService.addItemToCart(
    req.user.id,
    offerId,
    parseInt(quantity)
  );
  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item added to cart."));
});

/**
 * Controller to get the user's full cart details.
 */
export const getCartDetails = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart details fetched."));
});

/**
 * Controller to update the quantity of a single item in the cart.
 */
export const updateItem = asyncHandler(async (req, res) => {
  const { offerId } = req.params;
  const { quantity } = req.body;
  if (quantity === undefined) {
    throw new ApiError(400, "Quantity is required.");
  }

  const cart = await cartService.updateItemQuantity(
    req.user.id,
    offerId,
    parseInt(quantity)
  );
  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart item quantity updated."));
});

/**
 * Controller to remove a single item from the cart.
 */
export const removeItem = asyncHandler(async (req, res) => {
  const { offerId } = req.params;
  const cart = await cartService.removeItemFromCart(req.user.id, offerId);
  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed from cart."));
});

/**
 * Controller to delete the user's entire cart.
 */
export const emptyCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Cart cleared successfully."));
});
