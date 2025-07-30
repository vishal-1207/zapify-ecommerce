import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";
import {
  deleteSellerProfile,
  getSellerAnalytics,
  getSellerProfile,
  updateSellerProfile,
} from "../controllers/seller.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { sellerProfileSchema } from "../utils/validationSchema.js";
import { registerSellerProfile } from "../controllers/seller.controller.js";

const router = express.Router();

router.route(
  "/profile/register",
  csrfProtection,
  validate(sellerProfileSchema),
  limiter,
  registerSellerProfile
);

router
  .route("/profile")
  .get(authenticate, authorizeRoles("seller"), getSellerProfile);

router
  .route("/analytics")
  .get(authenticate, authorizeRoles("seller"), getSellerAnalytics);

router
  .route("/:slug/edit/profile")
  .patch(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    validate(sellerProfileSchema),
    updateSellerProfile
  );

router
  .route("/:slug/delete/profile")
  .delete(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    deleteSellerProfile
  );
