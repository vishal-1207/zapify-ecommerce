import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const currentUserDetails = asyncHandler(async (req, res) => {
  const user = await db.User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.json({ message: "User details fetched successfully.", user });
});
