import asyncHandler from "../utils/asyncHandler.js";
import * as otpServices from "../services/otp.service.js";
import db from "../models/index.js";

// To send the code to the user's phone
export const sendPhoneVerificationController = asyncHandler(
  async (req, res) => {
    const result = await otpServices.sendVerificationCode(req.user.id, "sms");
    return res.status(200).json({ message: result.message, result });
  }
);

// To verify the code and update the phone status
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

// To send the code to the user's email
export const sendEmailVerificationController = asyncHandler(
  async (req, res) => {
    const result = await otpServices.sendVerificationCode(req.user.id, "email");
    return res.status(200).json({ message: result.message, result });
  }
);

// To verify the code and update the email status
export const verifyEmailController = asyncHandler(async (req, res) => {
  const { code } = req.body;
  await otpServices.verifyCode(req.user.id, code, "email");

  await db.User.update(
    { isEmailVerified: true },
    { where: { id: req.user.id }, validate: false }
  );

  return res.status(200).json({ message: "Email verified successfully." });
});
