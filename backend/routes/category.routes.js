import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { categorySchema } from "../utils/validationSchema.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .get(categoryController.getCategories)
  .post(
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(categorySchema),
    categoryController.addCategory
  );

router
  .route("/:id")
  .put(
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(categorySchema),
    categoryController.updateCategory
  )
  .delete(
    authorizeRoles("admin"),
    csrfProtection,
    categoryController.deleteCategory
  );

export default router;
