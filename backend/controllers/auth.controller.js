import db from "../models/index.js";
import * as authServices from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import generateTokens from "../utils/token.utils.js";
import setTokensInCookies from "../utils/setTokensInCookies.js";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction || false,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
  };
};

//Register Controller
export const registerController = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  const { user, tokens } = await authServices.registerService({
    fullname,
    username,
    email,
    password,
  });

  const options = getCookieOptions();
  setTokensInCookies(res, tokens, options);

  return res.status(201).json({
    message:
      "Registration successful. Please verify email to continue using the website. Click on the button below to get code.",
    user,
    accessToken: tokens.accessToken,
  });
});

//Login Controller
export const loginController = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;
  const { user, tokens } = await authServices.loginService({
    userId,
    password,
  });

  const options = getCookieOptions();
  setTokensInCookies(res, tokens, options);

  return res.status(200).json({
    message: "Login successfull",
    user,
    accessToken: tokens.accessToken,
  });
});

//Social Callback Handler Controller
export const socialCallbackHandler = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(500, "Social oauth request failed.");
  }

  const tokens = await generateTokens(user.userId, user.roles);
  const options = getCookieOptions();
  setTokensInCookies(res, tokens, options);
  return res.status(200).json({
    message: "Login successful.",
    user,
    accessToken: tokens.accessToken,
  });
});

// Token Handler Controller
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingToken) throw new ApiError(401, "Refresh token missing.");

  const { user, accessToken, refreshToken } =
    await authServices.refreshAccessToken(incomingToken);

  const tokens = { accessToken, refreshToken };
  const options = getCookieOptions();
  setTokensInCookies(res, tokens, options);

  return res.status(200).json({ message: "Token refreshed.", user, tokens });
});

// Forgot Password Controller
export const forgotPasswordController = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await authServices.forgotPasswordService(email);

  return res
    .status(200)
    .json({ message: "Password reset instructions sent to email." });
});

// Reset Password Controller
export const resetPasswordController = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  await authServices.resetPasswordService(token, newPassword);

  return res.status(200).json({ message: "Password reset successful." });
});

//Logout Controller
export const logoutController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token not found.");
  }

  const options = getCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  if (!payload) {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  await db.RefreshToken.destroy({ where: { tokenId: payload.tokenId } });

  return res.status(200).json({ message: "Logged out successfully." });
});
