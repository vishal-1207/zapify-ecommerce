import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = async (filepath, folder = "products") => {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
      folder,
    });
    return result;
  } catch (err) {
    throw new Error("Cloudinary upload failed: " + err.message);
  }
};

export default uploadToCloudinary;
