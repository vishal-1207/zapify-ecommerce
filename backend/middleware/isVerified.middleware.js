import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const isVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    throw new ApiError(
      403,
      "Please verify your email address to proceed with this action."
    );
  }
  next();
});

export default isVerified;
