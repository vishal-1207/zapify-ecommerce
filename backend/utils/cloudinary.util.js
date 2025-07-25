import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import ApiError from "./ApiError.js";
import path from "path";

const uploadToCloudinary = async (filepath, folder = "products") => {
  try {
    const absolutePath = path.resolve(filepath);
    const result = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
      folder,
    });
    try {
      fs.unlinkSync(absolutePath);
    } catch (unlinkErr) {
      console.warn("Failed to delete temporary file:", unlinkErr.message);
    }
    return result;
  } catch (err) {
    throw new ApiError(502, "Cloudinary upload failed: " + err.message);
  }
};

export default uploadToCloudinary;
