import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getCache, setCache } from "../utils/cache.js";

//Authenticate Middleware
const authenticate = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Access token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const cacheKey = `user_session:${decoded.id}`;

    let user;
    const cachedUser = await getCache(cacheKey);

    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      user = await db.User.findByPk(decoded.id, {
        attributes: {
          exclude: [
            "password",
            "verificationCode",
            "verificationCodeExpiry",
            "passwordResetToken",
            "passwordResetExpires",
            "scheduledForDeletionAt",
          ],
          raw: true,
        },
      });

      if (!user) {
        throw new ApiError(401, "User no longer exists.");
      }

      await setCache(cacheKey, user, 3600);
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Auth middleware error: ", error.message);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please refresh session." });
    }
    return res.status(403).json({ message: "Invalid or malformed token." });
  }
});

export default authenticate;
