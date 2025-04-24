import Joi from "joi";

export const registerSchema = Joi.object({
  username: Joi.string().min(6).required().messages({
    "string.empty": "Name is required.",
    "string.min": "Name must be atleast 6 characters long.",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Email format is invalid.",
  }),
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be atleast 8 characters long.",
  }),
});

export const loginSchema = Joi.object({
  userId: Joi.string()
    .custom((value, helpers) => {
      const emailRegex = /^[w-]+(.[w-]+)*@([w-]+.)+[a-zA-Z]{2,7}$/;
      const isEmail = emailRegex.test(value);

      const isUsername = /^[a-zA-Z]{6,}$/;

      if (!isEmail && !isUsername) {
        return helpers.error("any.invalid");
      }

      return value;
    })
    .required()
    .messages({
      "string.empty": "Username or Email is required.",
      "any.invalid": "User ID must be either a username or a email.",
    }),

  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required.",
    "string.min": "Passwod is incorrect.",
  }),
});

export const productSchema = Joi.object({
  name: Joi.string().trim().min(10).max(100).required().messages({
    "string.empty": "Product name is required.",
    "string.min": "Product name must be atleast 6 characters long.",
  }),

  description: Joi.string().trim().max(1000).required().messages({
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
  categoryId: Joi.number().integer().positive().required().messages({
    "number.empty": "Category is required.",
  }),
});

export const categorySchema = Joi.object({
  name: Joi.string().trim().min(4).max(15).required().messages({
    "string:empty": "Category name is required.",
    "string.min": "Category name should be atleast 4 characters long.",
    "string.max": "Category name cannot exceed 15 characters.",
  }),
});
