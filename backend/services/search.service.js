import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { Op } from "sequelize";

const Product = db.Product;
const Media = db.Media;
const ProductSpec = db.ProductSpec;
const Category = db.Category;
const Brand = db.Brand;

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
    const orderClause = [[sortBy, order]];

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    if (priceMin !== undefined || priceMax !== undefined) {
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

      include.push({
        model: Category,
        where: categoryWhere,
        attributes: [],
      });
    }

    if (brand || brandId) {
      const brandWhere = brand ? { name: brand } : { id: brandId };

      include.push({
        model: Brand,
        where: brandWhere,
        attributes: [],
      });
    }

    const products = await Product.findAll({
      where,
      include,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching filtered products: ", error);
    throw new ApiError();
  }
};
