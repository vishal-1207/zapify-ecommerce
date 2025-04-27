import express from "express";
import {
  addCategory,
  getCategories,
} from "../controllers/category.controller.js";
import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";

const router = express.Router();

router.route("/").get(getCategories);
router.route("/").post(authenticate, isAdmin, csrfProtection, addCategory);

export default router;
