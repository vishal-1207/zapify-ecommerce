import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";
import * as sellerController from "../controllers/seller.controller.js";
import { getSellerTransactions } from "../services/payment.service.js";
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
    sellerController.createSellerProfile,
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
    sellerController.updateSellerProfile,
  );

router
  .route("/:slug/delete/profile")
  .delete(
    authorizeRoles("seller"),
    csrfProtection,
    sellerController.deleteSellerProfile,
  );

// Dashboard
router.get(
  "/dashboard/stats",
  authorizeRoles("seller"),
  sellerController.getSellerDashboardStats,
);
router.get(
  "/dashboard/sales-analytics",
  authorizeRoles("seller"),
  sellerController.getSellerSalesAnalytics,
);
router.get(
  "/dashboard/top-products",
  authorizeRoles("seller"),
  sellerController.getSellerTopProducts,
);
router.get(
  "/dashboard/category-performance",
  authorizeRoles("seller"),
  sellerController.getSellerCategoryPerformance,
);

router.get("/transactions", authorizeRoles("seller"), getSellerTransactions);

export default router;
