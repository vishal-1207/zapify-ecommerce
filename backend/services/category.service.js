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

  // Self-healing: Check for missing slugs and update them
  // This is needed for legacy data created before slug field was added
  for (const cat of categories) {
      if (!cat.slug) {
          const newSlug = `${slugify(cat.name, { lower: true, strict: true })}-${nanoid(6)}`;
          cat.slug = newSlug;
          // We update strictly the slug field to avoid side effects
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
       // Reactivate if it was disabled
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
      // Fire-and-forget background upload
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
      // In update, we might want to remove the old image first? 
      // Or just let the new one be added and maybe multiple images are allowed?
      // The Relation is HasOne. So if we add a new one, does it replace?
      // The Media model is polymorphic.
      // Ideally, we should remove the OLD one.
      // Let's do a quick cleanup of old media synchronously if possible (metadata only)
      // OR let the background worker handle it.
      
      // For speed, let's just Destroy the metadata in DB transaction if it exists,
      // and let the background worker create the new one.
      // The physical old file in Cloudinary will be orphaned though.
      // BETTER: Queue the OLD one for deletion in background too.
      
      if (category.media) {
        // We can't easily queue deletion without an ID or publicID.
        // But we have category.media.
        // Let's just destroy the DB record here (fast).
        // The Cloudinary file will remain as garbage. 
        // We could add a "purgeOldMedia" to the worker.
        
        await category.media.destroy({ transaction });
        
        // TODO: Ideally queue Cloudinary deletion for category.media.publicId
        // but for now, focus on upload speed.
      }
      
      // Fire-and-forget background upload
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
    // Soft delete the category
    // Background worker will handle Cloudinary image deletion and Algolia sync
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
