import * as productService from "../services/product.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { searchProductsAlgolia } from "../services/algolia.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import db from "../models/index.js";
import * as sellerService from "../services/seller.service.js";

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
    model,
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
      model,
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
    includeInactive: isAdmin, // Only admins can see inactive products
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Products fetched successfully."));
});

export const toggleProductStatus = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await productService.toggleProductStatus(productId);
  return res.status(200).json(
    new ApiResponse(
      200,
      product,
      `Product ${product.isActive ? "enabled" : "disabled"} successfully.`,
    ),
  );
});

/**
 * Get method controller to fetch details for a product, which is presented to user on front end.
 */
export const getProductDetailsForCustomer = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await productService.getCustomerProductDetails(slug);
  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product details fetched successfully."));
});

/**
 * Get method controller for admin to view/audit the product details.
 */
export const getProductDetailsAdmin = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await productService.getProductDetailsAdmin(productId);
  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product details fetched succesfully."));
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
    totalOfferStock,
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
    specs: typeof specs === "string" ? JSON.parse(specs) : specs || [],
  };

  const offerData = {
    price: parseFloat(price),
    stockQuantity: parseInt(stockQuantity || totalOfferStock || 0, 10),
    condition,
  };

  const newProduct = await productService.createProductSuggestion(
    productData,
    offerData,
    sellerProfile.id,
    req.files,
  );
  return res.status(201).json(
    new ApiResponse(
      201,
      newProduct,
      "Product successfully submitted for admin approval.",
    ),
  );
});

/**
 * Admin controller to get list of pending suggested products by seller.
 */
export const getPendingProductsForReview = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await productService.getPendingProductsForReview(page, limit);
  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      `Found ${result.total} product(s) pending for review.`,
    ),
  );
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
  return res
    .status(200)
    .json(new ApiResponse(200, product, `Product ${decision}.`));
});

/**
 * Seller product controller for finding product from list of active products listed by admin using algoliasearch.
 */
export const searchCatalog = asyncHandler(async (req, res) => {
  const { q = "", page = 1, limit = 10 } = req.query;
  const results = await searchProductsAlgolia(q, { page, limit });
  return res
    .status(200)
    .json(new ApiResponse(200, results, `Search results for "${q}" fetched.`));
});

/**
 * Admin controller for creating or adding products to the product list. By default the product is added to the listed products.
 * And is available for seller to put offer for that product.
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { data, files } = parseProductInput(req);
  const product = await productService.adminCreateProduct(data, files);
  return res.status(200).json(
    new ApiResponse(200, product, "Product added successfully."),
  );
});

/**
 * Admin controller for updating details for listed products.
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { data, files } = parseProductInput(req);
  const result = await productService.updateProduct(productId, data, files);
  return res.status(200).json(
    new ApiResponse(200, result, "Product updated successfully."),
  );
});

/**
 * Admin controller for deleting product from the list of available products.
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const result = await productService.deleteProduct(productId);
  return res.status(200).json(new ApiResponse(200, null, result.message));
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
    .json(
      new ApiResponse(200, suggestions, "Product suggestions list fetched."),
    );
});
