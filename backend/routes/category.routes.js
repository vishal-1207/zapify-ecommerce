import express from "express";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { categorySchema } from "../utils/validationSchema.js";

const router = express.Router();

router
  .route("/")
  .get(getCategories)
  .post(
    authenticate,
    isAdmin,
    csrfProtection,
    upload.single("image"),
    validate(categorySchema),
    addCategory
  );

router
  .route("/:id/edit")
  .put(
    authenticate,
    isAdmin,
    csrfProtection,
    upload.single("image"),
    validate(categorySchema),
    updateCategory
  );

router
  .route("/:id/delete")
  .delete(authenticate, isAdmin, csrfProtection, deleteCategory);

export default router;
