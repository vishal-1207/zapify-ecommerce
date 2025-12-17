import { searchProductsAlgolia } from "../services/algolia.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const searchStorefront = asyncHandler(async (req, res) => {
  const {
    q = "",
    page = 1,
    limit = 20,
    category,
    brand,
    priceMin,
    priceMax,
  } = req.query;

  const filters = {
    page,
    limit,
    category,
    brand,
    minPrice: priceMin,
    maxPrice: priceMax,
  };

  // Use Algolia service for high-performance search
  const results = await searchProductsAlgolia(q, filters);

  return res
    .status(200)
    .json(new ApiResponse(200, results, "Search successful."));
});
