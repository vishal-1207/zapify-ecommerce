import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import db from "../models/index.js";

//Authenticate Middleware
const authenticate = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookie?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Access token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    req.user = user;
    next();
  } catch (error) {
    console.log("Auth middleware error: ", error.message);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
});

export default authenticate;
