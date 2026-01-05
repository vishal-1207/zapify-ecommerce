import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "./cloudinary.util.js";

import db from "#models/index.js";
import { ApiError } from "#utils/ApiError.js";
import uploadToCloudinary from "#utils/cloudinary.util.js";
import cloudinary from "#config/cloudinary.js";

/**
 * INTERNAL GENERIC FUNCTION to create a product entry with its media and specs.
 * This is the core reusable logic used by both Admins (for catalog) and Sellers (for suggestions).
 * * @param {object} productData - Generic product data (name, description, categoryId, brandId, specs, etc.).
 * @param {object} files - Object containing 'thumbnail' (array) and 'gallery' (array) files from multer.
 * @param {string} status - The status to set for the new product ('pending', 'approved', or 'draft').
 * @param {object} transaction - The Sequelize transaction object to ensure atomicity.
 * @returns {Promise<Product>} The newly created product instance.
 */
export const _createGenericProduct = async (
  productData,
  files,
  status,
  transaction
) => {
  const { categoryId, brandId, name, description, specs = [] } = productData;

  const newProduct = await db.Product.create(
    {
      name,
      description,
      categoryId,
      brandId,
      status,
    },
    { transaction }
  );

  if (files?.thumbnail && files.thumbnail.length > 0) {
    const thumbnailFile = files.thumbnail[0];
    const thumbnailUpload = await uploadToCloudinary(
      thumbnailFile.path,
      process.env.CLOUDINARY_PRODUCT_FOLDER
    );

    await db.Media.create(
      {
        publicId: thumbnailUpload.public_id,
        url: thumbnailUpload.secure_url,
        fileType: thumbnailUpload.resource_type,
        tag: "thumbnail",
        associatedType: "product",
        associatedId: newProduct.id,
      },
      { transaction }
    );
  }

  if (files?.gallery && files.gallery.length > 0) {
    const uploadPromises = files.gallery.map((file) =>
      uploadToCloudinary(file.path, process.env.CLOUDINARY_PRODUCT_FOLDER)
    );
    const uploadResults = await Promise.all(uploadPromises);

    const mediaEntries = uploadResults.map((upload) => ({
      publicId: upload.public_id,
      url: upload.secure_url,
      fileType: upload.resource_type,
      tag: "gallery",
      associatedType: "product",
      associatedId: newProduct.id,
    }));

    await db.Media.bulkCreate(mediaEntries, { transaction });
  }

  if (specs && specs.length > 0) {
    const specEntries = specs.map((spec) => ({
      key: spec.key,
      value: spec.value,
      productId: newProduct.id,
    }));
    await db.ProductSpec.bulkCreate(specEntries, { transaction });
  }

  return newProduct;
};

/**
 * INTERNAL GENERIC FUNCTION to update a product entry, including its media and specs.
 * Handles deleting old images from Cloudinary/DB and uploading new ones.
 * * @returns {Promise<Product>} The updated product instance.
 */
export const _updateGenericProduct = async (
  productId,
  productData,
  files,
  transaction
) => {
  const { categoryId, brandId, name, description, specs, mediaToDelete } =
    productData;

  const product = await db.Product.findByPk(productId, {
    include: [{ model: db.Media, as: "media" }],
    transaction,
  });

  if (!product) throw new ApiError(404, "Product not found.");

  if (name) product.name = name;
  if (brandId) product.brandId = brandId;
  if (description) product.description = description;
  if (categoryId) product.categoryId = categoryId;

  await product.save({ transaction });

  if (files?.thumbnail && files.thumbnail.length > 0) {
    const oldThumbnail = product.media.find((m) => m.tag === "thumbnail");

    if (oldThumbnail) {
      await cloudinary.uploader.destroy(oldThumbnail.publicId);
      await oldThumbnail.destroy({ transaction });
    }

    const thumbnailFile = files.thumbnail[0];
    const thumbnailUpload = await uploadToCloudinary(
      thumbnailFile.path,
      process.env.CLOUDINARY_PRODUCT_FOLDER
    );

    await db.Media.create(
      {
        publicId: thumbnailUpload.public_id,
        url: thumbnailUpload.secure_url,
        fileType: thumbnailUpload.resource_type,
        tag: "thumbnail",
        associatedType: "product",
        associatedId: product.id,
      },
      { transaction }
    );
  }

  if (mediaToDelete && mediaToDelete.length > 0) {
    const idsToDelete =
      typeof mediaToDelete === "string"
        ? JSON.parse(mediaToDelete)
        : mediaToDelete;

    const mediaRecordsToDelete = product.media.filter((m) =>
      idsToDelete.includes(m.id)
    );

    if (mediaRecordsToDelete.length > 0) {
      const publicIds = mediaRecordsToDelete.map((m) => m.publicId);
      await cloudinary.api.delete_resources(publicIds);

      await db.Media.destroy({
        where: { id: mediaRecordsToDelete.map((m) => m.id) },
        transaction,
      });
    }
  }

  if (files?.gallery && files.gallery.length > 0) {
    const uploadPromises = files.gallery.map((file) =>
      uploadToCloudinary(file.path, process.env.CLOUDINARY_PRODUCT_FOLDER)
    );
    const uploadResults = await Promise.all(uploadPromises);

    const mediaEntries = uploadResults.map((upload) => ({
      publicId: upload.public_id,
      url: upload.secure_url,
      fileType: upload.resource_type,
      tag: "gallery",
      associatedType: "product",
      associatedId: product.id,
    }));

    await db.Media.bulkCreate(mediaEntries, { transaction });
  }

  if (specs) {
    await db.ProductSpec.destroy({ where: { productId }, transaction });

    const parsedSpecs = typeof specs === "string" ? JSON.parse(specs) : specs;

    if (parsedSpecs.length > 0) {
      const newSpecs = parsedSpecs.map((spec) => ({
        key: spec.key,
        value: spec.value,
        productId,
      }));
      await db.ProductSpec.bulkCreate(newSpecs, { transaction });
    }
  }

  return product;
};

/**
 * INTERNAL GENERIC FUNCTION to delete a product and its external media assets.
 * * @returns {Promise<object>} Returns { message, slug } so the caller can invalidate cache.
 */
export const _deleteGenericProduct = async (productId, transaction) => {
  const product = await db.Product.findByPk(productId, {
    include: [{ model: db.Media, as: "media" }],
    transaction,
  });

  if (!product) throw new ApiError(404, "Product not found.");

  if (product.media && product.media.length > 0) {
    const publicIds = product.media.map((m) => m.publicId);
    await cloudinary.api.delete_resources(publicIds);
  }

  const slug = product.slug;
  await product.destroy({ transaction });

  return { message: "Product deleted successfully.", slug };
};
