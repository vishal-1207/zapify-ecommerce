import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { Op } from "sequelize";

const Product = db.Product;
const Media = db.Media;
const ProductSpec = db.ProductSpec;
const Category = db.Category;
const Brand = db.Brand;

// TODO: Complete get filtered products service for search functionalitys
export const getFilteredProudcts = async (query) => {
  try {
    const {
      search,
      categorySlug,
      categoryId,
      brandId,
      brand,
      inStock,
      priceMin,
      priceMax,
      sortBy = "createdAt",
      order = "DESC",
      limit = 10,
      offset = 0,
    } = query;

    const where = {};
    const include = [];
    const orderClause = [
      [sortBy, order.toUpperCase() === "ASC" ? "ASC" : "DESC"],
    ];

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      if (priceMin && priceMax && parseFloat(priceMin) > parseFloat(priceMax)) {
        throw new ApiError(
          400,
          "Minimum price cannot be greater than maximum price"
        );
      }

      where.price = {};
      if (priceMin !== undefined) where.price[Op.gte] = priceMin;
      if (priceMax !== undefined) where.price[Op.lte] = priceMax;
    }

    if (inStock) {
      where.stock = { [Op.gt]: 0 };
    }

    if (categorySlug || categoryId) {
      const categoryWhere = categorySlug
        ? { slug: categorySlug }
        : { id: categoryId };

      const category = await Category.findOne({ where: categoryWhere });
      if (!category) throw new ApiError(404, "Category not found.");

      include.push({
        model: Category,
        where: { id: category.id },
        attributes: [],
      });
    }

    if (brand || brandId) {
      const brandWhere = brand ? { name: brand } : { id: brandId };
      const brandRecord = await Brand.findOne({ where: brandWhere });
      if (!brandRecord) throw new ApiError(404, "Brand not found.");

      include.push({
        model: Brand,
        where: { id: brandRecord.id },
        attributes: [],
      });
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      products,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error fetching filtered products: ", error);
    throw new ApiError(500, "Failed to fetch products.");
  }
};
