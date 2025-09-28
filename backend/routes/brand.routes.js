import express from "express";
import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "../controllers/brand.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { brandSchema } from "../utils/validationSchema.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .get(getBrands)
  .post(
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(brandSchema),
    createBrand
  );

router
  .route("/:id")
  .put(
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(brandSchema),
    updateBrand
  )
  .delete(authorizeRoles("admin"), csrfProtection, deleteBrand);

export default router;
