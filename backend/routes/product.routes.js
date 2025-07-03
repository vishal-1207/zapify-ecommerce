import express from "express";
import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { productSchema } from "../utils/validationSchema.js";

const router = express.Router();

//TODO: Add methods to get products by category and by ID for user and admin respectively.

// router.route("/category/:slug/products").get(getProductsByCategory);
// router.route("/category/:id/products").get(getProductsByCategoryId);

router.route("/").post(
  authenticate,
  isAdmin,
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  validate(productSchema),
  createProduct
);

router.route("/edit/:id").put(
  authenticate,
  isAdmin,
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  validate(productSchema),
  updateProduct
);

router
  .route("/:id")
  .delete(authenticate, isAdmin, csrfProtection, deleteProduct);

export default router;
