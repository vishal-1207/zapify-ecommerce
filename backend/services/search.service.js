import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { Op } from "sequelize";

const Product = db.Product;
const Media = db.Media;
const ProductSpec = db.ProductSpec;
const Category = db.Category;
const Brand = db.Brand;
const Seller = db.SellerProfile;
const Review = db.Review;

export const getFilteredProducts = async (query) => {
  try {
    const {
      search,
      categorySlug,
      categoryId,
      brandId,
      brand,
      inStock,
      minRating,
      priceMin,
      priceMax,
    } = query;

    const allowedSortedBy = [
      "createdAt",
      "price",
      "name",
      "popularity",
      "relevance",
    ];
    const sortBy = allowedSortedBy.includes(query.sortBy)
      ? query.sortBy
      : search
      ? "relevance"
      : "createdAt";

    const MAX_LIMIT = 100;
    const requestedLimit = parseInt(query.limit) || 10;
    const order = query.order?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const offset = parseInt(query.offset) || 0;

    const options = {
      where: {},
      include: [],
    };

    // SEARCH
    if (sortBy === "relevance" && search) {
      options.where = sequelize.where(
        sequelize.literal("MATCH(name, description)"),
        "AGAINST",
        sequelize.literal(`(${sequelize.escape(search)} IN BOOLEAN MODE)`)
      );
    } else if (search) {
      options.where.name = { [Op.like]: `%${search}%` };
    }

    // STOCK
    if (inStock === "true") {
      options.where.stock = { [Op.gt]: 0 };
    }

    // RATING
    if (minRating) {
      options.where.averageRating = { [Op.gte]: parseFloat(minRating) };
    }

    // PRICE RANGE
    if (priceMin || priceMax) {
      options.where.price = {};
      if (priceMin) options.where.price[Op.gte] = parseFloat(priceMin);
      if (priceMax) options.where.price[Op.lte] = parseFloat(priceMax);
    }

    // CATEGORY
    const categoryInclude = {
      model: Category,
      as: "category",
    };

    if (categorySlug || categoryId) {
      categoryInclude.where = categoryId
        ? { id: categoryId }
        : { slug: categorySlug };
      categoryInclude.required = true;
    }

    options.include.push(categoryInclude);

    // BRAND
    const brandInclude = {
      model: Brand,
      as: "brand",
    };

    if (brand || brandId) {
      brandInclude.where = brandId ? { id: brandId } : { name: brand };
      brandInclude.required = true;
    }

    options.include.push(brandInclude);

    // MEDIA
    options.include.push({
      model: Media,
      as: "media",
      attributes: ["id", "url", "fileType", "tag"],
    });

    // SELLER
    options.include.push({
      model: Seller,
      as: "seller",
      attributes: ["id", "storeName"],
    });

    // PRODUCT SPECIFICATIONS
    options.include.push({
      model: ProductSpec,
      as: "productSpecs",
      attributes: ["id", "key", "value"],
    });

    // REVIEWS - TO BE IMPLEMENTED
    // options.include.push({
    //   model: Review,
    //   as: "review",
    //   attributes: ["id", "rating", "comment", "createdAt"],
    //   include: [
    //     {
    //       model: User,
    //       as: "reviewer",
    //       attributes: ["id", "fullname"],
    //     },
    //   ],
    // });

    // SORTING
    const orderClause = [];
    if (sortBy === "popularity") {
      orderClause.push(["averageRating", order]);
    } else if (sortBy !== "relevance") {
      orderClause.push([sortBy, order]);
    }

    options.order = orderClause;

    // QUERY
    const { count, rows: products } = await Product.findAndCountAll({
      ...options,
      limit,
      offset,
      distinct: true,
    });

    return {
      products,
      total: count,
      limit,
      offset,
      hasMore: offset + limit < count,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error fetching filtered products: ", error);
    throw new ApiError(500, "Failed to fetch products.");
  }
};
