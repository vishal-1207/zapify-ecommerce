import db from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Updates the settings for the currently authenticated user.
 * @param {string} userId - The ID of the user.
 * @param {object} newSettings - An object containing the settings to update.
 * @returns {Promise<User>} The updated user object.
 */
export const updateUserSettings = async (userId, newSettings) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const updatedSettings = { ...user.settings, ...newSettings };
  user.settings = updatedSettings;

  user.changed("settings", true);
  await user.save();

  const userProfile = user.toJSON();
  delete userProfile.password;

  return userProfile;
};

/**
 * Updates the settings for the currently authenticated seller.
 * @param {string} userId - The ID of the authenticated user.
 * @param {object} newSettings - An object containing the settings to update.
 * @returns {Promise<SellerProfile>} The updated seller profile.
 */
export const updateSellerSettings = async (userId, newSettings) => {
  const profile = await db.SellerProfile.findOne({ where: { userId } });
  if (!profile) {
    throw new ApiError(404, "Seller profile not found for this user.");
  }

  const updatedSettings = { ...profile.settings, ...newSettings };
  profile.settings = updatedSettings;

  profile.changed("settings", true);
  await profile.save();

  return profile;
};
