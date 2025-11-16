import db from "../models/index.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";

// CREATE CATEGORY SERVICE
export const createCategoryService = async (data, file) => {
  const name = data;
  const image = file.path;

  const existingCategory = await db.Category.findOne({
    where: { name },
  });

  if (existingCategory) {
    throw new ApiError(409, "Category already exists.");
  }

  const uploadResult = await uploadToCloudinary(
    image,
    process.env.CLOUDINARY_CATEGORY_FOLDER
  );

  const category = await db.Category.create({
    name,
  });

  const media = await db.Media.create({
    publicId: uploadResult.public_id,
    url: uploadResult.secure_url,
    fileType: uploadResult.resource_type,
    tag: "thumbnail",
    associatedType: "category",
    associatedId: category.id,
  });

  return { category, media };
};

// UPDATE CATEGORY SERVICE

export const updateCategoryService = async (data, file) => {
  const { id, name } = data;
  const image = file;

  const category = await db.Category.findByPk(id, {
    include: {
      model: db.Media,
      as: "media",
    },
  });

  if (!category) throw new ApiError(404, "Category not found.");

  if (name) category.name = name;

  let media = null;
  if (image) {
    const existingMedia = category.media;

    if (existingMedia) {
      if (existingMedia.publicId) {
        await cloudinary.uploader.destroy(existingMedia.publicId, {
          resource_type: "image",
        });
      }
      await existingMedia.destroy();
    }

    const uploadResult = await uploadToCloudinary(
      image.path,
      process.env.CLOUDINARY_CATEGORY_FOLDER
    );

    media = await Media.create({
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      fileType: uploadResult.resource_type,
      tag: "thumbnail",
      associatedType: "category",
      associatedId: category.id,
    });
  }

  await category.save();

  return { category, media };
};

// DELETE CATEGORY SERVICE
export const deleteCategoryService = async (data) => {
  const id = data;

  const category = await db.Category.findByPk(id, {
    include: { model: db.Media, as: "media" },
  });

  if (!category) {
    throw new ApiError(400, "Category not found.");
  }

  const media = category.media;
  if (media.publicId) {
    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.fileType || "image",
    });
  }

  // await media.destroy();
  await category.destroy();
};
