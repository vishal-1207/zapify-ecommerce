import express from "express";
import * as authControllers from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../utils/validationSchema.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/login")
  .post(csrfProtection, validate(loginSchema), authControllers.loginController);
router
  .route("/logout")
  .post(
    validate(registerSchema),
    csrfProtection,
    authControllers.logoutController
  );

export default router;
