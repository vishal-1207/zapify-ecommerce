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

router
  .get("/", getBrands)
  .post(
    "/",
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    upload.single("image"),
    validate(brandSchema),
    createBrand
  );

router.put(
  "/:id/edit",
  authenticate,
  authorizeRoles("admin"),
  csrfProtection,
  upload.single("image"),
  validate(brandSchema),
  updateBrand
);

router.delete(
  "/:id/delete",
  authenticate,
  authorizeRoles("admin"),
  csrfProtection,
  deleteBrand
);

export default router;
