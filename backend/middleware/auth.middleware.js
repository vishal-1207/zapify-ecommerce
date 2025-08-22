import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

//Authenticate Middleware
export const authenticate = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookie?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Access token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, roles: decoded.roles };
    next();
  } catch (error) {
    console.log("Auth middleware error: ", error.message);
    res.status(403).json({ message: "Invalid or expired token." });
  }
});
