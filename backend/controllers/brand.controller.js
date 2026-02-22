import * as brandServices from "../services/brand.service.js";
import ApiError from "../utils/ApiError.js";
import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getBrands = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.roles?.includes("admin");
  const brands = await brandServices.getAllBrands({
    includeInactive: isAdmin,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, brands, "Brands fetched successfully."));
});

export const getBrandDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const whereCondition = isUUID ? { id } : { slug: id };

  const brand = await db.Brand.findOne({
    where: whereCondition,
    include: [
      {
        model: db.Media,
        as: "media",
        attributes: ["id", "publicId", "url", "fileType", "tag"],
        where: {
          associatedType: "brand",
        },
        required: false,
      },
    ],
  });

  if (!brand) throw new ApiError(404, "No such brand found.");

  return res
    .status(200)
    .json(new ApiResponse(200, brand, "Brand details fetched successfully."));
});

export const createBrand = asyncHandler(async (req, res) => {
  const file = req.file;

  const brand = await brandServices.addBrandService(req.body, file);
  return res
    .status(201)
    .json(new ApiResponse(201, brand, "Brand created successfully."));
});

export const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  const updatedBrand = await brandServices.updateBrandService(
    id,
    req.body,
    file,
  );
  res
    .status(200)
    .json(new ApiResponse(200, updatedBrand, "Brand updated successfully."));
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await brandServices.deleteBrandService(id);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Brand deleted successfully."));
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brand = await brandServices.toggleBrandStatus(id);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        brand,
        `Brand ${brand.isActive ? "enabled" : "disabled"}.`,
      ),
    );
});
