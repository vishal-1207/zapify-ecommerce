import getFilteredProducts from "../services/search.service.js";

export const getSearchResults = asyncHandler(async (req, res) => {
  const queryParams = req.query;

  const data = await getFilteredProducts(queryParams);

  res.status(200).json({ message: "Products fetched successfully.", data });
});
