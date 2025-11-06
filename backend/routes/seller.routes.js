import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";
import * as sellerController from "../controllers/seller.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { sellerProfileSchema } from "../utils/validationSchema.js";
import { registerSellerProfile } from "../controllers/seller.controller.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/profile/register")
  .post(
    csrfProtection,
    validate(sellerProfileSchema),
    limiter,
    sellerController.registerSellerProfile
  );

router
  .route("/profile")
  .get(authorizeRoles("seller"), sellerController.getSellerProfile);

router
  .route("/analytics")
  .get(authorizeRoles("seller"), sellerController.getSellerAnalytics);

router
  .route("/:slug/edit/profile")
  .patch(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    validate(sellerProfileSchema),
    sellerController.updateSellerProfile
  );

router
  .route("/:slug/delete/profile")
  .delete(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    sellerController.deleteSellerProfile
  );
