import db from "../models/index.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import { reSyncProductsByCriteria } from "./algolia.service.js";

/**
 * Category service to create or add a products category.
 */
export const addCategory = async (name, file) => {
  const existingCategory = await db.Category.findOne({ name });
  if (existingCategory)
    throw new ApiError(404, `${name} category already exists.`);

  try {
    const transaction = await db.sequelize.transaction();
    const newCategory = await db.Category.create({ name }, { transaction });

    if (file) {
      const upload = await uploadToCloudinary(
        file.path,
        process.env.CLOUDINARY_CATEGORY_FOLDER,
      );
      await db.Media.create(
        {
          publicId: upload.public_id,
          url: upload.secure_url,
          fileType: upload.resource_type,
          tag: "thumbnail",
          associatedType: "category",
          associatedId: newCategory.id,
        },
        { transaction },
      );
    }

    await transaction.commit();
    return newCategory;
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to create category.", error);
  }
};

/**
 * Category service to update details of a category.
 */
export const updateCategory = async (data, file) => {
  const { id, name } = data;

  const category = await db.Category.findByPk(id, {
    include: [{ model: db.Media, as: "media" }],
  });

  if (!category) throw new ApiError(404, "Category not found.");

  try {
    const transaction = await db.sequelize.transaction();
    if (name) {
      category.name = name;
    }

    if (file) {
      if (category.media) {
        await cloudinary.uploader.destroy(category.media.publicId);
        await category.media.destroy({ transaction });
      }
      const upload = await uploadToCloudinary(
        file.path,
        process.env.CLOUDINARY_CATEGORY_FOLDER,
      );
      await db.Media.create(
        {
          publicId: upload.public_id,
          url: upload.secure_url,
          fileType: upload.resource_type,
          tag: "thumbnail",
          associatedType: "category",
          associatedId: category.id,
        },
        { transaction },
      );
    }

    await category.save({ transaction });
    await transaction.commit();
    return category;
  } catch (error) {
    await transaction.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ApiError(409, "A category with this name already exists.");
    }
    throw new ApiError(500, "Failed to update category.", error);
  }
};

/**
 * Category service to delete or remove a category.
 */
export const deleteCategory = async (id) => {
  const category = await db.Category.findByPk(id, {
    include: ["media"],
  });
  if (!category) throw new ApiError(404, "Category not found.");

  try {
    const transaction = await db.sequelize.transaction();

    const productCount = await db.Product.count({
      where: { categoryId: id },
      transaction,
    });
    if (productCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete category. This category has ${productCount} associated products.`,
      );
    }

    if (category.media) {
      await cloudinary.uploader.destroy(category.media.publicId);
      await category.media.destroy({ transaction });
    }

    await category.destroy({ transaction });
    await transaction.commit();
    return { message: "Category deleted." };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to delete category.", error);
  }
};
