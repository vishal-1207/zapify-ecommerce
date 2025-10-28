import db from "../models/index.js";
import * as userServices from "../services/user.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const User = db.User;

/**
 * Fetches the profile of the currently authenticated user.
 */
export const currentUserDetailsController = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: {
      exclude: [
        "password",
        "verificationCode",
        "verificationCodeExpiry",
        "passwordResetToken",
        "passwordResetExpires",
        "scheduledForDeletionAt",
      ],
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

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

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await userServices.forgotPassword(email);
  return res.status(200).json({ message: result.message, result });
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
