import db from "../models/index.js";
import { createUser, findUser } from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

export const register = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  const { user, accessToken } = await createUser(
    {
      fullname,
      username,
      email,
      password,
    },
    res
  );

  res.status(201).json({ message: "User registered", user, accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;
  const { user, accessToken } = await findUser({ userId, password }, res);
  res.status(200).json({ message: "Login successfull", user, accessToken });
});

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
