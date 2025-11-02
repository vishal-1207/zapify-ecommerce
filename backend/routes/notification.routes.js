import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as notificationController from "../controllers/notification.controller.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .get(notificationController.getMyNotifications)
  .patch(notificationController.markAsRead)
  .delete(notificationController.clearAll);

export default router;
