import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";
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
    sellerController.createSellerProfile
  );

router
  .route("/profile")
  .get(authorizeRoles("seller"), sellerController.getSellerProfile);

router
  .route("/:slug/edit/profile")
  .patch(
    authorizeRoles("seller"),
    csrfProtection,
    validate(sellerProfileSchema),
    sellerController.updateSellerProfile
  );

router
  .route("/:slug/delete/profile")
  .delete(
    authorizeRoles("seller"),
    csrfProtection,
    sellerController.deleteSellerProfile
  );

// Dashboard
// GET /api/seller/dashboard/stats?days=30
router.get(
  "/dashboard/stats",
  authorizeRoles("seller"),
  sellerController.getSellerDashboardStats
);
// GET /api/seller/dashboard/sales-analytics?days=90
router.get(
  "/dashboard/sales-analytics",
  authorizeRoles("seller"),
  sellerController.getSellerSalesAnalytics
);
// GET /api/seller/dashboard/top-products?days=30
router.get(
  "/dashboard/top-products",
  authorizeRoles("seller"),
  sellerController.getSellerTopProducts
);
// GET /api/seller/dashboard/category-performance?days=30
router.get(
  "/dashboard/category-performance",
  authorizeRoles("seller"),
  sellerController.getSellerCategoryPerformance
);

export default router;
