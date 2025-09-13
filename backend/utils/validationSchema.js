import Joi from "joi";
import xss from "xss";

const sanitize = (value) => xss(value);

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
  password: Joi.string().min(8).required().custom(sanitize).messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be atleast 8 characters long.",
  }),
});

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
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return helpers.error("any.invalid");
        return parsed;
      } catch (e) {
        return helpers.error("any.invalid");
      }
    })
    .messages({ "any.invalid": "Specs must be a valid JSON array string." }),
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
  productData: Joi.object({
    name: Joi.string().trim().min(10).max(150).required().custom(sanitize),
    description: Joi.string()
      .trim()
      .min(50)
      .max(2000)
      .required()
      .custom(sanitize),
    categoryId: Joi.string().uuid().required(),
    brandId: Joi.string().uuid().required(),
    specs: Joi.string().required(),
  }).required(),

  offerData: Joi.object({
    price: Joi.number().positive().precision(2).required(),
    stockQuantity: Joi.number().integer().min(0).required(),
    condition: Joi.string()
      .valid("New", "Used - Like New", "Used - Good", "Refurbished")
      .optional()
      .default("New"),
  }).required(),
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
  website: Joi.string().uri().optional().allow("").messages({
    "website.uri": "Website must be a valid URL.",
  }),
  contactNumber: Joi.string()
    .pattern(/^[\d+\-\s()]{6,17}$/)
    .optional()
    .allow("")
    .messages({ "string.base": "Contact number format is invalid." }),
  address: Joi.string().max(300).optional().allow(""),
});

export const userSettingsSchema = Joi.object({
  language: Joi.string().optional(),
  theme: Joi.string().valid("light", "dark").optional(),
  timezone: Joi.string().optional(),
  emailNotifications: Joi.boolean().optional(),
  smsNotifications: Joi.boolean().optional(),
  twoFactorEnabled: Joi.boolean().optional(),
  loginAlerts: Joi.boolean().optional(),
  dataSharingConsent: Joi.boolean().optional(),
});

export const searchSchema = Joi.object({
  search: Joi.string().trim().optional(),
  categorySlug: Joi.string().trim().optional(),
  brand: Joi.string().trim().optional(),
  priceMin: Joi.number().min(0).optional(),
  priceMax: Joi.number().positive().optional(),
  sortBy: Joi.string()
    .valid("createdAt", "price", "name", "popularity", "relevance")
    .optional(),
  order: Joi.string().uppercase().valid("ASC", "DESC").optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
});
