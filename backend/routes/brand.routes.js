import express from "express";
import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "../controllers/brand.controller.js";
import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { brandSchema } from "../utils/validationSchema.js";

const router = express.Router();

router
  .get("/", getBrands)
  .post(
    "/",
    authenticate,
    isAdmin,
    csrfProtection,
    validate(brandSchema),
    upload.single("image"),
    createBrand
  );

router.put(
  "/:id/edit",
  authenticate,
  isAdmin,
  csrfProtection,
  validate(brandSchema),
  upload.single("image"),
  updateBrand
);
router.delete(
  "/:id/delete",
  authenticate,
  isAdmin,
  csrfProtection,
  deleteBrand
);

export default router;
