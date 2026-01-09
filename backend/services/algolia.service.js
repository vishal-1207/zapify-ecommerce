import { client, INDEX_NAME } from "../config/algolia.js";
import db from "../models/index.js";

/**
 * Formats a Sequelize product instance for Algolia.
 * @param {Product} product - The product instance with associations.
 * @returns {object} The flattened object for Algolia.
 */
const formatProductsForAlgolia = async (product) => {
  let bestPrice = 0;
  if (product.Offers && product.Offers.length > 0) {
    bestPrice = Math.min(...product.Offers.map((o) => parseFloat(o.price)));
  }

  return {
    objectId: product.id,
    name: product.name,
    description: product.description,
    slug: product.slug,
    brand: product.Brand?.name || "Unknown",
    category: product.Category?.name || "Uncategorized",
    image: product.Media?.find((m) => m.tag == "thumbnail")?.url || null,
    rating: parseFloat(product.averageRating) || 0,
    reviewCount: parseInt(product.reviewCount) || 0,
    status: product.status,
    price: parseFloat(product.minOfferPrice) || 0,
    popularity: parseFloat(product.popularityScore) || 0,
    inStock: product.totalOfferStock > 0,
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
        { model: db.Offer, as: "offers", attributes: ["price"] },
      ],
    });

    if (!product) return;

    // Only index 'approved' products
    if (product.status !== "approved") {
      await client.deleteObject({ indexName: INDEX_NAME, objectId: productId });
      return;
    }

    const algoliaObject = formatProductsForAlgolia(product);
    await client.saveObject({ indexName: INDEX_NAME, algoliaObject });
    console.log(`Synced product ${productId} to Algolia`);
  } catch (error) {
    console.error(`Failed to sync product ${productId} to Algolia: `, error);
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
    console.log(`Deleted product ${productId} from Algolia.`);
  } catch (error) {
    console.error(
      `Failed to delete product ${productId} from Algolia: `,
      error
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

  const { hits, nbHits, nbPages } = await client.searchSingleIndex({
    indexName: INDEX_NAME,
    searchOptions,
  });

  return {
    products: hits,
    total: nbHits,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: nbPages,
  };
};
