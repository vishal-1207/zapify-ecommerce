import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const User = db.User;

export const currentUserDetails = asyncHandler(async (req, res) => {
  const user = await db.User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.json({ message: "User details fetched successfully.", user });
});

//DUMMY FUNCTION TO UPDATE PROFILE

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByPk(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (name) user.name = name;
  if (email) user.email = email;
  await user.save();
  res.status(200).json({
    message: "Profile updated successfully.",
    user,
  });
});
