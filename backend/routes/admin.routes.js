import express from "express";
import { login, logout } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../utils/validationSchema.js";

const router = express.Router();

router.route("/login").post(csrfProtection, validate(loginSchema), login);
router
  .route("/logout")
  .post(authenticate, validate(registerSchema), csrfProtection, logout);

export default router;
