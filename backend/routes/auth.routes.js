import express from "express";
import * as authControllers from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../utils/validationSchema.js";
import passport from "passport";
import { limiter } from "../utils/rateLimiter.util.js";

const router = express.Router();

//Register route
router
  .route("/register")
  .post(
    csrfProtection,
    validate(registerSchema),
    limiter,
    authControllers.registerController,
  );

//Login routes for admin and user
router
  .route("/admin/login")
  .post(
    csrfProtection,
    validate(loginSchema),
    limiter,
    authControllers.loginController,
  );
router
  .route("/login")
  .post(
    csrfProtection,
    validate(loginSchema),
    limiter,
    authControllers.loginController,
  );

router
  .route("/forgot-password")
  .post(csrfProtection, limiter, authControllers.forgotPasswordController);

router
  .route("/reset-password/:token")
  .post(csrfProtection, limiter, authControllers.resetPasswordController);

//Social auth routes
router
  .route("/google")
  .get(passport.authenticate("google", { scope: ["profile", "email"] }));
router
  .route("/google/callback")
  .get(
    passport.authenticate("google", { session: false }),
    authControllers.socialCallbackHandler,
  );

// GitHub OAuth
router
  .route("/github")
  .get(passport.authenticate("github", { scope: ["user:email"] }));
router
  .route("/github/callback")
  .get(
    passport.authenticate("github", { session: false }),
    authControllers.socialCallbackHandler,
  );

router
  .route("/refresh-token")
  .post(csrfProtection, limiter, authControllers.refreshAccessToken);
router
  .route("/logout")
  .post(authenticate, csrfProtection, authControllers.logoutController);

export default router;
