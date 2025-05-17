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

const router = express.Router();

router
  .route("/")
  .get(getCategories)
  .post(
    authenticate,
    isAdmin,
    csrfProtection,
    upload.single("image"),
    addCategory
  );

router
  .route("/edit/:id")
  .put(
    authenticate,
    isAdmin,
    csrfProtection,
    upload.single("image"),
    updateCategory
  );

router
  .route("/:id")
  .delete(authenticate, isAdmin, csrfProtection, deleteCategory);

export default router;
