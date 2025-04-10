import db from "../models/index.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";

const User = db.User;

export const createUser = async (userData) => {
  const { username, email, password } = userData;

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ username }, { email }],
    },
  });

  if (existingUser) {
    const message =
      existingUser.username === username
        ? "Username is already taken."
        : "Email is already registered.";

    console.error();
    throw new Error(message);
  }

  const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  return newUser;
};
