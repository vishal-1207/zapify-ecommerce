import express from "express";
import {
  apply,
  getDashboardInfo,
  getRecentOrders,
} from "../controllers/affiliate.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/apply", apply);

router.get("/dashboard", getDashboardInfo);

router.get("/orders", getRecentOrders);

export default router;
