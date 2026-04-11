import { client, INDEX_NAME } from "../config/algolia.js";
import db from "../models/index.js";

/**
 * Formats a Sequelize product instance for Algolia.
 * @param {Product} product - The product instance with associations.
 * @returns {object} The flattened object for Algolia.
 */
const formatProductForAlgolia = async (productData) => {
  const product = productData?.get
    ? productData.get({ plain: true })
    : productData;

  if (!product) return null;

  const id = product.id;

  if (!id) {
    console.error(
      "[Algolia] Formatting failed: No unique identifier found for product:",
      product.name,
    );
    return null;
  }

  return {
    objectID: id,
    name: product.name,
    description: product.description,
    slug: product.slug,
    brand: product.brand?.name || "Unknown",
    category: product.category?.name || "Uncategorized",
    image:
      product.media?.find((m) => m.tag === "thumbnail")?.url ||
      product.media?.[0]?.url ||
      null,
    rating: parseFloat(product.averageRating) || 0,
    reviewCount: parseInt(product.reviewCount) || 0,
    status: product.status,
    mrpPrice: parseFloat(product.price) || 0,
    price: parseFloat(product.minOfferPrice) || 0,
    popularity: parseFloat(product.popularityScore) || 0,
    inStock: (parseInt(product.totalOfferStock) || 0) > 0,
    totalOfferStock: parseInt(product.totalOfferStock) || 0,
    sellerProfileIds:
      product.offers?.map((o) => o?.sellerProfileId).filter(Boolean) || [],
  };
};

/**
 * Syncs a single product to Algolia.
 * Called by Model Hooks after Create/Update.
 */
export const syncProductToAlgolia = async (productId) => {
  try {
    const product = await db.Product.findByPk(productId, {
      include: [
        { model: db.Brand, as: "brand" },
        { model: db.Category, as: "category" },
        { model: db.Media, as: "media" },
        {
          model: db.Offer,
          as: "offers",
          attributes: ["price", "sellerProfileId"],
          where: { status: "active" },
          required: false,
        },
      ],
    });

    if (!product) {
      console.warn(
        `[Algolia] Sync skipped: Product ${productId} not found in DB.`,
      );
      return;
    }

    const record = await formatProductForAlgolia(product);
    if (!record || !record.objectID) {
      throw new Error("Formatted record is invalid or missing objectID.");
    }

    await client.saveObject({
      indexName: INDEX_NAME,
      body: record,
    });

  } catch (error) {
    console.error(`Failed to sync product ${productId} to Algolia: `, error);
  }
};

/**
 * Bulk syncs all products associated with a specific Brand or Category.
 * Triggered when master records change their names to ensure search results
 * reflect the new metadata.
 */
export const reSyncProductsByCriteria = async (criteria = {}) => {
  try {
    const products = await db.Product.findAll({
      where: { ...criteria, status: "approved" },
      attributes: ["id"],
    });

    if (products.length === 0) return;

    for (const p of products) {
      syncProductToAlgolia(p.id).catch((err) =>
        console.error(
          `[Algolia] Cascade sync failed for ${p.id}:`,
          err.message,
        ),
      );
    }
  } catch (error) {
    console.error(`[Algolia] Bulk sync process failed:`, error.message);
  }
};

/**
 * Removes a product from Algolia.
 * Called by Model Hooks after Destroy.
 */
export const deleteProductFromAlgolia = async (productId) => {
  try {
    await client.deleteObject({
      indexName: INDEX_NAME,
      objectID: productId,
    });
  } catch (error) {
    console.error(
      `Failed to delete product ${productId} from Algolia: `,
      error,
    );
  }
};

export const searchProductsAlgolia = async (query, filters = {}) => {
  const { page = 1, limit = 20, category, brand, minPrice, maxPrice } = filters;

  const searchOptions = {
    query,
    page: page - 1,
    hitsPerPage: limit,
    filters: "status:approved",
  };

  const filterConditions = [];
  if (category) filterConditions.push(`category:"${category}"`);
  if (brand) filterConditions.push(`brand:"${brand}"`);
  if (minPrice) filterConditions.push(`price >= ${minPrice}`);
  if (maxPrice) filterConditions.push(`price <= ${maxPrice}`);

  if (filterConditions.length > 0) {
    searchOptions.filters += " AND " + filterConditions.join(" AND ");
  }

  try {
    const searchResults = await client.searchSingleIndex({
      indexName: INDEX_NAME,
      searchOptions,
    });

    const statsResults = await client.searchSingleIndex({
      indexName: INDEX_NAME,
      searchOptions: {
        ...searchOptions,
        filters: `status:approved${category ? ` AND category:"${category}"` : ""}${brand ? ` AND brand:"${brand}"` : ""}`,
        hitsPerPage: 0,
        facets: ["price"],
      },
    });

    return {
      products: searchResults.hits,
      total: searchResults.nbHits,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: searchResults.nbPages,
      maxPrice: statsResults.facets_stats?.price?.max || 0,
    };
  } catch (error) {
    console.warn(
      "[Algolia] Search failed, falling back to Database:",
      error.message,
    );

    const offset = (page - 1) * limit;
    const baseWhereClause = {
      status: "approved",
      [db.Sequelize.Op.or]: [
        { name: { [db.Sequelize.Op.like]: `%${query}%` } },
        { description: { [db.Sequelize.Op.like]: `%${query}%` } },
      ],
    };

    if (category) {
      const cat = await db.Category.findOne({ where: { slug: category } });
      if (cat) baseWhereClause.categoryId = cat.id;
    }
    if (brand) {
      const br = await db.Brand.findOne({ where: { slug: brand } });
      if (br) baseWhereClause.brandId = br.id;
    }

    const whereClause = { ...baseWhereClause };
    if (minPrice || maxPrice) {
      whereClause.minOfferPrice = {};
      if (minPrice) whereClause.minOfferPrice[db.Sequelize.Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.minOfferPrice[db.Sequelize.Op.lte] = parseFloat(maxPrice);
    }

    const { count, rows } = await db.Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: db.Brand, as: "brand" },
        { model: db.Category, as: "category" },
        { model: db.Media, as: "media" },
      ],
    });

    const maxPriceData = await db.Product.findOne({
      where: baseWhereClause,
      attributes: [[db.sequelize.fn("MAX", db.sequelize.col("minOfferPrice")), "maxPrice"]],
      raw: true
    });

    const formattedProducts = rows.map((p) => ({
      objectID: p.id,
      name: p.name,
      description: p.description,
      brand: p.brand?.name,
      category: p.category?.name,
      image:
        p.media?.find((m) => m.tag === "thumbnail")?.url || p.media?.[0]?.url,
      mrpPrice: parseFloat(p.price) || 0,
      price: parseFloat(p.minOfferPrice) || 0,
      totalOfferStock: p.totalOfferStock,
    }));

    return {
      products: formattedProducts,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      maxPrice: parseFloat(maxPriceData?.maxPrice) || 0,
    };
  }
};
