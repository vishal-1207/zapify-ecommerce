import { verifyCSRF } from "../utils/csrf.utils.js";
import asyncHandler from "../utils/asyncHandler.js";

const csrfProtection = asyncHandler(async (req, res, next) => {
  const token = req.headers["x-csrf-token"];
  const secret = req.cookies.csrf_secret;

  if (!token || !secret || !verifyCSRF(secret, token)) {
    return res.status(403).json({
      message: "Invalid CSRF token.",
    });
  }

  next();
});

export default csrfProtection;
