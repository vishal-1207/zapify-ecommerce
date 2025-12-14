import { algoliasearch } from "algoliasearch";

const APP_ID = process.env.ALGOLIA_APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const INDEX_NAME = process.ALGOLIA_INDEX_NAME || "products";

if (!APP_ID || !ADMIN_KEY) {
  console.warn(
    "Algolia credentials missing. Search functionality may not work."
  );
}

const client = algoliasearch(APP_ID, ADMIN_KEY);
export const productIndex = client.initIndex(INDEX_NAME);

export const configureAlgoliaIndex = async () => {
  try {
    await productIndex.setSettings({
      searchableAttributes: ["name", "brand", "category", "description"],
      // Fields to use for filtering (facets)
      attributesForFaceting: [
        "brand",
        "category",
        "status",
        "searchable(price)", // Allows filtering by price range
      ],
      customRanking: ["desc(averageRating)", "desc(reviewCount)", "asc(price)"],
    });
    console.log("Algolia index settings configured.");
  } catch (error) {
    console.error("Failed to configure Algolia settings:", error);
  }
};
