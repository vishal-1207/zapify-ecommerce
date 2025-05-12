import db from "../models/index.js";
import { v4 as uuid4 } from "uuid";
import jwt from "jsonwebtoken";

const RefreshToken = db.RefreshToken;

export const generateAccessToken = ({ id, role }) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
  return accessToken;
};

export const generateRefreshToken = async ({ id, role }) => {
  const tokenId = uuid4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = jwt.sign(
    { tokenId, id, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

  await RefreshToken.create({
    tokenId,
    userId: id,
    token,
    expiresAt,
  });
  return token;
};
