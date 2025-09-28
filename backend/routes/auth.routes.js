import express from "express";
import {
  login,
  logout,
  refreshTokenHander,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../utils/validationSchema.js";
import passport from "passport";
import { socialCallbackHandler } from "../controllers/auth.controller.js";
import { limiter } from "../utils/rateLimiter.util.js";

const router = express.Router();
router.use(authenticate);

//Register route
router
  .route("/register")
  .post(csrfProtection, validate(registerSchema), limiter, register);

//Login routes for admin and user
router
  .route("/admin/login")
  .post(csrfProtection, validate(loginSchema), limiter, login);
router
  .route("/login")
  .post(csrfProtection, validate(loginSchema), limiter, login);

//Social auth routes
router
  .route("/google")
  .get(passport.authenticate("google", { scope: ["profile", "email"] }));
router
  .route("/google/callback")
  .get(
    passport.authenticate("google", { session: false }),
    socialCallbackHandler
  );

// GitHub OAuth
router
  .route("/github")
  .get(passport.authenticate("github", { scope: ["user:email"] }));
router
  .route("/github/callback")
  .get(
    passport.authenticate("github", { session: false }),
    socialCallbackHandler
  );

router.route("/access-token").post(csrfProtection, limiter, refreshTokenHander);
router.route("/logout").post(csrfProtection, logout);

export default router;
