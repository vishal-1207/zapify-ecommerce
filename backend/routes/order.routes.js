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

// User-initiated cancel (pending/processing only)
router.route("/:orderId/cancel").patch(orderControllers.cancelOrder);

// User-initiated return request (delivered, within 7 days)
router.route("/:orderId/return").post(orderControllers.requestReturn);

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
