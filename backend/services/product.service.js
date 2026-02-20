import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import paginate from "../utils/paginate.js";
import { createNotification } from "../services/notification.service.js";
import * as productHelpers from "../utils/productHelpers.js";
import redisClient from "../config/redis.js";
import { getCache, invalidateCache } from "../utils/cache.js";
import { syncProductToAlgolia } from "./algolia.service.js";
import { Op } from "sequelize";

const CACHE_TTL = 3600;

/**
 * Fetches all products with comprehensive filtering and pagination.
 * Optimized for both Storefront (Approved) and Admin (All) views.
 */
export const getAllProducts = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    status = "approved",
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    search,
    sortBy = "createdAt",
    sortOrder = "DESC",
    includeInactive = false,
  } = filters;

  const offset = (page - 1) * limit;

  const whereCondition = {};

  if (status !== "all") {
    whereCondition.status = status;
  }

  if (!includeInactive) {
    whereCondition.isActive = true;
  }

  if (categoryId) whereCondition.categoryId = categoryId;
  if (brandId) whereCondition.brandId = brandId;

  if (minPrice || maxPrice) {
    whereCondition.minOfferPrice = {};
    if (minPrice) whereCondition.minOfferPrice[Op.gte] = parseFloat(minPrice);
    if (maxPrice) whereCondition.minOfferPrice[Op.lte] = parseFloat(maxPrice);
  }

  if (search) {
    whereCondition[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { model: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await db.Product.findAndCountAll({
    where: whereCondition,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]],
    attributes: [
      "id",
      "name",
      "price",
      "model",
      "slug",
      "status",
      "averageRating",
      "reviewCount",
      "minOfferPrice",
      "totalOfferStock",
      "createdAt",
      "isActive",
    ],
    include: [
      {
        model: db.Media,
        as: "media",
        attributes: ["url", "tag"],
        where: { tag: "thumbnail" },
        required: false,
        limit: 1,
      },
      {
        model: db.Brand,
        as: "brand",
        attributes: ["id", "name", "slug"],
        where: includeInactive ? {} : { isActive: true },
        required: !includeInactive, // Inner join if filtering active, so products with inactive brand are hidden
      },
      {
        model: db.Category,
        as: "category",
        attributes: ["id", "name", "slug"],
        where: includeInactive ? {} : { isActive: true },
        required: !includeInactive,
      },
      {
        model: db.Offer,
        as: "offers",
        where: { status: "active" },
        required: false,
        attributes: [
          "id",
          "price",
          "dealPrice",
          "dealStartDate",
          "dealEndDate",
          "stockQuantity",
        ],
      },
    ],
    distinct: true,
  });

  return {
    products: rows,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    limit: parseInt(limit),
  };
};

/**
 * Gets a single product's public details, including all available offers from sellers.
 *
 */
export const getCustomerProductDetails = async (slug) => {
  const cacheKey = `product:${slug}`;

  try {
    const cachedProduct = await getCache(cacheKey);
    if (cachedProduct) {
      return cachedProduct;
    }
  } catch (error) {
    console.error("Cache retrieval error:", error);
  }

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug,
    );
  const whereCondition = {
    status: "approved",
    isActive: true,
    ...(isUUID ? { id: slug } : { slug }),
  };

  const product = await db.Product.findOne({
    where: whereCondition,
    attributes: [
      "id",
      "name",
      "price",
      "model",
      "description",
      "slug",
      "averageRating",
      "reviewCount",
      "minOfferPrice",
      "totalOfferStock",
    ],
    include: [
      {
        model: db.Media,
        as: "media",
        attributes: ["url", "tag", "fileType"],
        separate: true,
      },
      {
        model: db.ProductSpec,
        as: "specs",
        attributes: ["key", "value"],
        separate: true,
      },
      { model: db.Brand, as: "brand", attributes: ["id", "name", "slug"] },
      {
        model: db.Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
      {
        model: db.Review,
        as: "reviews",
        attributes: ["id", "rating", "comment", "createdAt"],
        separate: true,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["id", "fullname"],
          },
        ],
      },
      {
        model: db.Offer,
        as: "offers",
        where: { status: "active" }, // Only show active offers
        required: false, // Left join, so product shows up even if no active offers
        attributes: [
          "id",
          "price",
          "stockQuantity",
          "condition",
          "dealPrice",
          "dealStartDate",
          "dealEndDate",
        ],
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

  const plainProduct = product.get({ plain: true });

  await redisClient
    .set(cacheKey, JSON.stringify(plainProduct), {
      EX: CACHE_TTL,
    })
    .catch((err) => console.error("[Cache] Write Error:", err.message));

  return plainProduct;
};

/**
 * Service for admin to get product details for checking purpose.
 */

export const getProductDetailsAdmin = async (id) => {
  return db.Product.findByPk(id, {
    include: [
      { model: db.Media, as: "media" },
      { model: db.ProductSpec, as: "specs" },
      { model: db.Brand, as: "brand" },
      { model: db.Category, as: "category" },
    ],
  });
};

/**
 * Product service for sellers to suggest a new product, creating a 'pending' product and their first offer in a single transaction.
 *
 */
export const createProductSuggestion = async (
  productData,
  offerData,
  sellerId,
  files,
) => {
  const transaction = await sequelize.transaction();
  try {
    const newProduct = await productHelpers._createGenericProduct(
      productData,
      files,
      "pending",
      transaction,
    );

    await db.Offer.create(
      {
        ...offerData,
        productId: newProduct.id,
        sellerId,
      },
      transaction,
    );

    await transaction.commit();

    const admins = await db.User.findAll({
      where: { role: "admin" },
      attributes: ["id"],
    });
    for (const admin of admins) {
      createNotification(
        admin.id,
        "new_product_suggestion",
        `New product '${newProduct.name}' suggested.`,
        "/admin/products/pending",
      );
    }

    return newProduct;
  } catch (error) {
    await transaction.rollback();
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
  return paginate(
    db.Product,
    {
      where: { status: "pending" },
      include: [
        { model: db.ProductSpec, as: "specs" },
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
    limit,
  );
};

/**
 * Service for admin to review product suggestion from seller. Either approve or reject based on product availability.
 */

export const reviewProductSuggestion = async (productId, decision) => {
  const product = await db.Product.findOne({
    where: { id: productId, status: "pending" },
    include: [{ model: db.Offer, as: "offers", include: ["sellerProfile"] }],
  });

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  if (decision !== "approved" && decision !== "rejected") {
    throw new ApiError(400, "Decision must be approved or rejected.");
  }

  const transaction = await db.sequelize.transaction();
  try {
    product.status = decision;
    await product.save({ transaction });

    if (
      decision === "approved" &&
      product.offers &&
      product.offers.length > 0
    ) {
      for (const offer of product.offers) {
        offer.status = "active";
        await offer.save({ transaction });
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  // Initial sync to Algolia is handled by hook, but aggregate update might be needed
  // if stock > 0. The hook on Offer update will trigger aggregate update.

  const sellerProfile = product.offers?.[0]?.sellerProfile;
  const sellerUser = await db.User.findByPk(sellerProfile?.userId); // Need to fetch user

  if (sellerUser) {
    const message = `Your product suggestion '${product.name}' has been ${decision}.`;
    const linkUrl = `/seller/products/${product.id}`;
    createNotification(
      sellerUser.id,
      `product_suggestion_${decision}`,
      message,
      linkUrl,
    );
  }

  return product;
};

/**
 * Service for an admin to create a new, approved generic product in the catalog.
 */
export const adminCreateProduct = async (productData, files) => {
  const transaction = await sequelize.transaction();
  try {
    const newProduct = await productHelpers._createGenericProduct(
      productData,
      files,
      "approved",
      transaction,
    );
    await transaction.commit();
    return newProduct;
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    if (error.name === "SequqlizeUniqueConstraintError") {
      throw new ApiError(409, "A product with this name already exist.");
    }
    throw new ApiError(500, "Failed to create product.");
  }
};

/**
 * Service for admin to update product details.
 */
export const updateProduct = async (productId, data, files) => {
  const transaction = await sequelize.transaction();
  try {
    const product = await productHelpers._updateGenericProduct(
      productId,
      data,
      files,
      transaction,
    );
    await transaction.commit();

    if (product.slug) {
      await invalidateCache(`product:${product.slug}`);
    }

    return product;
  } catch (error) {
    console.error(error);
    await transaction.rollback();
    if (error.name === "SequqlizeUniqueConstraintError") {
      throw new ApiError(409, "A product with this name already exist.");
    }
    throw new ApiError(500, "Failed to update product.");
  }
};

/**
 * Recalculates and updates denormalized fields on a Product.
 * This will trigger the 'afterUpdate' hook on Product, which syncs to Algolia.
 */
export const updateProductAggregates = async (productId) => {
  if (!productId) return;

  const transaction = await db.sequelize.transaction();

  try {
    const stats = await db.Offer.findAll({
      where: { productId, status: "active" },
      attributes: [
        [
          db.sequelize.fn(
            "MIN",
            db.sequelize.literal(
              "CASE WHEN stockQuantity > 0 THEN price ELSE NULL END",
            ),
          ),
          "minPrice",
        ],
        [
          db.sequelize.fn("SUM", db.sequelize.col("stockQuantity")),
          "totalStock",
        ],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      raw: true,
      transaction,
    });

    const aggregateData = stats[0] || {};

    const product = await db.Product.findByPk(productId, {
      attributes: ["price"],
      transaction,
    });

    if (!product) {
      await transaction.rollback();
      return;
    }

    const finalMinPrice =
      aggregateData.minPrice !== null
        ? parseFloat(aggregateData.minPrice)
        : parseFloat(product.price);

    await db.Product.update(
      {
        minOfferPrice: finalMinPrice,
        totalOfferStock: parseInt(aggregateData.totalStock, 10) || 0,
        offerCount: parseInt(aggregateData.count, 10) || 0,
      },
      {
        where: { id: productId },
        transaction,
      },
    );

    await transaction.commit();
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (tranErr) {
        console.error(
          `[Aggregates] Transaction rollback failed for product ${productId}:`,
          tranErr.message,
        );
      }
    }
    throw error;
  }

  syncProductToAlgolia(productId).catch((err) =>
    console.error(
      `[Aggregates] Algolia sync failed for ${productId}:`,
      err.message,
    ),
  );
};

/**
 * Toggles the isActive status of a product.
 */
export const toggleProductStatus = async (productId) => {
  const product = await db.Product.findByPk(productId);
  if (!product) throw new ApiError(404, "Product not found.");

  product.isActive = !product.isActive;
  await product.save();

  if (product.slug) {
    await invalidateCache(`product:${product.slug}`);
  }

  // Sync changes to Algolia (remove if inactive, update if active)
  if (!product.isActive) {
    const { deleteProductFromAlgolia } = await import("./algolia.service.js");
    deleteProductFromAlgolia(product.id).catch((e) => console.error(e));
  } else {
    const { syncProductToAlgolia } = await import("./algolia.service.js");
    syncProductToAlgolia(product.id).catch((e) => console.error(e));
  }

  return product;
};

/**
 * Service for admin to delete a product from the catalog.
 */
export const deleteProduct = async (productId) => {
  const transaction = await sequelize.transaction();
  try {
    const { slug } = await productHelpers._deleteGenericProduct(
      productId,
      transaction,
    );
    await transaction.commit();

    if (slug) {
      await invalidateCache(`product:${slug}`);
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
    limit,
  );

  return result;
};
