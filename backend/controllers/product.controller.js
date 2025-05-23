import db from "../models/index.js";
import {
  createProductService,
  deleteProductService,
  updateProductService,
} from "../services/product.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const validateAndParseProductInput = (req, isUpdate = false) => {
  const {
    categoryId,
    brand,
    name,
    description,
    price,
    stock,
    specs = [],
  } = req.body;
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

  if (!isUpdate && !categoryId)
    throw new ApiError(400, "Category is required.");
  if (!brand) throw new ApiError(400, "Product brand is required.");
  if (!name) throw new ApiError(400, "Product name is required.");
  if (!price) throw new ApiError(400, "Price is required.");
  if (!stock) throw new ApiError(400, "Number of stock is required.");
  if (parsedSpecs.length < 1)
    throw new ApiError(400, "At least one specification is required.");
  if (!thumbnail && !isUpdate)
    throw new ApiError(400, "Product thumbnail is required.");
  if ((!gallery || gallery.length < 1) && !isUpdate)
    throw new ApiError(400, "At least one product image is required.");

  const parsedPrice = parseInt(price, 10);
  const parsedStock = parseInt(stock, 10);
  const parsedCategoryId = parseInt(categoryId, 10);

  if (isNaN(parsedPrice) || parsedPrice <= 0)
    throw new ApiError(400, "Price must be a valid positive number.");

  if (isNaN(parsedStock) || parsedStock <= 0)
    throw new ApiError(400, "Stock must be a valid positive number.");

  return {
    data: {
      categoryId: parsedCategoryId,
      brand,
      name,
      description,
      price: parsedPrice,
      stock: parsedStock,
      specs: parsedSpecs,
    },
    files: {
      thumbnail,
      gallery,
    },
  };
};

export const createProduct = asyncHandler(async (req, res) => {
  const { data, files } = validateAndParseProductInput(req);
  const { createdProduct, productSpecs, thumbnailImage, galleryImages } =
    await createProductService(data, files);

  res.status(200).json({
    message: "Product added successfully.",
    product: createdProduct,
    productSpecs,
    thumbnailImage,
    galleryImages,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    throw new ApiError(400, "Invalid product Id");
  }

  const { data, files } = validateAndParseProductInput(req, true);
  const { updatedProduct, updatedSpecs, updatedThumbnail, updaterGallery } =
    await updateProductService(productId, data, files);

  res.status(200).json({
    message: "Product updated successfully.",
    product: updatedProduct,
    productSpecs: updatedSpecs,
    thumbnailImage: updatedThumbnail,
    galleryImages: updaterGallery,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const result = await deleteProductService(productId);
  res.status(200).json({ message: result.message });
});
