import db from "../models/index.js";
import sendSms from "../utils/smsUtility.js";
import sendMail from "../utils/mailUtility.js";
import ApiError from "../utils/ApiError.js";

/**
 * Generates a random 6-digit OTP and an expiry date.
 * @returns {object} An object containing the code and its expiry time.
 */
const generateCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
  return { code, expiry };
};

/**
 * Sends a verification OTP to a user's phone number.
 * @param {string} userId - The ID of the user to send the OTP to.
 */
export const sendVerificationCode = async (userId, method) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const { code, expiry } = generateCode();
  await db.User.update(
    {
      verificationCode: code,
      verificationCodeExpiry: expiry,
    },
    { where: { id: userId }, validate: false }
  );

  if (method === "email") {
    if (!user.email)
      throw new ApiError(400, "User does not have an email adderss.");

    const subject = "Your Verification Code";
    const html = `<p>Your verification code for <strong>Zapify</strong> is: <strong>${code}</strong>. It will expire in 10 minutes.</p>`;
    await sendMail(user.email, subject, html);
    return { message: "Verification code sent successfully to your email." };
  }

  if (method === "sms") {
    if (!user.phoneNumber)
      throw new ApiError(400, "User does not have a phone number.");
    const messageBody = `Your verification code for <Your Store Name> is: ${code}. It will expire in 10 minutes.`;
    // await sendSms(user.phoneNumber, messageBody);
    return { message: "Verification code sent successfully to your phone." };
  }
};

/**
 * Verifies a code submitted by a user.
 * If successful, it clears the code fields but does NOT update the verification status.
 * The calling controller is responsible for updating the appropriate status (isEmailVerified or isPhoneVerified).
 * @param {string} userId - The ID of the user.
 * @param {string} submittedCode - The code submitted by the user.
 */
export const verifyCode = async (userId, submittedCode, method) => {
  const user = await db.User.findByPk(userId);

  if (method === "email" && user.isEmailVerified) {
    throw new ApiError(
      400,
      "This email address is already verified. No further action is needed."
    );
  }
  if (method === "sms" && user.isPhoneVerified) {
    throw new ApiError(
      400,
      "This phone number is already verified. No further action is needed."
    );
  }

  if (!user || !user.verificationCode || !user.verificationCodeExpiry) {
    throw new ApiError(
      400,
      "No verification code found for this user or it has expired."
    );
  }

  if (new Date() > user.verificationCodeExpiry) {
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();
    throw new ApiError(400, "Code has expired. Please request a new one.");
  }

  if (user.verificationCode !== submittedCode) {
    throw new ApiError(400, "Invalid verification code.");
  }

  user.verificationCode = null;
  user.verificationCodeExpiry = null;
  await user.save();

  return { message: "Code verified successfully." };
};
