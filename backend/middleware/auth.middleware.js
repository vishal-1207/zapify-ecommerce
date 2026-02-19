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

    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT Secret is not defined in environment variables.");
      throw new ApiError(
        500,
        "Internal Server Error: Auth configuration missing."
      );
    }

    const decoded = jwt.verify(token, secret);
    const cacheKey = `user_session:${decoded.id}`;

    let user;
    const cachedUser = await getCache(cacheKey);

    if (cachedUser) {
      try {
        user =
          typeof cachedUser === "string" ? JSON.parse(cachedUser) : cachedUser;
      } catch (parseError) {
        user = cachedUser;
      }
    }

    // If not in cache or parsing failed, fetch from DB
    if (!user || !user.id) {
      // Fetch from DB if not in cache
      // We exclude sensitive fields but keep 'roles' for the authorizeRoles middleware
      user = await db.User.findByPk(decoded.id, {
        attributes: {
          exclude: ["password", "verificationCode", "verificationCodeExpiry"],
        },
        raw: true,
      });

      if (!user) {
        throw new ApiError(401, "User no longer exists.");
      }

      // Store in Redis for 10 minutes (600 seconds)
      await setCache(cacheKey, JSON.stringify(user), 3600);
    }

    // Ensure roles is an array
    if (user && typeof user.roles === 'string') {
        try {
            user.roles = JSON.parse(user.roles);
        } catch (e) {
            console.error("Failed to parse user roles:", e);
            user.roles = ["user"];
        }
    }
    
    // Fallback if roles is missing
    if (user && !user.roles) {
        user.roles = ["user"];
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
