import express from "express";
import * as otpControllers from "../controllers/otp.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/-send-phone-code")
  .post(otpControllers.sendPhoneVerificationController);
router.route("/verify-phone").post(otpControllers.verifyPhoneController);
router
  .route("/send-email-code")
  .post(otpControllers.sendEmailVerificationController);
router.route("/verify-email").post(otpControllers.verifyEmailController);

export default router;
