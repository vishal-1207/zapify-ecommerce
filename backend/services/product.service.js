import cloudinary from "../config/cloudinary.js";
import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import paginate from "../utils/paginate.js";
import { createNotification } from "../services/notification.service.js";
import redisClient from "../config/redis.js";
import { invalidateCache } from "../utils/cache.js";

const CACHE_EXPIRATION_SECONDS = 3600;

/**
 * Gets a single product's public details, including all available offers from sellers.
 *
 */
export const getCustomerProductDetails = async (productSlug) => {
  const cacheKey = `product:${productSlug}`;

  const cachedProduct = await redisClient.get(cacheKey);
  if (cachedProduct) {
    return JSON.parse(cachedProduct);
  }

  const product = await db.Product.findOne({
    where: { slug: productSlug, status: "approved" },
    include: [
      { model: db.Category, as: "category" },
      { model: db.Brand, as: "brand" },
      { model: db.Media, as: "media" },
      { model: db.ProductSpec, as: "productSpec" },
      {
        model: db.Review,
        as: "reviews",
        attributes: ["id", "rating", "comment", "createdAt"],
        separate: true,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: db.User,
            as: "reviewer",
            attributes: ["id", "fullname"],
          },
        ],
      },
      {
        mode: db.Offer,
        as: "offer",
        include: [
          {
            model: db.SellerProfile,
            as: "sellerProfile",
            attributes: ["id", "storeName"],
          },
        ],
      },
    ],
  });

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  await redisClient.setEx(
    cacheKey,
    CACHE_EXPIRATION_SECONDS,
    JSON.stringify(product)
  );

  return product;
};

/**
 * Service for admin to get product details for checking purpose.
 */

export const getProductDetailsAdmin = async (id) => {
  const productId = await db.Product.findByPk({
    where: { id: productId },
    include: [
      {
        model: db.ProductSpec,
        as: "specs",
      },
      {
        model: db.Media,
        as: "media",
      },
    ],
  });
};

/**
 * Service for sellers to search the public catalog for approved products.
 *
 */

export const searchProductCatalog = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim() === "") return [];

  return db.Product.findAll({
    where: {
      name: { [Op.like]: `${searchTerm}` },
      status: "approved",
    },
    attributes: ["id", "name"],
    include: [{ model: db.Brand, as: "brand", attributes: ["name"] }],
    limit: 20,
  });
};

/**
 * Function to create product entry with its media and specs.
 * This is a core reusable logic. Not to be called directly from controllers
 */

const _createProduct = async (productData, files, status, transaction) => {
  const {
    categoryId,
    brandId,
    name,
    description,
    price,
    specs = [],
  } = productData;

  const newProduct = await db.Product.create(
    {
      name,
      description,
      price,
      status,
      categoryId,
      brandId,
    },
    { transaction }
  );

  // 2. Handle Thumbnail Upload
  if (files?.thumbnail) {
    const thumbnailUpload = await uploadToCloudinary(
      files.thumbnail.path,
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

  // 3. Handle Gallery Uploads
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

  // 4. Handle Product Specs
  if (specs.length > 0) {
    const specEntries = specs.map((spec) => ({
      ...spec,
      productId: newProduct.id,
    }));
    await db.ProductSpec.bulkCreate(specEntries, { transaction });
  }

  return newProduct;
};

/**
 * Product service for sellers to suggest a new product, creating a 'pending' product and their first offer in a single transaction.
 *
 */
export const createProductSuggestion = async (
  productData,
  offerData,
  sellerId,
  files
) => {
  const transaction = await sequelize.transaction();
  let committed = false;
  try {
    const newProduct = await _createProduct(
      productData,
      files,
      "pending",
      transaction
    );

    await db.Offer.create(
      {
        ...offerData,
        productId: newProduct.id,
        sellerId,
      },
      transaction
    );

    await transaction.commit();
    committed = true;

    return newProduct;
  } catch (error) {
    if (!committed) await transaction.rollback();
    if (error.name === "SequqlizeUniqueConstraintError") {
      throw new ApiError(409, "A product with this name already exist.");
    }

    throw new ApiError(500, "Failed to create product suggestion.", error);
  }
};

/**
 * Product service for admin to get list of products pending for review.
 * @param {*} productData
 * @param {*} files
 * @returns
 */
export const getPendingProductsForReview = async (page, limit) => {
  const result = await paginate(
    db.Product,
    {
      where: { status: "pending" },
      include: [
        { model: db.ProductSpecs, as: "specs" },
        { model: db.Brand, as: "brand", attributes: ["name"] },
        { model: db.Category, as: "category", attributes: ["name"] },
        {
          model: db.Offer,
          as: "offers",
          include: [
            {
              model: db.SellerProfile,
              as: "sellerProfile",
              attributes: ["id", "storeName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    },
    page,
    limit
  );

  return result;
};

/**
 * Service for an admin to create a new, approved generic product in the catalog.
 */
export const adminCreateProduct = async (productData, files) => {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const newProduct = await _createProduct(
      productData,
      files,
      "approved",
      transaction
    );

    await transaction.commit();
    committed = true;
    return { newProduct, productSpecs, thumbnailImage, galleryImages };
  } catch (error) {
    if (!committed) await transaction.rollback();
    if (error === "SequelizeUniqueConstraintError") {
      throw new ApiError(409, "A product with this name already exist.");
    }

    throw new ApiError(500, "Failed to create product.");
  }
};

/**
 * Service for admin to update product details.
 */
export const updateProduct = async (productId, data, files) => {
  const { categoryId, brandId, name, description, price, specs = [] } = data;

  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const product = await db.Product.findByPk(productId, {
      include: [
        {
          model: db.Media,
          as: "media",
        },
        {
          model: db.ProductSpec,
        },
      ],
    });

    const slug = product.slug;

    if (!product) throw new ApiError(404, "Product not found.");

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (categoryId) product.categoryId = categoryId;
    if (brandId) product.brandId = brandId;

    const updatedProduct = await product.save({ transaction });

    // Thumbnail update logic
    let updatedThumbnail = null;
    if (files.thumbnail) {
      const existingThumbnail = product.media.find(
        (m) => m.tag === "thumbnail"
      );

      if (existingThumbnail) {
        await cloudinary.uploader.destroy(existingThumbnail.publicId);
        await existingThumbnail.destroy({ transaction });
      }

      const uplaodThumbnail = await uploadToCloudinary(
        files.thumbnail.path,
        process.env.CLOUDINARY_PRODUCT_FOLDER
      );

      updatedThumbnail = await db.Media.create(
        {
          publicId: uplaodThumbnail.public_id,
          url: uplaodThumbnail.secure_url,
          fileType: uplaodThumbnail.resource_type,
          tag: "thumbnail",
          associatedType: "product",
          associatedId: product.id,
        },
        { transaction }
      );
    }

    // Gallery media update logic
    let updatedGallery = null;
    if (files?.gallery && files.gallery.length > 0) {
      const existingGallery = product.media.filter((m) => m.tag === "gallery");

      for (const media of existingGallery) {
        await cloudinary.uploader.destroy(media.publicId);
        await media.destroy({ transaction });
      }

      const uploadPromises = files.gallery.map((file) =>
        uploadToCloudinary(file.path, process.env.CLOUDINARY_PRODUCT_FOLDER)
      );

      const uploadGallery = await Promise.all(uploadPromises);

      const galleryMedia = uploadGallery.map((upload) => ({
        publicId: upload.public_id,
        url: upload.secure_url,
        fileType: upload.resource_type,
        tag: "gallery",
        associatedType: "product",
        associatedId: product.id,
      }));

      updatedGallery = await db.Media.bulkCreate(galleryMedia, { transaction });
    }

    // Specifications update logic
    let updatedSpecs = null;
    if (specs.length > 0) {
      await ProductSpec.destroy({
        where: { productId: product.id },
        transaction,
      });

      const newSpecs = specs.map((spec) => ({
        key: spec.key,
        value: spec.value,
        productId: product.id,
      }));

      updatedSpecs = await db.ProductSpec.bulkCreate(newSpecs, { transaction });
    }

    await transaction.commit();
    committed = true;

    if (slug) {
      await invalidateCache(`product:${slug}`);
    }

    return updatedProduct;
  } catch (error) {
    console.error(error);
    if (!committed) await transaction.rollback();
    throw new ApiError(500, "Failed to update product.");
  }
};

/**
 * Service for admin to review product suggestion from seller. Either approve or reject based on product availability.
 */

export const reviewProductSuggestion = async (productId, decision) => {
  const product = await db.Product.findOne({
    where: { id: productId, status: "pending" },
    include: [
      {
        model: db.Offer,
        as: "offers",
        include: [
          {
            model: db.SellerProfile,
            as: "sellerProfile",
            include: [{ model: db.User, attributes: ["id"] }],
          },
        ],
      },
    ],
  });

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  if (decision !== "approved" || decision !== "rejected") {
    throw new ApiError(400, "Decision must be approved or rejected.");
  }

  product.status = decision;
  await db.Product.save();

  const sellerProfile = product.Offers[0]?.SellerProfile;
  const sellerUser = sellerProfile?.User;

  if (sellerUser) {
    const message = `Your product suggestion '${product.name}' has been ${decision}.`;
    const linkUrl = `/seller/products/${product.id}`;
    createNotification(
      sellerUser.id,
      `product_suggestion_${decision}`,
      message,
      linkUrl
    );
  }

  return product;
};

/**
 * Service for admin to delete a product from the catalog.
 */
export const deleteProduct = async (productId) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await db.Product.findByPk(productId, {
      include: [
        { model: db.Media, as: "media" },
        { model: db.ProductSpec, as: "specs" },
      ],
      transaction,
    });

    const productSlug = product.slug;

    if (!product) {
      throw new ApiError(400, "Product not found.");
    }

    if (product.media && product.media.length > 0) {
      for (const media of product.media) {
        if (media.publicId) {
          await cloudinary.uploader.destroy(media.publicId, {
            resource_type: media.fileType,
          });
        }
      }
    }

    if (product.specs && product.specs.length > 0) {
      for (const spec of product.specs) {
        await spec.destroy({ transaction });
      }
    }

    await product.destroy({ transaction });
    await transaction.commit();

    if (productSlug) {
      await invalidateCache(`product:${productSlug}`);
    }

    return { message: "Product deleted successfully." };
  } catch (error) {
    console.error(error);
    await transaction.rollback();
    throw new ApiError(500, "Something went wrong.");
  }
};

/**
 * Seller service to get list of suggested products for a specified seller.
 */
export const getSellerProductSuggestions = async (userId, page, limit) => {
  const seller = await getSellerProfile(userId);
  const result = await paginate(
    db.Product,
    {
      where: { status: { [Op.ne]: "approved" } },
      include: [
        {
          model: db.Offer,
          as: "offers",
          where: { sellerProfileId: seller.id },
          attributes: [],
        },
      ],
      attributes: ["id", "name", "status", "createdAt"],
      order: ["createdAt", "DESC"],
    },
    page,
    limit
  );

  return result;
};
