import db from "../models/index.js";
import * as userServices from "../services/user.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const User = db.User;

/**
 * Fetches the profile of the currently authenticated user.
 */
export const getCurrentUserController = asyncHandler(async (req, res) => {
  const user = req.user;
  res.json({ message: "User details fetched successfully.", user });
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  const userId = req.user.id;

  const updatedProfile = await userServices.updateUserProfile(userId, data);

  return res.status(200).json({
    message: "Profile updated successfully.",
    user: updatedProfile,
  });
});

export const deleteUserController = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await userServices.scheduleUserDeletion(userId, 30);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res
    .status(200)
    .json({ message: "Account deletion process initiated.", result });
});
