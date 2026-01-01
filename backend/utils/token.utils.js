import db from "../models/index.js";
import { v4 as uuid4 } from "uuid";
import jwt from "jsonwebtoken";

const RefreshToken = db.RefreshToken;

const generateTokens = async (user, transaction = null) => {
  const payload = { id: user.id, roles: user.roles };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });

  const tokenId = uuid4();
  const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const refreshToken = jwt.sign(
    { tokenId, ...payload },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );

  await RefreshToken.create(
    {
      tokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
    { transaction }
  );

  return { accessToken, refreshToken };
};

export default generateTokens;
