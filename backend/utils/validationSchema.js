import Joi from "joi";
import xss from "xss";

const sanitize = (value) => xss(value);

const parseJsonArray = (value, helpers) => {
  try {
    if (typeof value !== "string") return value;
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return helpers.error("any.invalid");
    return parsed;
  } catch (e) {
    return helpers.error("any.invalid");
  }
};

export const registerSchema = Joi.object({
  fullname: Joi.string()
    .min(3)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .custom(sanitize)
    .messages({
      "string.empty": "Name is required.",
    }),
  username: Joi.string()
    .min(6)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .custom(sanitize)
    .messages({
      "string.empty": "Username is required.",
      "string.min": "Username must be atleast 6 characters long.",
    }),
  email: Joi.string().email().required().custom(sanitize).messages({
    "string.empty": "Email is required.",
    "string.email": "Email format is invalid.",
  }),
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .optional()
    .custom(sanitize),
  password: Joi.string().min(8).required().custom(sanitize).messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be atleast 8 characters long.",
  }),
}).or("email", "phoneNumber");

export const loginSchema = Joi.object({
  userId: Joi.string()
    .required()
    .custom(sanitize)
    .messages({ "string.empty": "Username or Email is required." }),

  password: Joi.string().min(8).required().custom(sanitize).messages({
    "string.empty": "Password is required.",
    "string.min": "Passwod is incorrect.",
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().custom(sanitize),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  password: Joi.string().min(8).required(),
});

export const verifyCodeSchema = Joi.object({
  code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required(),
});

export const userSettingsSchema = Joi.object({
  theme: Joi.string().valid("light", "dark").optional(),
  language: Joi.string().valid("en", "hi", "es", "fr").optional(),
  emailNotifications: Joi.boolean().optional(),
  smsNotifications: Joi.boolean().optional(),
  deleteOnRead: Joi.boolean().optional(),
});

export const productSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(10)
    .max(150)
    .required()
    .custom(sanitize)
    .messages({ "string.empty": "Product name is required." }),
  description: Joi.string()
    .trim()
    .min(50)
    .max(2000)
    .required()
    .custom(sanitize)
    .messages({ "string.empty": "Description is required." }),
  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a valid number.",
    "number.empty": "Price is required.",
    "number.positive": "Price must be a positive value.",
  }),
  categoryId: Joi.string()
    .uuid()
    .required()
    .messages({ "string.empty": "Category ID is required." }),
  brandId: Joi.string()
    .uuid()
    .required()
    .messages({ "string.empty": "Brand ID is required." }),
  specs: Joi.string()
    .required()
    .custom(parseJsonArray)
    .messages({ "any.invalid": "Specs must be a valid JSON array string." }),
  mediaToDelete: Joi.string().optional().custom(parseJsonArray),
});

export const offerSchema = Joi.object({
  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a valid number.",
    "number.empty": "Price is required.",
    "number.positive": "Price must be a positive value.",
  }),
  stockQuantity: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock quantity must be a valid number.",
    "number.empty": "Stock quantity is required.",
    "number.integer": "Stock quantity must be a whole number.",
    "number.min": "Stock quantity cannot be negative.",
  }),
  condition: Joi.string()
    .valid("New", "Used - Like New", "Used - Good", "Refurbished")
    .optional()
    .default("New"),
});

export const suggestProductSchema = Joi.object({
  productData: Joi.object(productSchema).required(),
  offerData: Joi.object(offerSchema).required(),
});

export const categorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z\s]+$/)
    .min(4)
    .max(15)
    .required()
    .custom(sanitize)
    .messages({
      "string.empty": "Category name is required.",
      "string.min": "Category name should be atleast 4 characters long.",
      "string.max": "Category name cannot exceed 15 characters.",
    }),
});

export const brandSchema = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z]+$/)
    .min(2)
    .max(25)
    .required()
    .custom(sanitize)
    .messages({
      "string.empty": "Brand name is required.",
      "string.min": "Brand name should be atleast 2 characters long.",
      "string.max": "Brand name cannot exceed 25 characters.",
    }),
});

export const sellerProfileSchema = Joi.object({
  storeName: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Store name is required.",
    "string.min": "Store name must be at least 3 characters.",
    "string.max": "Store name must not exceed 50 characters.",
  }),
  bio: Joi.string().max(500).optional().allow(""),
  contactNumber: Joi.string()
    .pattern(/^[\d+\-\s()]{6,17}$/)
    .optional()
    .allow("")
    .messages({ "string.base": "Contact number format is invalid." }),
});

export const sellerSettingsSchema = Joi.object({
  storeVisibility: Joi.boolean().optional(),
  lowStockNotification: Joi.boolean().optional(),
  salesReportEmail: Joi.boolean().optional(),
});

export const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required().messages({
    "number.min": "Rating must be at least 1.",
    "number.max": "Rating cannot be more than 5.",
    "any.required": "A star rating is required.",
  }),
  comment: Joi.string()
    .trim()
    .max(300)
    .optional()
    .allow("")
    .custom(sanitize)
    .messages({
      "string.max": "Comment cannot exceed 300 characters.",
    }),
  mediaToDelete: Joi.string().optional().custom(parseJsonArray),
});

export const discountSchema = Joi.object({
  code: Joi.string().uppercase().min(3).max(15).required(),
  description: Joi.string().max(255).optional(),
  discountType: Joi.string().valid("percentage", "fixed").required(),
  value: Joi.number().positive().required().message({
    "number.positive": "Discount must be greater than 0",
  }),
  expiresAt: Joi.date().greater("now").optional(),
  usageLimit: Joi.number().integer().min(1).optional(),
  isActive: Joi.boolean().default(true),
});
