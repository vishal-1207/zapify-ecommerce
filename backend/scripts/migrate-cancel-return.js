/**
 * One-shot migration: adds cancellationReason column and new ENUM values
 * for the cancel/return feature.
 *
 * Run once with:  node scripts/migrate-cancel-return.js
 */
import dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,
  },
);

const run = async () => {
  const qi = sequelize.getQueryInterface();

  // 1. Add cancellationReason column to Orders (ignore if already exists)
  try {
    await qi.addColumn("Orders", "cancellationReason", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "shippingAddress",
    });
    console.log("✅  Added Orders.cancellationReason");
  } catch (e) {
    if (e.original?.code === "ER_DUP_FIELDNAME") {
      console.log("⏩  Orders.cancellationReason already exists, skipping.");
    } else throw e;
  }

  // 2. Alter Orders.status ENUM to include return_requested
  try {
    await sequelize.query(`
      ALTER TABLE \`Orders\`
      MODIFY COLUMN \`status\` ENUM(
        'pending','processing','shipped','delivered','cancelled','return_requested'
      ) NOT NULL DEFAULT 'pending';
    `);
    console.log("✅  Updated Orders.status ENUM");
  } catch (e) {
    console.error("❌  Failed to update Orders.status ENUM:", e.message);
  }

  // 3. Alter OrderItems.status ENUM to include return_requested
  try {
    await sequelize.query(`
      ALTER TABLE \`OrderItems\`
      MODIFY COLUMN \`status\` ENUM(
        'pending','processing','shipped','delivered','cancelled','refunded','return_requested'
      ) NOT NULL DEFAULT 'pending';
    `);
    console.log("✅  Updated OrderItems.status ENUM");
  } catch (e) {
    console.error("❌  Failed to update OrderItems.status ENUM:", e.message);
  }

  // 4. Alter Payments.status ENUM to include refunded
  try {
    await sequelize.query(`
      ALTER TABLE \`Payments\`
      MODIFY COLUMN \`status\` ENUM(
        'pending','succeeded','failed','refunded'
      ) NOT NULL DEFAULT 'pending';
    `);
    console.log("✅  Updated Payments.status ENUM");
  } catch (e) {
    console.error("❌  Failed to update Payments.status ENUM:", e.message);
  }

  await sequelize.close();
  console.log("\n🎉  Migration complete.");
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
