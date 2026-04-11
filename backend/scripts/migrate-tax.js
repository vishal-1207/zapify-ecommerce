import sequelize from "../config/db.js";

/**
 * Manual migration script to add tax columns to the Orders table.
 * This is necessary because TiDB constraints prevent Sequelize's 'alter: true' 
 * from working correctly on all tables.
 */
const migrate = async () => {
    try {
        console.log("⏳ Starting migration: Adding tax columns to Orders table...");

        // 1. Add taxAmount column
        await sequelize.query(`
            ALTER TABLE Orders 
            ADD COLUMN IF NOT EXISTS taxAmount DECIMAL(10, 2) DEFAULT 0.00;
        `);
        console.log("✅ Column 'taxAmount' checked/added.");

        // 2. Add taxRate column
        await sequelize.query(`
            ALTER TABLE Orders 
            ADD COLUMN IF NOT EXISTS taxRate DECIMAL(5, 2) DEFAULT 18.00;
        `);
        console.log("✅ Column 'taxRate' checked/added.");

        console.log("🎉 Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:");
        console.error(error.message);
        process.exit(1);
    }
};

migrate();
