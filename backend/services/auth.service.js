import db from "../models/index.js";
import bcrypt from "bcrypt";
import generateTokens from "../utils/token.utils.js";
import ApiError from "../utils/ApiError.js";
import sendMail from "../utils/mailUtility.js";
import jwt from "jsonwebtoken";

/**
 * Register service creates a new user and store it in the database.
 * @param {object} userData - userData consist of name, email, password which is required for account creation.
 * @return {object} - Return new user after successful registration.
 */
export const registerService = async (userData) => {
  const { fullname, username, email, phoneNumber, password } = userData;

  const existingUser = await db.User.findOne({
    where: {
      [db.Sequelize.Op.or]: [
        { email: email || null },
        { username: username || null },
        { phoneNumber: phoneNumber || null },
      ].filter((condition) => Object.values(condition)[0] !== null),
    },
  });

  if (existingUser) {
    if (email && existingUser.email === email) {
      throw new ApiError(409, "A user with this email already exists.");
    }
    if (username && existingUser.username === username) {
      throw new ApiError(409, "This username is already taken.");
    }
    if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
      throw new ApiError(409, "This phone number is already registered.");
    }
  }

  const transaction = await db.sequelize.transaction();
  try {
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await db.User.create(
      {
        fullname,
        username: username.toLowerCase(),
        email: email ? email.toLowerCase() : null,
        phoneNumber,
        password: hashedPassword,
        roles: ["user"],
        provider: "local",
      },
      { transaction }
    );

    if (db.Cart) {
      await db.Cart.create({ userId: user.id }, { transaction });
    }

    const tokens = await generateTokens(user, transaction);

    await transaction.commit();

    if (email) {
      const subject = "Welcome to Zapify!";
      const html = `<h1>Hi ${fullname},</h1><p>Thank you for registering. Welcome to our community!</p>`;
      sendMail(email, subject, html).catch((err) =>
        console.error("Failed to send welcome email:", err.message)
      );
    }

    return { user, tokens };
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Registration failed:", error);
    throw new ApiError(500, "Registration failed due to a server error.");
  }
};

/**
 * Login service authenticates a user and returns tokens.
 */
export const loginService = async (userData) => {
  const { userId, password } = userData;

  if (!userId || !password) {
    throw new ApiError(
      400,
      "Identification (Email/Username/Phone) and password are required."
    );
  }

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
    throw new ApiError(401, "Invalid credentials or account does not exist.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials.");
  }

  const transaction = await db.sequelize.transaction();
  try {
    const tokens = await generateTokens(user, transaction);

    await transaction.commit();
    return { user, tokens };
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Login session creation failed:", error);
    throw new ApiError(500, "Login failed during session creation.");
  }
};

/**
 * Validates a refresh token and generates a new pair (Token Rotation).
 */
export const refreshAccessToken = async (incomingToken) => {
  let decodedToken;

  try {
    decodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (jwtError) {
    const message =
      jwtError.name === "TokenExpiredError"
        ? "Refresh token expired. Please login again."
        : "Invalid refresh token.";
    throw new ApiError(401, message);
  }

  const transaction = await db.sequelize.transaction();
  try {
    const storedToken = await db.RefreshToken.findOne({
      where: {
        tokenId: decodedToken.tokenId,
        userId: decodedToken.id,
      },
      transaction,
    });

    if (!storedToken) {
      await transaction.rollback();
      throw new ApiError(
        401,
        "Session not found or already revoked. Please login again."
      );
    }

    if (new Date() > new Date(storedToken.expiresAt)) {
      await storedToken.destroy({ transaction });
      await transaction.commit();
      throw new ApiError(401, "Refresh token expired. Please login again.");
    }

    const user = await db.User.findByPk(decodedToken.id, {
      attributes: { exclude: ["password"] },
      transaction,
    });

    if (!user) {
      await transaction.rollback();
      throw new ApiError(401, "User account no longer exists.");
    }

    await storedToken.destroy({ transaction });
    const tokens = await generateTokens(user, transaction);

    await transaction.commit();
    return { user, ...tokens };
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    if (error instanceof ApiError) throw error;

    console.error("Token Rotation Error:", error);
    throw new ApiError(500, "Internal server error during session refresh.");
  }
};
