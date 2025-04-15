import db from "../models/index.js";
import * as authService from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.utils.js";

export const register = asyncHandler(async (req, res) => {
  try {
    const user = await authService.createUser(req.body);
    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const { accessToken, user } = await authService.findUser(req.body);
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
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: err.message });
  }
});

export const refreshTokenHander = asyncHandler(async (req, res) => {
  try {
    const { refreshToken } = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      throw new Error(401, "Unauthorized access.");
    }
    const payload = jwt.verfy(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const storedToken = await db.RefreshToken.findByPk(payload.tokenId);
    if (!storedToken) throw new Error("Invalid refresh token");

    await storedToken.destroy();

    const accessToken = generateAccessToken(payload.userId);
    await generateRefreshToken(payload.userId);
    res.json({ accessToken }, { message: "Access token refreshed." });
  } catch (error) {
    res.status(403).json({ message: "Ivalid or expired token." });
  }
});

export const logout = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    const payload = await jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    await db.RefreshToken.destroy({ where: { tokenId: payload.tokenId } });

    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Logout failed." });
  }
});
