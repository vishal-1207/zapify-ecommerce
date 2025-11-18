import db from "../models/index.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";

// CREATE CATEGORY SERVICE
export const createCategoryService = async (name, file) => {
  const transaction = await db.sequelize.transaction();
  try {
    const newCategory = await db.Category.create({ name }, { transaction });

    if (file) {
      const upload = await uploadToCloudinary(
        file.path,
        process.env.CLOUDINARY_CATEGORY_FOLDER
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
        { transaction }
      );
    }

    await transaction.commit();
    return newCategory;
  } catch (error) {
    await transaction.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ApiError(409, "A category with this name already exists.");
    }
    throw new ApiError(500, "Failed to create category draft.", error);
  }
};

// UPDATE CATEGORY SERVICE

export const updateCategoryService = async (data, file) => {
  const { id, name } = data;
  const transaction = await db.sequelize.transaction();
  try {
    const category = await db.Category.findByPk(id, {
      include: [{ model: db.Media, as: "image" }],
      transaction,
    });
    if (!category) throw new ApiError(404, "Category not found.");

    category.name = name || category.name;

    if (file) {
      const oldImage = category.image;
      if (oldImage) {
        await cloudinary.uploader.destroy(oldImage.publicId);
        await oldImage.destroy({ transaction });
      }
      const upload = await uploadToCloudinary(
        file.path,
        process.env.CLOUDINARY_CATEGORY_FOLDER
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
        { transaction }
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

// DELETE CATEGORY SERVICE
export const deleteCategoryService = async (id) => {
  const transaction = await db.sequelize.transaction();
  try {
    const category = await db.Category.findByPk(id, {
      include: [{ model: db.Media, as: "media" }],
      transaction,
    });
    if (!category) throw new ApiError(404, "Category not found.");

    // Check if any product is using this category
    const productCount = await db.Product.count({
      where: { categoryId: id },
      transaction,
    });
    if (productCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete category: ${productCount} product(s) are still associated with it.`
      );
    }

    if (category.media?.[0]) {
      await cloudinary.uploader.destroy(category.media[0].publicId);
    }

    await category.destroy({ transaction });

    await transaction.commit();
    return { message: "Category deleted successfully." };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to delete category.", error);
  }
};
