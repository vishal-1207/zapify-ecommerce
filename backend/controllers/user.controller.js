import db from "../models/index.js";
import { updateUserProfile } from "../services/user.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const User = db.User;

export const currentUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.json({ message: "User details fetched successfully.", user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  const userId = req.user.id;

  const updatedProfile = await updateUserProfile(userId, data);

  res.status(200).json({
    message: "Profile updated successfully.",
    user: updatedProfile,
  });
});
