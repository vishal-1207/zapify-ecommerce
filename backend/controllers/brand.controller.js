import * as brandServices from "../services/brand.service.js";
import ApiError from "../utils/ApiError.js";
import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getBrands = asyncHandler(async (req, res) => {
  const brands = await db.Brand.findAll({
    attributes: ["id", "name", "description"],
    order: [["name", "ASC"]],
    include: [
      {
        model: db.Media,
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

  return res
    .status(200)
    .json({ message: "Brands fetched successfully.", brands });
});

export const getBrandDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brand = await db.Brand.findByPk(id, {
    include: [
      {
        model: db.Media,
        as: "media",
        attributes: ["id", "publicId", "url", "fileType", "tag"],
        where: {
          associatedType: "brand",
        },
      },
    ],
  });

  if (!brand) throw new ApiError(404, "No such brand found.");

  return res
    .status(200)
    .json({ message: "Brand details fetched successfully.", brand });
});

export const createBrand = asyncHandler(async (req, res) => {
  const file = req.file;

  const brand = await brandServices.addBrandService(req.body, file);
  return res
    .status(201)
    .json({ message: "Brand created successfully.", brand });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  const updatedBrand = await brandServices.updateBrandService(
    id,
    req.body,
    file
  );
  res
    .status(200)
    .json({ message: "Brand updated successfully.", brand: updatedBrand });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await brandServices.deleteBrandService(id);
  return res.status(200).json({ message: "Brand deleted successfully." });
});
