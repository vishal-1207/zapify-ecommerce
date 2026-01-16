import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import ApiError from "./ApiError.js";
import path from "path";

/**
 * Uploads a local file to Cloudinary and deletes the local temporary file.
 * @param {string} localFilePath - The path to the file saved by Multer.
 * @param {string} folder - The destination folder in Cloudinary.
 * @returns {Promise<object>} The Cloudinary upload result.
 */
const uploadToCloudinary = async (localFilePath, folder = "products") => {
  try {
    if (!localFilePath) return null;

    const absolutePath = path.resolve(localFilePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found at path: ${absolutePath}`);
    }

    // We use the absolute path for reliability
    const response = await cloudinary.uploader.upload(absolutePath, {
      resource_type: "auto",
      folder: folder,
    });

    // Standard fs.unlink(path) requires a callback and will cause issues here
    try {
      await fs.promises.unlink(absolutePath);
    } catch (unlinkErr) {
      console.warn(
        "⚠️ Cleanup Warning: Failed to delete temporary file:",
        unlinkErr.message
      );
    }

    return response;
  } catch (error) {
    // If the upload failed, we still want to remove the temp file to avoid disk bloating
    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (e) {}
    }

    console.error("❌ Cloudinary Utility Error:", error.message);
    throw new ApiError(502, "Cloudinary upload failed: " + error.message);
  }
};

export default uploadToCloudinary;
