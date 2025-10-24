import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getMyNotifications,
  markAsRead,
  clearAll,
} from "../controllers/notification.controller.js";

const router = express.Router();
router.use(authenticate);

router.route("/").get(getMyNotifications).patch(markAsRead).delete(clearAll);

export default router;
