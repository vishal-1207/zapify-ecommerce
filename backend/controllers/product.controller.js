import * as productService from "../services/product.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { searchProductsAlgolia } from "../services/algolia.service.js";

/**
 * Robust helper to parse JSON fields from multipart/form-data.
 * Handles cases where the field might already be parsed by Joi middleware.
 */
const safeParseJSON = (value, fieldName) => {
  if (!value) return [];
  if (typeof value !== "string") return value; // Already parsed by middleware

  try {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return JSON.parse(trimmed);
  } catch (error) {
    throw new ApiError(
      400,
      `Invalid JSON format for ${fieldName}. Please check your syntax.`,
    );
  }
};

/**
 * Helper function for checking and parsing input data to process for services.
 * @param {*} req
 * @param {*} isUpdate
 * @returns datat - parsed json data for product
 */
const parseProductInput = (req) => {
  const {
    categoryId,
    brandId,
    name,
    description,
    price,
    stock,
    specs = [],
  } = req.body;

  return {
    data: {
      categoryId,
      brandId,
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      stock: stock ? parseInt(stock, 10) : undefined,
      specs: safeParseJSON(specs, "specs"),
    },
    files: req.files || {},
  };
};

/**
 * Product controller to get all products with filters, pagination and sorting.
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    search,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = req.query;

  const isAdmin = req.user?.roles?.includes("admin");
  const queryStatus = isAdmin ? status || "all" : "approved";

  const result = await productService.getAllProducts({
    page: parseInt(page),
    limit: parseInt(limit),
    status: queryStatus,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    search,
    sortBy,
    sortOrder,
  });

  return res
    .status(200)
    .json({ message: "Products fetched successfully.", ...result });
});

/**
 * Get method controller to fetch details for a product, which is presented to user on front end.
 */
export const getProductDetailsForCustomer = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await productService.getCustomerProductDetails(slug);
  return res
    .status(200)
    .json({ message: "Product details fetched successfully.", product });
});

/**
 * Get method controller for admin to view/audit the product details.
 */
export const getProductDetailsAdmin = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await productService.getProductDetailsAdmin(productId);
  return res
    .status(200)
    .json({ message: "Product details fetched succesfully.", product });
});

/**
 * Seller controller to suggest product to admin that is not listed or available on the platform.
 */
export const suggestNewProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    categoryId,
    brandId,
    specs,
    price,
    stockQuantity,
    condition,
  } = req.body;

  const sellerProfile = await db.SellerProfile.findOne({
    where: { userId: req.user.id },
    attributes: ["id"],
  });

  if (!sellerProfile) {
    throw new ApiError(403, "Forbidden: Seller profile required.");
  }

  const productData = {
    name,
    description,
    categoryId,
    brandId,
    specs: specs ? JSON.parse(specs) : [],
  };

  const offerData = {
    price: parseFloat(price),
    stockQuantity: parseInt(stockQuantity, 10),
    condition,
  };

  const newProduct = await productService.createProductSuggestion(
    productData,
    offerData,
    sellerProfile.id,
    req.files,
  );
  return res.status(201).json({
    message: "Product successfully submitted for admin approval.",
    newProduct,
  });
});

/**
 * Admin controller to get list of pending suggested products by seller.
 */
export const getPendingProductsForReview = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await productService.getPendingProductsForReview(page, limit);
  return res.status(200).json({
    message: `Found ${result.total} product(s) pending for review.`,
    ...result,
  });
});

/**
 * Admin controller to review product, and perform needed action based on product data.
 */
export const reviewProduct = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  if (!decision) throw new ApiError(400, "Decision is required.");

  const product = await productService.reviewProductSuggestion(
    req.params.productId,
    decision,
  );
  return res.status(200).json({ message: `Product ${decision}.`, product });
});

/**
 * Seller product controller for finding product from list of active products listed by admin using algoliasearch.
 */
export const searchCatalog = asyncHandler(async (req, res) => {
  const { q = "", page = 1, limit = 10 } = req.query;
  const results = await searchProductsAlgolia(q, { page, limit });
  return res
    .status(200)
    .json({ message: `Search results for "${q}" fetched.`, results });
});

/**
 * Admin controller for creating or adding products to the product list. By default the product is added to the listed products.
 * And is available for seller to put offer for that product.
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { data, files } = parseProductInput(req);
  const product = await productService.adminCreateProduct(data, files);
  return res.status(200).json({
    message: "Product added successfully.",
    product,
  });
});

/**
 * Admin controller for updating details for listed products.
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { data, files } = parseProductInput(req);
  const result = await productService.updateProduct(productId, data, files);
  return res.status(200).json({
    message: "Product updated successfully.",
    result,
  });
});

/**
 * Admin controller for deleting product from the list of available products.
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const result = await productService.deleteProduct(productId);
  return res.status(200).json({ message: result.message });
});

/**
 * Gets seller's product suggestion for the products that where not listed by the admin.
 */
export const getProductSuggestions = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const suggestions = await sellerService.getSellerProductSuggestions(
    req.user.id,
    page,
    limit,
  );
  return res
    .status(200)
    .json({ message: "Product suggestions list fetched.", suggestions });
});
