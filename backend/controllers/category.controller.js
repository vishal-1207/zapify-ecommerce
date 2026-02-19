import * as categoryService from "../services/category.service.js";
import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Fetches all categories availabe.
 */
export const getCategories = asyncHandler(async (req, res) => {
  // Check if admin to decide whether to include inactive categories
  const isAdmin = req.user?.roles?.includes("admin");
  
  const categories = await categoryService.getAllCategories({
    includeInactive: isAdmin
  });

  res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully."));
});

export const getCategoryDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  const whereCondition = isUUID ? { id } : { slug: id };

  const category = await db.Category.findOne({
    where: whereCondition,
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

  if (!category) throw new ApiError(404, "No such category found.");

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category details fetched successfully."));
});

/**
 * Category controller which allows to admin to create new non-existing category.
 */
export const addCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const image = req.file;

  const category = await categoryService.addCategory(name, image);
  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category created successfully."));
});

/**
 * Category controller which allows admin to update existing category details.
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const id = req.params.id;
  const image = req.file;

  const updatedCategory = await categoryService.updateCategory(
    { id, name },
    image
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "Category updated successfully."),
    );
});

/**
 * Allows admin to delete a existing category.
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await categoryService.deleteCategory(id);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Category deleted successfully."));
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const category = await categoryService.toggleCategoryStatus(id);
  return res.status(200).json(
    new ApiResponse(
      200,
      category,
      `Category ${category.isActive ? "enabled" : "disabled"}.`,
    ),
  );
});
