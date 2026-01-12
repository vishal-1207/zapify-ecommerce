import db from "../models/index.js";
import * as authServices from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import generateTokens from "../utils/token.utils.js";
import setTokensInCookies from "../utils/setTokensInCookies.js";

//Register Controller
export const registerController = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  const { user, tokens } = await authServices.registerService({
    fullname,
    username,
    email,
    password,
  });

  setTokensInCookies(res, tokens);

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

  setTokensInCookies(res, tokens);

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
  setTokensInCookies(res, tokens);
  return res.status(200).json({
    message: "Login successful.",
    user,
    accessToken: tokens.accessToken,
  });
});

// Token Handler Controller
export const refreshAccessToken = asyncHandler(async (req, res) => {
  // Look for token in cookies (browser) or body (Postman/Mobile)
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Refresh token is missing.");
  }

  const { user, accessToken, refreshToken } =
    await authService.refreshAccessToken(incomingToken);

  // Set new cookies (Rotation)
  setTokenCookies(res, accessToken, refreshToken);

  return res
    .status(200)
    .json({ message: "Token refreshed successfully.", user, accessToken });
});

//Logout Controller
export const logoutController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token not found.");
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  if (!payload) {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  await db.RefreshToken.destroy({ where: { tokenId: payload.tokenId } });

  return res.status(200).json({ message: "Logged out successfully." });
});
