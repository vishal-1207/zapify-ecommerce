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
router.use(authenticate);

router
  .route("/")
  .get(getCategories)
  .post(
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(categorySchema),
    addCategory
  );

router
  .route("/:id")
  .put(
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(categorySchema),
    updateCategory
  )
  .delete(authorizeRoles("admin"), csrfProtection, deleteCategory);

export default router;
