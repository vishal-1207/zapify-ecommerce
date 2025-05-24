import db from "../models/index.js";
import * as authService from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.utils.js";
import { loginSchema, registerSchema } from "../utils/validationSchema.js";
import ApiError from "../utils/ApiError.js";

export const register = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  const user = await authService.createUser({
    fullname,
    username,
    email,
    password,
  });

  res.status(201).json({ message: "User registered", user });
});

export const login = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  const { accessToken, user } = await authService.findUser({
    userId,
    password,
  });

  const refreshToken = await generateRefreshToken(user?.id, user?.role);
  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ message: "Login successfull", accessToken, user });
});

export const refreshTokenHander = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, "Unauthorized access.");
  }
  const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  const storedToken = await db.RefreshToken.findByPk(payload.tokenId);
  if (!storedToken) throw new Error("Invalid refresh token");

  await storedToken.destroy();

  const accessToken = generateAccessToken(payload.userId);
  const newRefreshToken = await generateRefreshToken(payload.userId);

  res
    .cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ accessToken, message: "Access token refreshed." });
});

export const logout = asyncHandler(async (req, res) => {
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

  res.status(200).json({ message: "Logged out successfully." });
});
