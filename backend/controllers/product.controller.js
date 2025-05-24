import db from "../models/index.js";
import {
  createProductService,
  deleteProductService,
  updateProductService,
} from "../services/product.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const parseProductInput = (req, isUpdate = false) => {
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
      stock: parseInt(stock, 10),
      specs: parsedSpecs,
    },
    files: {
      thumbnail,
      gallery,
    },
  };
};

export const createProduct = asyncHandler(async (req, res) => {
  const { data, files } = parseProductInput(req);
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
  if (isNaN(productId)) throw new ApiError(400, "Invalid product Id");

  const { data, files } = parseProductInput(req, true);
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
