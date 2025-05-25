import express from "express";
import {
  addBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "../controllers/brand.controller.js";
import { authenticate, isAdmin } from "../middleware/auth.middleware";
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
    addBrand
  );

router.put(
  "/:id",
  authenticate,
  isAdmin,
  csrfProtection,
  validate(brandSchema),
  upload.single("image"),
  updateBrand
);
router.delete("/:id", authenticate, isAdmin, csrfProtection, deleteBrand);

export default router;
