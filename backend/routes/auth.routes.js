import express from "express";
import {
  login,
  logout,
  refreshTokenHander,
  register,
} from "../controllers/auth.controller.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests.",
});

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/access-token").post(refreshLimiter, refreshTokenHander);
router.route("/logout").post(logout);

export default router;
