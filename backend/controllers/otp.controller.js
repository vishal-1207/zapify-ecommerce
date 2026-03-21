import asyncHandler from "../utils/asyncHandler.js";
import * as otpServices from "../services/otp.service.js";
import db from "../models/index.js";

export const sendPhoneVerificationController = asyncHandler(
  async (req, res) => {
    const result = await otpServices.sendVerificationCode(req.user.id, "sms");
    return res.status(200).json({ message: result.message, result });
  }
);

export const verifyPhoneController = asyncHandler(async (req, res) => {
  const { code } = req.body;
  await otpServices.verifyCode(req.user.id, code, "sms");

  await db.User.update(
    { isPhoneVerified: true },
    { where: { id: req.user.id }, validate: false }
  );

  return res
    .status(200)
    .json({ message: "Phone number verified successfully." });
});

export const sendEmailVerificationController = asyncHandler(
  async (req, res) => {
    const result = await otpServices.sendVerificationCode(req.user.id, "email");
    return res.status(200).json({ message: result.message, result });
  }
);

export const verifyEmailController = asyncHandler(async (req, res) => {
  const { code } = req.body;
  await otpServices.verifyCode(req.user.id, code, "email");

  await db.User.update(
    { isEmailVerified: true },
    { where: { id: req.user.id }, validate: false }
  );

  return res.status(200).json({ message: "Email verified successfully." });
});
