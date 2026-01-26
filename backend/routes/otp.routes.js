import express from "express";
import * as otpControllers from "../controllers/otp.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { verifyCodeSchema } from "../utils/validationSchema.js";

const router = express.Router();
router.use(authenticate);

// router
//   .route("/send-code/phone")
//   .post(otpControllers.sendPhoneVerificationController);
// router.route("/phone/verify").post(otpControllers.verifyPhoneController);
router
  .route("/send-code/email")
  .post(otpControllers.sendEmailVerificationController);
router
  .route("/email/verify")
  .post(
    csrfProtection,
    validate(verifyCodeSchema),
    otpControllers.verifyEmailController,
  );

export default router;
