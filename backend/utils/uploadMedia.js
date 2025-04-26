import cloudinary from "../config/cloudinary.js";
import fs from "fs";

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
    throw new Error("Cloudinary upload failed: " + err.message);
  }
};

export default uploadToCloudinary;
