import express from "express";
import * as orderControllers from "../controllers/order.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .post(orderControllers.placeOrder)
  .get(orderControllers.getUserOrders);

router.route("/:orderId").get(orderControllers.getUserOrderDetails);

router.route("/:orderId/tracking").get(orderControllers.getOrderTracking);

router
  .route("/:sellerId")
  .get(
    authorizeRoles("seller"),
    orderControllers.getOrderDetailsForFulfillment
  );
router
  .route("/:sellerId/order-history")
  .get(authorizeRoles("seller"), orderControllers.orderHistoryForSeller);

router
  .route("/:orderItemId")
  .patch(authorizeRoles("seller"), orderControllers.updateOrderStatus);

export default router;
