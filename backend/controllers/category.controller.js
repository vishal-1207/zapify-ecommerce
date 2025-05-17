import {
  createCategoryService,
  deleteCategoryService,
  updateCategoryService,
} from "../services/category.service.js";
import ApiError from "../utils/ApiError.js";
import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";

const Category = db.Category;

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    attributes: ["id", "name", "imageUrl"],
    order: [["name", "ASC"]],
  });

  res
    .status(200)
    .json({ message: "Categories fetched successfully.", categories });
});

export const addCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const image = req.file;
  if (!name) {
    throw new ApiError(400, "Category name is required.");
  }

  if (!image) {
    throw new ApiError(400, "Category image is required.");
  }

  const category = await createCategoryService({ name, image });
  res.status(200).json({ message: "Category created successfully.", category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const id = req.params.id;
  const image = req.file;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const updatedCategory = await updateCategoryService({ id, name, image });
  res
    .status(200)
    .json({ message: "Category updated successfully.", updatedCategory });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await deleteCategoryService(id);
  res.status(200).json({ message: "Category deleted successfully." });
});
