import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();
router.use(authenticate, authorizeRoles("admin"));

// --- Dashboard & Stats Routes ---
router.route("/stats").get(adminController.getDashboardStats);
router.route("/stats/sales-over-time").get(adminController.getSalesOverTime);
router
  .route("/stats/sales-by-category")
  .get(adminController.getSalesByCategory);

router.route("/stats/signup-analytics").get(adminController.getSignupAnalytics);

router
  .route("/stats/order-activity")
  .get(adminController.getOrderActivityAnalytics);

router.route("/list/:role").get(adminController.getUsers);

export default router;
