import getFilteredProducts from "../services/search.service.js";

//TODO: Implement the following functions
/**
 * Different functions to handle product-fetching logic
 * based on category slug or category ID.
 */

export const getProductsByCategory = asyncHandler(async (req, res) => {
  const slug = req.params;

  if (!slug) {
    throw new ApiError(400, "Category slug is required.");
  }

  const query = {
    ...req.query,
    categorySlug: slug,
  };

  const data = await getFilteredProducts(query);
});

export const getProductsByCategoryId = asyncHandler(async (req, res) => {});
