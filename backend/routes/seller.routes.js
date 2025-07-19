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

const router = express.Router();

router
  .route("/profile")
  .get(authenticate, authorizeRoles("seller"), getSellerProfile);

router
  .route("/analytics")
  .get(authenticate, authorizeRoles("seller"), getSellerAnalytics);

router
  .route("/profile/:id/edit")
  .patch(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    validate(sellerProfileSchema),
    updateSellerProfile
  );

router
  .route("/profile/:id/delete")
  .delete(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    deleteSellerProfile
  );
