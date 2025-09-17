import * as productService from "../services/product.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Helper function for checking and parsing input data to process for services.
 * @param {*} req
 * @param {*} isUpdate
 * @returns datat - parsed json data for product
 */
const parseProductInput = (req, isUpdate = false) => {
  const { categoryId, brand, name, description, price, specs = [] } = req.body;
  const thumbnail = req.files?.thumbnail?.[0];
  const gallery = req.files?.gallery;

  let parsedSpecs = [];
  if (specs) {
    try {
      parsedSpecs = JSON.parse(specs);
    } catch (error) {
      throw new ApiError(400, "Invalid JSON format for specs.");
    }
  }

  if (!isUpdate) {
    if (!thumbnail) throw new ApiError(400, "Product thumbnail is required.");
    if (!gallery || gallery.length < 1)
      throw new ApiError(400, "At least one product image is required.");
  }

  return {
    data: {
      categoryId: parseInt(categoryId, 10),
      brand,
      name,
      description,
      price: parseInt(price, 10),
      specs: parsedSpecs,
    },
    files: {
      thumbnail,
      gallery,
    },
  };
};

/**
 * Get method controller to fetch details for a product, which is presented to user on front end.
 */
export const getProductDetailsForCustomer = asyncHandler(async (req, res) => {
  const productSlug = req.params;

  const product = await productService.getCustomerProductDetails(productSlug);
  return res
    .status(200)
    .json({ message: "Product details fetched successfully.", product });
});

/**
 * Get method controller for admin to view/audit the product details.
 */
export const getProductDetailsAdmin = asyncHandler(async (req, res) => {
  const productId = req.params;

  const product = await productService.getProductDetailsAdmin(productId);

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  return res
    .status(200)
    .json({ message: "Product details fetched succesfully.", product });
});

/**
 * Seller controller to suggest product to admin that is not listed or available on the platform.
 */
export const suggestNewProduct = asyncHandler(async (req, res) => {});

/**
 * Admin controller to get list of pending suggested products by seller.
 */
export const getPendingProductsForReview = asyncHandler(async (req, res) => {});

/**
 * Admin controller to review product, and perform needed action based on product data.
 */
export const reviewProduct = asyncHandler(async (req, res) => {});

/**
 * Seller controller for finding product from list of active products listed by admin.
 */
export const searchCatalog = asyncHandler(async (req, res) => {
  const searchTerm = req.query;

  const searchResult = await productService.searchProductCatalog(searchTerm);

  if (!searchResult) {
    throw new ApiError("No such record found.");
  }

  return res
    .status(200)
    .json({ message: `Search result for ${searchTerm}.`, searchResult });
});

/**
 * Admin controller for creating or adding products to the product list. By default the product is added to the listed products. And is available for seller to put offer for that product.
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { data, files } = parseProductInput(req);
  const { createdProduct, productSpecs, thumbnailImage, galleryImages } =
    await productService.createProductService(data, files);

  res.status(200).json({
    message: "Product added successfully.",
    product: createdProduct,
    productSpecs,
    thumbnailImage,
    galleryImages,
  });
});

/**
 * Admin controller for updating details for listed products.
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) throw new ApiError(400, "Invalid product Id");

  const { data, files } = parseProductInput(req, true);
  const { updatedProduct, updatedSpecs, updatedThumbnail, updaterGallery } =
    await productService.updateProductService(productId, data, files);

  res.status(200).json({
    message: "Product updated successfully.",
    product: updatedProduct,
    productSpecs: updatedSpecs,
    thumbnailImage: updatedThumbnail,
    galleryImages: updaterGallery,
  });
});

/**
 * Admin controller for deleting product from the list of available products.
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const result = await productService.deleteProductService(productId);
  res.status(200).json({ message: result.message });
});
