import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { Op } from "sequelize";

/**
 * Validates a discount code and calculates the discount amount.
 * @param {string} code - The coupon code string.
 * @param {number} subtotal - The current order subtotal.
 * @param {string} userId - ID of the user trying to apply the discount.
 * @returns {Promise<object>} { discountAmount, discountId, code }
 */
export const validateAndCalculateDiscount = async (code, subtotal, userId) => {
  if (!code || subtotal <= 0) {
    throw new ApiError(400, "Invalid discount request.");
  }

  const discount = await db.Discount.findOne({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
    },
  });

  if (!discount) {
    throw new ApiError(404, "Invalid or expired discount code.");
  }

  if (discount.usageLimit !== null) {
    const usageCount = await db.OrderDiscounts.count({
      where: { discountId: discount.id },
    });

    if (usageCount >= discount.usageLimit) {
      throw new ApiError(
        400,
        "The discount code has reached its maximum usage limit."
      );
    }
  }

  //Check usage per user
  if (discount.usagePerUser != null) {
    const userUsage = await db.OrderDiscount.count({
      where: { discountId: discount.id },
      include: [
        {
          model: db.Order,
          where: { userId },
          required: true,
        },
      ],
    });

    if (userUsage >= discount.usagePerUser) {
      throw new ApiError(400, "You have already used this discount code");
    }
  }

  if (userUsage > 0) {
    throw new ApiError(400, "You have already used this discount code.");
  }

  // Check minimum order value
  if (
    discount.minOrderAmount !== null &&
    subtotal < parseFloat(discount.minOrderAmount)
  ) {
    throw new ApiError(
      400,
      `Minimum order value ₹${discount.minOrderAmount} required`
    );
  }

  let discountAmount = 0;

  switch (discount.discountType) {
    case "percentage":
      discountAmount = (subtotal * discount.value) / 100;

      if (discount.maxDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
      }
      break;

    case "flat":
      if (subtotal < parseFloat(discount.value)) {
        throw new ApiError(
          400,
          `Cart value must be at least ₹${discount.value} to apply this coupon`
        );
      }

      discountAmount = parseFloat(discount.value);
      break;

    default:
      throw new ApiError(500, "Invalid discount configuration");
  }

  discountAmount = Math.min(discountAmount, subtotal);

  return {
    discountId: discount.id,
    code: discount.code,
    type: discount.discountType,
    value: parseFloat(discount.value),
    discountAmount: Number(discountAmount.toFixed(2)),
  };
};

/**
 * Creates a new discount code.
 */
export const createDiscount = async (data) => {
  const existing = await db.Discount.findOne({
    where: { code: data.code.toUpperCase() },
  });

  if (existing) throw new ApiError(409, "Discount already exists.");

  const discount = await db.Discount.create({
    ...data,
    code: data.code.toUpperCase(),
  });

  return discount;
};

/**
 * Fetches a paginated list of all discounts.
 */
export const getAllDiscounts = async (page = 1, limit = 10) => {
  return paginate(
    db.Discount,
    {
      order: [["createdAt", "DESC"]],
    },
    page,
    limit
  );
};

/**
 * Fetches a single discount by ID.
 */
export const getDiscountById = async (id) => {
  const discount = await db.Discount.findByPk(id);
  if (!discount) throw new ApiError(404, "Discount not found.");
  return discount;
};

/**
 * Updates a discount's details.
 */
export const updateDiscount = async (id, updateData) => {
  const discount = await db.Discount.findByPk(id);
  if (!discount) throw new ApiError(404, "Discount not found.");

  // If code is being updated, check for uniqueness
  if (updateData.code && updateData.code.toUpperCase() !== discount.code) {
    const existing = await db.Discount.findOne({
      where: { code: updateData.code.toUpperCase() },
    });
    if (existing) throw new ApiError(409, "Discount code already exists.");
  }

  await discount.update(updateData);
  return discount;
};

/**
 * Toggles the active status of a discount (Enable/Disable).
 */
export const toggleDiscountStatus = async (id) => {
  const discount = await db.Discount.findByPk(id);
  if (!discount) throw new ApiError(404, "Discount not found.");

  discount.isActive = !discount.isActive;
  await discount.save();

  return discount;
};

/**
 * Deletes a discount.
 * Note: You might want to prevent deletion if it has already been used in orders,
 * or use soft deletes (paranoid: true) in the model.
 */
export const deleteDiscount = async (id) => {
  const discount = await db.Discount.findByPk(id);
  if (!discount) throw new ApiError(404, "Discount not found.");

  await discount.destroy();
  return { message: "Discount deleted successfully." };
};
