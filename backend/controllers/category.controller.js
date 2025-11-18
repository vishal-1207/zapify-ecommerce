import * as categoryService from "../services/category.service.js";
import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Fetches all categories availabe.
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await db.Category.findAll({
    attributes: ["id", "name"],
    order: [["name", "ASC"]],
    include: [
      {
        model: db.Media,
        as: "media",
        attributes: ["id", "publicId", "url", "fileType", "tag"],
        where: {
          associatedType: "category",
        },
      },
    ],
  });

  res
    .status(200)
    .json({ message: "Categories fetched successfully.", categories });
});

/**
 * Category controller which allows to admin to create new non-existing category.
 */
export const addCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const image = req.file;

  const category = await categoryService.createCategoryService(name, image);
  return res
    .status(200)
    .json({ message: "Category created successfully.", category });
});

/**
 * Category controller which allows admin to update existing category details.
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const id = req.params.id;
  const image = req.file;

  const updatedCategory = await categoryService.updateCategoryService(
    { id, name },
    image
  );
  res
    .status(200)
    .json({ message: "Category updated successfully.", updatedCategory });
});

/**
 * Allows admin to delete a existing category.
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await categoryService.deleteCategoryService(id);
  return res.status(200).json({ message: "Category deleted successfully." });
});
