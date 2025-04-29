import db from "../models/index.js";
import uploadToCloudinary from "../utils/uploadMedia.js";
import ApiError from "../utils/ApiError.js";
import fs from "fs";

const Category = db.Category;
const Media = db.Media;

export const createCategory = async (data) => {
  const { name, image } = data;
  const existingCategory = await Category.findOne({
    where: { name },
  });

  if (existingCategory) {
    throw new ApiError(409, "Category already exists.");
  }

  const uploadResult = await uploadToCloudinary(image.path, "categories");

  const category = await Category.create({
    name,
  });

  const media = await Media.create({
    publicId: uploadResult.public_id,
    url: uploadResult.secure_url,
    fileType: uploadResult.resource_type,
    tag: "thumbnail",
    associatedType: "category",
    associatedId: category.id,
  });

  return { category, media };
};
