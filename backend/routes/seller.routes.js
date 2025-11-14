import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";
import * as sellerController from "../controllers/seller.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { sellerProfileSchema } from "../utils/validationSchema.js";

const router = express.Router();
router.use(authenticate);

// Profile Management
router
  .route("/profile/register")
  .post(
    csrfProtection,
    validate(sellerProfileSchema),
    limiter,
    sellerController.createProfile
  );

router
  .route("/profile")
  .get(authorizeRoles("seller"), sellerController.getProfile);

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
    sellerController.updateProfile
  );

router
  .route("/:slug/delete/profile")
  .delete(
    authenticate,
    authorizeRoles("seller"),
    csrfProtection,
    sellerController.deleteProfile
  );

// Dashboard
// GET /api/seller/dashboard/stats?days=30
router.get(
  "/dashboard/stats",
  authorizeRoles("seller"),
  sellerController.getDashboardStats
);
// GET /api/seller/dashboard/sales-analytics?days=90
router.get(
  "/dashboard/sales-analytics",
  authorizeRoles("seller"),
  sellerController.getSalesAnalytics
);
// GET /api/seller/dashboard/top-products?days=30
router.get(
  "/dashboard/top-products",
  authorizeRoles("seller"),
  sellerController.getTopProducts
);
// GET /api/seller/dashboard/category-performance?days=30
router.get(
  "/dashboard/category-performance",
  authorizeRoles("seller"),
  sellerController.getCategoryPerformance
);

export default router;
