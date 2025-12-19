import db from "../models/index.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import generateTokens from "../utils/token.utils.js";
import ApiError from "../utils/ApiError.js";
import setTokensInCookies from "../utils/setTokensInCookies.js";
import sendMail from "../utils/mailUtility.js";

/**
 * Register service creates a new user and store it in the database.
 * @param {object} userData - userData consist of name, email, password which is required for account creation.
 * @return {object} - Return new user after successful registration.
 */
export const registerService = async (userData, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { fullname, username, email, password } = userData;

    const whereClause = [];
    if (email) whereClause.push({ email });
    if (username) whereClause.push({ username });
    if (phoneNumber) whereClause.push({ phoneNumber });

    const existingUser = await db.User.findOne({
      where: { [db.Sequelize.Op.or]: whereClause },
    });
    if (existingUser) {
      throw new ApiError(
        409,
        "User with this email, username, or phone number already exists."
      );
    }

    // Create hashed passwords.
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await db.User.create(
      {
        fullname,
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        roles: ["user"],
        provider: "local",
      },
      { transaction }
    );

    // Create associated records.
    await db.Cart.create({ userId: user.id }, { transaction });

    const payload = { userId: user.id, roles: user.roles };
    const tokens = generateTokens(payload);

    setTokensInCookies(res, tokens);

    await transaction.commit();

    // Send welcome email (fire and forget, don't block the response)
    const subject = "Welcome to Zapify!";
    const html = `<h1>Hi ${fullname},</h1><p>Thank you for registering. Welcome to our community!</p>`;
    if (email) {
      sendMail(email, subject, html).catch((err) =>
        console.error("Failed to send welcome email:", err)
      );
    }

    return { user: user, accessToken: tokens.accessToken };
  } catch (error) {
    await transaction.rollback();
    console.error("Registration failed, transaction rolled back: ", error);
    throw new ApiError(500, "Could not register user.");
  }
};

// Login service
export const loginService = async (userData, res) => {
  const { userId, password } = userData;

  if (!userId || !password) {
    throw new ApiError(400, "Username/Email/Phone and password are required.");
  }

  // Find the user by username, email, OR phone number
  const user = await db.User.findOne({
    where: {
      [db.Sequelize.Op.or]: [
        { username: userId },
        { email: userId },
        { phoneNumber: userId },
      ],
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.provider !== "local")
    throw new ApiError(400, `Login via ${user.provider} account.`);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid user credentials.");

  const payload = {
    userId: user.id,
    roles: user.roles,
  };

  const tokens = generateTokens(payload);
  setTokensInCookies(res, tokens);

  return { user, accessToken: tokens.accessToken };
};
