import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";

const UserSettings = db.UserSettings;

export const getUserSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const settings = await UserSettings.findOne({ where: { userId } });
  if (!settings) throw new ApiError(404, "Settings not found for this user.");
  res.json({ message: "User settings fetched successfully.", settings });
});

export const updateUserSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const settingsData = req.body;

  const settings = await UserSettings.findOne({ where: { userId } });
  if (!settings) throw new ApiError(404, "Settings not found for this user.");
  await settings.update(settingsData);
  res.json({ message: "User settings updated successfully.", settings });
});
