import db from "../models/index.js";
import { v4 as uuid4 } from "uuid";
import jwt from "jsonwebtoken";

const RefreshToken = db.RefreshToken;

export const generateAccessToken = async (userData) => {
  const accessToken = jwt.sign(
    { id: userData?.id, role: userData?.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
  return accessToken;
};

export const generateRefreshToken = async (id, role) => {
  const tokenId = uuid4();
  const expiresAt = new Date(Date.now(+7 * 24 * 60 * 60 * 1000));

  const token = jwt.sign(
    { tokenId, id, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  await RefreshToken.create({
    tokenId,
    userId: id,
    expiresAt,
  });
  return token;
};
