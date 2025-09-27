import { getFilteredProducts } from "../services/search.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getSearchResults = asyncHandler(async (req, res) => {
  const queryParams = req.query;

  const data = await getFilteredProducts(queryParams);

  return res
    .status(200)
    .json({ message: "Products fetched successfully.", data });
});
