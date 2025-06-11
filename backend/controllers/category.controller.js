import {
  createCategoryService,
  deleteCategoryService,
  updateCategoryService,
} from "../services/category.service.js";
import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";

const Category = db.Category;
const Media = db.Media;

// GET CATEGORIES
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    attributes: ["id", "name"],
    order: [["name", "ASC"]],
    include: [
      {
        model: Media,
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

// ADD CATEGORY
export const addCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const image = req.file;

  const category = await createCategoryService(name, image);
  res.status(200).json({ message: "Category created successfully.", category });
});

// UPDATE CATEGORY
export const updateCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const id = req.params.id;
  const image = req.file ? req.file.path : null;

  const updatedCategory = await updateCategoryService({ id, name }, image);
  res
    .status(200)
    .json({ message: "Category updated successfully.", updatedCategory });
});

// DELETE CATEGORY
export const deleteCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await deleteCategoryService(id);
  res.status(200).json({ message: "Category deleted successfully." });
});
