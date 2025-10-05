import express from "express";
import * as otpControllers from "../controllers/otp.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

router.route("/send").post(otpControllers.sendOtpController);
router.route("verify").post(otpControllers.verifyOtpController);

export default router;
