import dotenv from "dotenv";
dotenv.config();
import db from "../models/index.js";
import bcrypt from "bcrypt";

/**
 * Script to seed the initial Admin user into the database.
 * Run this using: node scripts/createAdmin.js
 */
const createAdmin = async () => {
  const transaction = await db.sequelize.transaction();

  try {
    // Ensure database is in sync before proceeding
    await db.sequelize.authenticate();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error(
        "❌ Error: ADMIN_EMAIL or ADMIN_PASSWORD missing in .env file."
      );
      return;
    }

    const existingAdmin = await db.User.findOne({
      where: { email: adminEmail },
      transaction,
    });

    if (existingAdmin) {
      console.log("ℹ️ Admin already exists in the database.");
      await transaction.rollback();
      return;
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const admin = await db.User.create(
      {
        fullname: process.env.ADMIN_FULLNAME || "System Administrator",
        username: process.env.ADMIN_NAME || "admin",
        email: adminEmail,
        password: hashedPassword,
        // FIXED: Roles MUST be an array for the authorizeRoles middleware to work
        roles: ["admin"],
        isEmailVerified: true, // Auto-verify admin to skip OTP flow
      },
      { transaction }
    );

    await transaction.commit();
    console.log("✅ Admin created successfully:", {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      roles: admin.roles,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("❌ Error creating admin:", error.message);
  } finally {
    process.exit();
  }
};

createAdmin();
