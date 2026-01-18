import dotenv from "dotenv";
import db from "../models/index.js";
import { syncProductToAlgolia } from "../services/algolia.service.js";
import { configureAlgoliaIndex } from "../config/algolia.js";
import { updateProductAggregates } from "../services/product.service.js";

dotenv.config();

const runSync = async () => {
  console.log("Starting Algolia Sync...");

  try {
    await db.sequelize.authenticate();
    console.log("Database connected.");

    await configureAlgoliaIndex();

    const products = await db.Product.findAll({
      where: {
        status: "approved",
      },
      attributes: ["id"],
    });

    console.log(`Found ${products.length} approved products to sync.`);

    for (const product of products) {
      await updateProductAggregates(product.id);
      await syncProductToAlgolia(product.id);
      process.stdout.write(".");
    }

    console.log("\nSync complete.");
    process.exit(0);
  } catch (error) {
    console.error("\nSync failed: ", error);
    process.exit(1);
  }
};

runSync();
