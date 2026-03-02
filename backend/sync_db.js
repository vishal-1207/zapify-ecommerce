import db from "./models/index.js";

async function run() {
  try {
    console.log(
      "Adding averageRating and reviewCount columns to SellerProfiles via raw SQL...",
    );

    // Add averageRating if it doesn't exist
    try {
      await db.sequelize.query(
        `ALTER TABLE SellerProfiles ADD COLUMN averageRating FLOAT DEFAULT 0.0;`,
      );
      console.log("Added averageRating column.");
    } catch (e) {
      if (e.original && e.original.code === "ER_DUP_FIELDNAME") {
        console.log("averageRating column already exists.");
      } else {
        throw e;
      }
    }

    // Add reviewCount if it doesn't exist
    try {
      await db.sequelize.query(
        `ALTER TABLE SellerProfiles ADD COLUMN reviewCount INTEGER DEFAULT 0;`,
      );
      console.log("Added reviewCount column.");
    } catch (e) {
      if (e.original && e.original.code === "ER_DUP_FIELDNAME") {
        console.log("reviewCount column already exists.");
      } else {
        throw e;
      }
    }

    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error("Error executing raw query:", error);
    process.exit(1);
  }
}

run();
