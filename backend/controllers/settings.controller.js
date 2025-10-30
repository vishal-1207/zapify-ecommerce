import asyncHandler from "../utils/asyncHandler.js";
import * as settingsService from "../services/settings.service.js";

/**
 * Controller to update the settings of the currently logged-in user.
 */
export const updateUserSettings = asyncHandler(async (req, res) => {
  const updatedUser = await settingsService.updateSellerSettings(
    req.user.id,
    req.body
  );
  return res
    .status(200)
    .json({ message: "User settings updated successfully.", updatedUser });
});

/**
 * Controller for a seller to update their own settings.
 */
export const updateSellerSettings = asyncHandler(async (req, res) => {
  const updatedSeller = await settingsService.updateSellerSettings(
    req.user.id,
    req.body
  );
  return res
    .status(200)
    .json({ message: "Seller settings updated successfully.", updatedSeller });
});
