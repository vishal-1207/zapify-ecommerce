import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const uploadToCloudinary = async (filepath, folder = "products") => {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
      folder,
    });
    fs.unlinkSync(filepath);
    return result;
  } catch (err) {
    throw new Error("Cloudinary upload failed: " + err.message);
  }
};

export default uploadToCloudinary;
