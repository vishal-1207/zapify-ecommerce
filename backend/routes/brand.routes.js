import express from "express";
import * as brandController from "../controllers/brand.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { brandSchema } from "../utils/validationSchema.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .get(brandController.getBrands)
  .post(
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(brandSchema),
    brandController.createBrand
  );

router
  .route("/:id")
  .get(authorizeRoles("admin"), brandController.getBrandDetails)
  .put(
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(brandSchema),
    brandController.updateBrand
  )
  .delete(authorizeRoles("admin"), csrfProtection, brandController.deleteBrand);

export default router;
