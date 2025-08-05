import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { Op } from "sequelize";

const Product = db.Product;
const Media = db.Media;
const ProductSpec = db.ProductSpec;
const Category = db.Category;
const Brand = db.Brand;

// TODO: Complete get filtered products service for search functionality
export const getFilteredProudcts = async (query) => {
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

    const allowedSortedBy = ["createdAt", "price", "name"];
    const sortBy = allowedSortedBy.includes(query.sortBy)
      ? query.sortBy
      : search
      ? "relevance"
      : "createdAt";
    const order = query.order?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const limit = parseInt(query.limit) || 10;
    const offset = parseInt(query.offset) || 0;

    const options = {
      where: {},
      include: [],
      replacements: {},
    };

    if (search === "relevance") {
      options.where = sequelize.literal(
        "MATCH(name, description) AGAINST(:query IN BOOLEAN MODE)"
      );
      options.replacements = { query: search };
    } else {
      options.where.name = { [Op.like]: `%${search}%` };
    }

    if (inStock === "true") options.where.stock = { [Op.gt]: 0 };
    if (minRating)
      options.where.averageRating = { [Op.gte]: parseFloat(minRating) };

    if (priceMin || priceMax) {
      options.where.price = {};
      if (priceMin) options.where.price = { [Op.gte]: parseFloat(priceMin) };
      if (priceMax) options.where.price = { [Op.lte]: parseFloat(priceMax) };
    }

    if (categorySlug || categoryId) {
      options.include.push({
        model: Category,
        where: categoryId ? { id: categoryId } : { slug: categorySlug },
        required: true,
      });
    }

    if (brand || brandId) {
      options.include.push({
        model: Brand,
        where: brandId ? { id: brandId } : { name: brand },
        required: true,
      });
    }

    const orderClause = [];
    if (sortBy === "popularity") {
      orderClause.push(["averageRating", order]);
    } else if (sortBy !== "relevance") {
      orderClause.push([sortBy, order]);
    }

    options.order = orderClause;

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
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error fetching filtered products: ", error);
    throw new ApiError(500, "Failed to fetch products.");
  }
};
