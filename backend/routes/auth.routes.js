import express from "express";
import {
  login,
  logout,
  refreshTokenHander,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";
import { csrfProtection } from "../middleware/csrf.middleware.js";

const router = express.Router();

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests.",
});

router.route("/register").post(csrfProtection, register);
router.route("/admin/login").post(csrfProtection, login);
router.route("/login").post(csrfProtection, login);
router
  .route("/access-token")
  .post(csrfProtection, refreshLimiter, refreshTokenHander);
router.route("/logout").post(authenticate, csrfProtection, logout);

export default router;
