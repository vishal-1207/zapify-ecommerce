import db from "../models/index.js";
import uploadToCloudinary from "../utils/uploadMedia.js";
import ApiError from "../utils/ApiError.js";

const Category = db.Category;

export const createCategory = async (data) => {
  const { name, file } = data;
  const existingCategory = await Cateogry.findOne({
    where: { name },
  });

  if (existingCategory) {
    throw new ApiError(409, "Category already exists.");
  }

  const uploadResult = await uploadToCloudinary(file.path, "categories");

  const category = await Category.create({
    name,
    imageUrl: uploadResult.secure_url,
    imagePublicId: uploadResult.public_id,
  });

  return category;
};
