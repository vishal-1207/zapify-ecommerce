import {
  addBrandService,
  updateBrandService,
  deleteBrandService,
} from "../services/brand.service.js";
import ApiError from "../utils/ApiError.js";
import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";

const Brand = db.Brand;

export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.findAll({
    attributes: ["id", "name", "description"],
    order: [["name", "ASC"]],
    include: [
      {
        model: Media,
        as: "media",
        attributes: ["id", "publicId", "url", "fileType", "tag"],
        where: {
          associatedType: "brand",
        },
      },
    ],
  });

  if (!brands || brands.length === 0) {
    throw new ApiError(404, "No brands found.");
  }

  res.status(200).json({ message: "Brands fetched successfully.", brands });
});

export const createBrand = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const file = req.file;

  const brand = await addBrandService({ name, description }, file);
  res.status(201).json({ message: "Brand created successfully.", brand });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const file = req.file;

  const updatedBrand = await updateBrandService(
    id,
    { name, description },
    file
  );
  res
    .status(200)
    .json({ message: "Brand updated successfully.", brand: updatedBrand });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await deleteBrandService(id);
  res.status(200).json({ message: "Brand deleted successfully." });
});
