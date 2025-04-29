import express from "express";
import { login, logout } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";

const router = express.Router();

router.route("/login").post(csrfProtection, login);
router.route("/logout").post(authenticate, csrfProtection, logout);

export default router;
