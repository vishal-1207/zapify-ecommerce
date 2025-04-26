import db from "../models/index.js";
import bcrypt from "bcrypt";

const createAdmin = async () => {
  try {
    await db.sequelize.sync();
    const existingAdmin = await db.User.findOne({
      where: { email: process.env.ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log("Admin already exist.");
      return;
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS);

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_EMAIL,
      saltRounds
    );

    const admin = await db.User.create({
      fullname: process.env.ADMIN_FULLNAME,
      username: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully.", admin.toJSON());
  } catch (error) {
    console.error("Error creating admin.", error);
  } finally {
    process.exit();
  }
};

createAdmin();
