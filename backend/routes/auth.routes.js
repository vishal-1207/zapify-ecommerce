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
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../utils/validationSchema.js";
import passport from "passport";

const router = express.Router();

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests.",
});

//Register route
router
  .route("/register")
  .post(csrfProtection.bind, validate(registerSchema), register);
//TODO: complete seller registation
router.route("/seller/register");

//Login routes
router.route("/admin/login").post(csrfProtection, validate(loginSchema), login);
router.route("/login").post(csrfProtection, login);

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

router
  .route("/access-token")
  .post(csrfProtection, refreshLimiter, refreshTokenHander);
router.route("/logout").post(authenticate, csrfProtection, logout);

export default router;
