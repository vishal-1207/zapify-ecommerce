
import "dotenv/config";
import db from "../models/index.js";
import { client, INDEX_NAME } from "../config/algolia.js";
import { syncProductToAlgolia } from "../services/algolia.service.js";

const run = async () => {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.authenticate();
    const INDEX_NAME = "products";
    try {
        await client.clearObjects({ indexName: INDEX_NAME });
    } catch (e) {
        console.warn("clearObjects failed, checking if clearIndex works or index doesn't exist...", e.message);
    }

    const products = await db.Product.findAll({
        where: { status: "approved", isActive: true },
        attributes: ["id", "name"]
    });

    for (const p of products) {
        await syncProductToAlgolia(p.id);
    }

  } catch (error) {
    console.error("Critical Error:", error);
  } finally {
    await db.sequelize.close();
  }
};

run();
