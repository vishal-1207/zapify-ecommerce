import express from "express";
import * as brandController from "../controllers/brand.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { brandSchema } from "../utils/validationSchema.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

// Public routes
router
  .route("/")
  .get(brandController.getBrands)
  .post(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(brandSchema),
    brandController.createBrand
  );

router
  .route("/:id")
  .get(brandController.getBrandDetails) // Public access for Brand Store page
  .put(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(brandSchema),
    brandController.updateBrand
  )
  .delete(authenticate, authorizeRoles("admin"), csrfProtection, brandController.deleteBrand);

router
  .route("/:id/toggle-status")
  .patch(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    brandController.toggleStatus
  );

export default router;
