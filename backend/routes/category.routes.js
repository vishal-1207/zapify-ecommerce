import express from "express";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { categorySchema } from "../utils/validationSchema.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(getCategories)
  .post(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(categorySchema),
    addCategory
  );

router
  .route("/:id/edit")
  .put(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(categorySchema),
    updateCategory
  );

router
  .route("/:id/delete")
  .delete(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    deleteCategory
  );

export default router;
