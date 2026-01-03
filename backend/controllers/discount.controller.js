import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import * as discountService from "../services/discount.service.js";
import * as cartService from "../services/cart.service.js";

/**
 * Validates a discount code against the current user's cart and returns the discount amount.
 */
export const applyDiscountToCart = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) throw new ApiError(400, "Discount code is required.");

  const { subTotal } = await cartService.getCart(req.user.id);

  if (subTotal <= 0) {
    throw new ApiError(400, "Cannot apply discount to an empty cart.");
  }

  await discountService.validateAndCalculateDiscount(
    code,
    subTotal,
    req.user.id
  );

  const updatedCart = await cartService.applyCouponToCart(req.user.id, code);

  return res
    .status(200)
    .json({ message: "Ccoupon applied successfully.", updatedCart });
});

/**
 * Remove a discount from Redis cart.
 */
export const removeDiscountFromCart = asyncHandler(async (req, res) => {
  const updatedCart = await cartService.removeCouponFromCart(req.user.id);
  return res.status(200).json({ message: "Discount removed.", updatedCart });
});

/**
 * Fetches applicable/available coupons for customers.
 */
export const getAvailableCoupons = asyncHandler(async (req, res) => {
  const { subtotal } = await cartService.getCart(req.user.id);
  const coupons = await discountService.getApplicableCoupons(
    req.user.id,
    subtotal
  );
  return res
    .status(200)
    .json({ message: "Fetched availabe discount coupons.", coupons });
});

/**
 * Creates a new discount/coupon code.
 */
export const createDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.createDiscount(req.body);
  return res
    .status(200)
    .json({ message: "Discount code created successfully.", discount });
});

/**
 * Fetches a paginated list of all disccounts.
 */
export const getDiscounts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await discountService.getAllDiscounts(page, limit);
  return res
    .status(200)
    .json({ message: "Discount codes fetched successfully." });
});

/**
 * Fetches details of a single discount.
 */
export const getDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.getDiscountById(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, discount, "Discount details fetched."));
});

/**
 * Updates an existing discount code.\
 */
export const updateDiscount = asyncHandler(async (req, res) => {
  const updatedDiscount = await discountService.updateDiscount(
    req.params.id,
    req.body
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedDiscount, "Discount updated successfully.")
    );
});

/**
 * Toggles the active status of a discount (Enable/Disable).
 */
export const toggleStatus = asyncHandler(async (req, res) => {
  const discount = await discountService.toggleDiscountStatus(req.params.id);
  const statusMsg = discount.isActive ? "activated" : "deactivated";
  return res
    .status(200)
    .json(
      new ApiResponse(200, discount, `Discount code has been ${statusMsg}.`)
    );
});

/**
 * Soft deletes a discount code.
 */
export const deleteDiscount = asyncHandler(async (req, res) => {
  const result = await discountService.deleteDiscount(req.params.id);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});
