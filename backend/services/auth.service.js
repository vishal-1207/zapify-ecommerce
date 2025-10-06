import db from "../models/index.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import generateTokens from "../utils/token.utils.js";
import ApiError from "../utils/ApiError.js";
import setTokensInCookies from "../utils/setTokensInCookies.js";
import crypto from "crypto";
import sendMail from "../utils/mailUtility.js";

const User = db.User;
const UserSettings = db.UserSettings;
const Cart = db.Cart;

/**
 * Register service creates a new user and store it in the database.
 * @param {userData} - userData consist of name, email, password which is required for account creation.
 * @return {user, accessToken} - Return new user after successful registration.
 */
export const registerService = async (userData, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { fullname, username, email, password } = userData;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    // Check if user already exists.
    if (existingUser) {
      const message =
        existingUser.username === username
          ? "Username is already taken."
          : "Email is already registered.";

      throw new ApiError(409, message);
    }

    // Create hashed passwords.
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create(
      {
        fullname,
        username,
        email,
        password: hashedPassword,
        roles: ["user"],
        provider: "local",
      },
      { transaction }
    );

    // Create associated records.
    await UserSettings.create({ userId: user.id }, { transaction });
    await Cart.create({ userId: user.id }, { transaction });

    const payload = { userId: user.id, roles: user.roles };
    const tokens = generateTokens(payload);

    setTokensInCookies(res, tokens);

    await transaction.commit();

    // Send welcome email (fire and forget, don't block the response)
    const subject = "Welcome to Zapify!";
    const html = `<h1>Hi ${fullname},</h1><p>Thank you for registering. Welcome to our community!</p>`;
    sendMail(email, subject, html).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

    return { user: user, accessToken: tokens.accessToken };
  } catch (error) {
    await transaction.rollback();
    console.error("Registration failed, transaction rolled back: ", error);
    throw new ApiError(500, "Could not register user.");
  }
};

//Find User Service
export const loginService = async (userData, res) => {
  const { userId, password } = userData;
  const user = await User.findOne({
    where: {
      [Op.or]: [{ username: userId }, { email: userId }],
    },
  });

  if (!user) throw new ApiError(404, "User not found.");

  if (user.provider !== "local")
    throw new ApiError(400, `Login via ${user.provider} account.`);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials.");

  const payload = {
    userId: user.id,
    roles: user.roles,
  };

  const tokens = generateTokens(payload);
  setTokensInCookies(res, tokens);

  return { user, accessToken: tokens.accessToken };
};
