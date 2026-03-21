import db from "../models/index.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import { reSyncProductsByCriteria } from "./algolia.service.js";
import slugify from "slugify";
import { nanoid } from "nanoid";

/**
 * Fetches all categories.
 */
export const getAllCategories = async ({ includeInactive = false } = {}) => {
  const where = {};
  if (!includeInactive) {
    where.isActive = true;
  }

  const categories = await db.Category.findAll({
    where,
    attributes: ["id", "name", "slug", "isActive"],
    order: [["name", "ASC"]],
    include: [
      {
        model: db.Media,
        as: "media",
        attributes: ["id", "publicId", "url", "fileType", "tag"],
        where: {
          associatedType: "category",
        },
        required: false,
      },
    ],
  });

  for (const cat of categories) {
      if (!cat.slug) {
          const newSlug = `${slugify(cat.name, { lower: true, strict: true })}-${nanoid(6)}`;
          cat.slug = newSlug;
          await db.Category.update({ slug: newSlug }, { where: { id: cat.id } });
      }
  }

  return categories;
};
/**
 * Category service to create or add a products category.
 */
import { processBackgroundUpload } from "./worker.service.js";

/**
 * Category service to create or add a products category.
 */
export const addCategory = async (name, file) => {
  const existingCategory = await db.Category.findOne({ where: { name } });
  
  if (existingCategory) {
    if (existingCategory.isActive === false) {
       existingCategory.isActive = true;
       await existingCategory.save();
       return existingCategory;
    }
    throw new ApiError(409, `${name} category already exists.`);
  }

  try {
    const transaction = await db.sequelize.transaction();
    const newCategory = await db.Category.create({ name }, { transaction });

    await transaction.commit();

    if (file) {
      processBackgroundUpload({
        filePath: file.path,
        folder: process.env.CLOUDINARY_CATEGORY_FOLDER,
        associatedType: "category",
        associatedId: newCategory.id,
      }).catch(err => console.error("Background upload failed:", err));
    }

    return newCategory;
  } catch (error) {
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
        
        await category.media.destroy({ transaction });
        
        // TODO: Ideally queue Cloudinary deletion for category.media.publicId
      }
      
      processBackgroundUpload({
        filePath: file.path,
        folder: process.env.CLOUDINARY_CATEGORY_FOLDER,
        associatedType: "category",
        associatedId: category.id,
      }).catch(err => console.error("Background upload failed:", err));
    }

    await category.save({ transaction });
    await transaction.commit();
    return category;
  } catch (error) {
    if (transaction) await transaction.rollback(); // Transaction variable might not be defined here if error before transaction
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
  const category = await db.Category.findByPk(id);
  if (!category) throw new ApiError(404, "Category not found.");

  try {
    await category.destroy();
    return { message: "Category deleted." };
  } catch (error) {
    throw new ApiError(500, "Failed to delete category.", error);
  }
};

export const toggleCategoryStatus = async (id) => {
  const category = await db.Category.findByPk(id);
  if (!category) throw new ApiError(404, "Category not found.");

  category.isActive = !category.isActive;
  await category.save();

  return category;
};
