import { createCategory } from "../services/category.service.js";
import ApiError from "../utils/ApiError.js";
import db from "../models/index.js";

const Category = db.Category;

export const getCategories = async (req, res) => {
  const categories = await Category.findAll({
    attributes: ["id", "name", "imageUrl"],
    order: [["name", "ASC"]],
  });

  res
    .status(200)
    .json({ message: "Categories fetched successfully.", categories });
};

export const getCategory = async (req, res) => {};

export const addCategory = async (req, res) => {
  const name = req.body;
  const file = req.file;

  if (!name) {
    throw new ApiError(400, "Category name is required.");
  }

  if (!file) {
    throw new ApiError(400, "Category image is required.");
  }

  const category = await createCategory({ name, file });
  res.status(200).json({ message: "Category created successfully.", category });
};
