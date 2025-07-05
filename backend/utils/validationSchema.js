import Joi from "joi";
import xss from "xss";

const sanitize = (value) => xss(value);

export const registerSchema = Joi.object({
  fullname: Joi.string()
    .min(3)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Name is required.",
    }),
  username: Joi.string()
    .min(6)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Username is required.",
      "string.min": "Username must be atleast 6 characters long.",
    }),
  email: Joi.string()
    .email()
    .required()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Email is required.",
      "string.email": "Email format is invalid.",
    }),
  password: Joi.string()
    .min(8)
    .required()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Password is required.",
      "string.min": "Password must be atleast 8 characters long.",
    }),
});

export const loginSchema = Joi.object({
  userId: Joi.string()
    .custom((value, helpers) => {
      const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
      const isEmail = emailRegex.test(value);

      const isUsername = /^[a-zA-Z0-9_]+$/.test(value);

      if (!isEmail && !isUsername) {
        return helpers.error("any.invalid");
      }

      return value;
    })
    .required()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Username or Email is required.",
      "any.invalid": "User ID must be either a username or a email.",
    }),

  password: Joi.string()
    .min(8)
    .required()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Password is required.",
      "string.min": "Passwod is incorrect.",
    }),
});

export const productSchema = Joi.object({
  categoryId: Joi.number().integer().positive().required().messages({
    "number.empty": "Category is required.",
  }),

  name: Joi.string()
    .trim()
    .min(10)
    .max(100)
    .required()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Product name is required.",
      "string.min": "Product name must be atleast 6 characters long.",
    }),

  model: Joi.string()
    .trim()
    .max(30)
    .optional()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.max": "Model name cannot exceed 30 characters.",
    }),

  description: Joi.string()
    .trim()
    .min(50)
    .max(1000)
    .required()
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Description is required.",
      "string.min": "Description must be atleast 50 characters long.",
    }),

  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a valid number.",
    "number.empty": "Price is required.",
    "number.positive": "Price must be a positive value.",
    "number.precision": "Price can have a maximum of 2 decimal places.",
  }),

  stock: Joi.number().integer().positive().min(0).required().messages({
    "number.base": "Price must be a valid number.",
    "number.empty": "Price is required.",
    "number.positive": "Price must be a positive value.",
  }),

  specs: Joi.array()
    .items(
      Joi.object({
        key: Joi.string()
          .trim()
          .required()
          .custom(sanitize, "XSS Sanitization")
          .messages({ "string.empty": "Specification is required." }),
        value: Joi.string()
          .trim()
          .required()
          .custom(sanitize, "XSS Sanitization")
          .messages({
            "string.empty": "Specification description is required.",
          }),
      })
    )
    .min(1)
    .required()
    .messages({ "array.min": "Atleast one specification is required." }),
});

export const categorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z\s]+$/)
    .min(4)
    .max(15)
    .required()
    .custom(sanitize, "XSS Sanitization")
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
    .custom(sanitize, "XSS Sanitization")
    .messages({
      "string.empty": "Brand name is required.",
      "string.min": "Brand name should be atleast 2 characters long.",
      "string.max": "Brand name cannot exceed 25 characters.",
    }),
});

//TODO: implement joi schema validation for seller profile
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

const ALLOWED_SORT_FIELDS = ["createdAt", "price", "averageRating"];

export const validateProductQuery = async (query) => {
  const schema = Joi.object({
    search: Joi.string().max(100).optional(),
    categorySlug: Joi.string().optional(),
    categoryId: Joi.number().integer().min(1).optional(),
    brand: Joi.string().max(50).optional(),
    inStock: Joi.boolean().optional(),
    priceMin: Joi.number().min(0).optional(),
    priceMax: Joi.number().min(0).optional(),
    sortBy: Joi.string()
      .valid(...ALLOWED_SORT_FIELDS)
      .default("createdAt"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
  });

  const value = await schema.validateAsync(query, { abortEarly: false });

  return {
    ...value,
    offset: (value.page - 1) * value.limit,
  };
};
