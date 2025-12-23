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

  return res
    .status(200)
    .json({
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
export const refreshTokenHander = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!oldRefreshToken) {
    throw new ApiError(401, "Unauthorized access.");
  }
  const payload = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  if (!payload) {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const storedToken = await db.RefreshToken.findByPk(payload.tokenId);
  if (!storedToken) throw new Error("Invalid refresh token");

  await storedToken.destroy();

  const tokens = await generateTokens(payload.userId, payload.roles);
  setTokensInCookies(res, { ...tokens });
  res
    .cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 10 * 60 * 1000,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 10 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ accessToken, message: "Access token refreshed successfully." });
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
