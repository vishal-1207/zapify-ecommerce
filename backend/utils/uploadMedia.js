import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import ApiError from "./ApiError.js";

const uploadToCloudinary = async (filepath, folder = "products") => {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
      folder,
    });
    try {
      fs.unlinkSync(filepath);
    } catch (unlinkErr) {
      console.warn("Failed to delete temp file:", unlinkErr.message);
    }
    return result;
  } catch (err) {
    throw new ApiError(502, "Cloudinary upload failed: " + err.message);
  }
};

export default uploadToCloudinary;
