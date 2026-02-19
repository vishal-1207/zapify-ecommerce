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
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        const message = info?.message || "Authentication failed";
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(
          `${frontendUrl}/login?error=${encodeURIComponent(message)}`
        );
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  authControllers.socialCallbackHandler
);

// GitHub OAuth
router
  .route("/github")
  .get(passport.authenticate("github", { scope: ["user:email"] }));
router.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        const message = info?.message || "Authentication failed";
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(
          `${frontendUrl}/login?error=${encodeURIComponent(message)}`
        );
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  authControllers.socialCallbackHandler
);

router.post("/social/exchange", authControllers.exchangeTicket);

router
  .route("/refresh-token")
  .post(csrfProtection, limiter, authControllers.refreshAccessToken);
router
  .route("/logout")
  .post(authenticate, csrfProtection, authControllers.logoutController);

export default router;
