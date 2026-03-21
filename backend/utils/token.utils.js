import db from "../models/index.js";
import { v4 as uuid4 } from "uuid";
import jwt from "jsonwebtoken";
import ms from "ms";

const RefreshToken = db.RefreshToken;

/**
 * Signs and returns a new access token only.
 * No DB interaction — lightweight, used when a valid refresh token already exists.
 */
export const generateAccessToken = (user) => {
  const payload = { id: user.id, roles: user.roles };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

/**
 * Creates a brand-new session: signs both tokens and stores the refresh token in DB.
 * Used on first login / registration / after refresh token expiry.
 */
export const generateFullSession = async (user, transaction = null) => {
  const payload = { id: user.id, roles: user.roles };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });

  const tokenId = uuid4();
  const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY || "10d";
  const expiresAt = new Date(Date.now() + ms(refreshExpiry));

  const refreshToken = jwt.sign(
    { tokenId, ...payload },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: refreshExpiry },
  );

  await RefreshToken.create(
    { tokenId, userId: user.id, token: refreshToken, expiresAt },
    { transaction },
  );

  return { accessToken, refreshToken };
};

export default generateFullSession;
