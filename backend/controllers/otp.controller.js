import asyncHandler from "../utils/asyncHandler.js";
import * as otpServices from "../services/otp.service.js";

export const sendOtpController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await otpServices.sendVerificationOtp(userId);
  return res.status(200).json({ message: result.message, result });
});

export const verifyOtpController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  const result = await verifyOtp(userId, code);
  return res.status(200).json({ message: result.message, result });
});
