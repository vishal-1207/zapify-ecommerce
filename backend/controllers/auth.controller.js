import redisClient from "../config/redis.js";
import crypto from "crypto";
import db from "../models/index.js";
import * as authServices from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import generateTokens from "../utils/token.utils.js";
import setTokensInCookies from "../utils/setTokensInCookies.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user,
        accessToken: tokens.accessToken,
      },
      "Registration successful. Please verify email to continue using the website. Click on the button below to get code.",
    ),
  );
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

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        accessToken: tokens.accessToken,
      },
      "Login successfull",
    ),
  );
});

//Social Callback Handler Controller

//Social Callback Handler Controller
export const socialCallbackHandler = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(500, "Social oauth request failed.");
  }

  const tokens = await generateTokens(user);

  // Generate a unique ticket
  const ticket = crypto.randomUUID();

  // Store tokens in Redis with a short expiration (e.g., 10 seconds)
  await redisClient.set(`ticket:${ticket}`, JSON.stringify(tokens), {
    EX: 10, // Expires in 10 seconds
  });

  // Redirect to frontend with the ticket
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return res.redirect(`${frontendUrl}/?ticket=${ticket}`);
});

// Exchange Ticket Controller
export const exchangeTicket = asyncHandler(async (req, res) => {
  const { ticket } = req.body;

  if (!ticket) {
    throw new ApiError(400, "Ticket is required.");
  }

  // Retrieve tokens from Redis
  const tokensData = await redisClient.get(`ticket:${ticket}`);

  if (!tokensData) {
    throw new ApiError(400, "Invalid or expired ticket.");
  }

  const tokens = JSON.parse(tokensData);

  // Delete the ticket immediately after use (One-time use)
  await redisClient.del(`ticket:${ticket}`);

  const options = getCookieOptions();
  setTokensInCookies(res, tokens, options);

  // Fetch user to return with tokens
  // We need to decode the access token to get the user ID, or we could have stored the user ID in redis too.
  // But generateTokens returns { accessToken, refreshToken }. 
  // Let's decode the accessToken to find the user.
  const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
  const user = await db.User.findByPk(decoded.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        accessToken: tokens.accessToken,
      },
      "Login successful.",
    ),
  );
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

  return res
    .status(200)
    .json(new ApiResponse(200, { user, tokens }, "Token refreshed."));
});

// Forgot Password Controller
export const forgotPasswordController = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await authServices.forgotPasswordService(email);

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Password reset instructions sent to email."),
    );
});

// Reset Password Controller
export const resetPasswordController = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  await authServices.resetPasswordService(token, newPassword);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successful."));
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

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully."));
});
