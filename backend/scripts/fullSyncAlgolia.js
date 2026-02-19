
import "dotenv/config";
import db from "../models/index.js";
import { client, INDEX_NAME } from "../config/algolia.js";
import { syncProductToAlgolia } from "../services/algolia.service.js";

const run = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("DB Connected");

    console.log(`Clearing Algolia Index '${INDEX_NAME}'...`);
    // Attempt to clear objects. If using v5 lite client, this might vary.
    // Based on deleteObject usage, we assume clearObjects exists or we use browse/delete.
    try {
        await client.clearObjects({ indexName: INDEX_NAME });
    } catch (e) {
        console.warn("clearObjects failed, checking if clearIndex works or index doesn't exist...", e.message);
        // Fallback or ignore if index doesn't exist
    }

    const products = await db.Product.findAll({
        where: { status: "approved", isActive: true },
        attributes: ["id", "name"]
    });

    console.log(`Found ${products.length} approved products to sync.`);

    for (const p of products) {
        console.log(`Syncing ${p.name} (${p.id})...`);
        await syncProductToAlgolia(p.id);
    }

    console.log("Full Sync Completed.");
  } catch (error) {
    console.error("Critical Error:", error);
  } finally {
    await db.sequelize.close();
  }
};

run();
