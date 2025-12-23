import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

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

    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists.");
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
