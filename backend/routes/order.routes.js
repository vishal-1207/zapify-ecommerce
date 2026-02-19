import express from "express";
import * as orderControllers from "../controllers/order.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

import isVerified from "../middleware/isVerified.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .post(isVerified, orderControllers.placeOrder)
  .get(orderControllers.getOrdersForCustomer);

router.route("/:orderId").get(orderControllers.getOrderDetailsForCustomer);

router
  .route("/:orderId/tracking")
  .get(orderControllers.getOrderTrackingDetails);

router
  .route("/:sellerId")
  .get(authorizeRoles("seller"), orderControllers.getOrdersForFulfillment);
router
  .route("/:sellerId/order-history")
  .get(authorizeRoles("seller"), orderControllers.getSellerOrdersHistory);

router
  .route("/:orderItemId")
  .patch(authorizeRoles("seller"), orderControllers.updateOrderStatus);

export default router;
