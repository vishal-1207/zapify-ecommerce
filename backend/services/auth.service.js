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
      { transaction },
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
        console.error("Failed to send welcome email:", err.message),
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
      "Identification (Email/Username/Phone) and password are required.",
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
        "Session not found or already revoked. Please login again.",
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

/**
 * Forgot Password service to handle password reset requests.
 */
export const forgotPasswordService = async (email) => {
  const user = await db.User.findOne({ where: { email } });

  if (!user) {
    throw new ApiError(
      404,
      "User with this email will receive a password reset link if the account exists.",
    );
  }

  const resetToken = jwt.sign(
    { id: user.id },
    process.env.PASSWORD_RESET_SECRET,
    { expiresIn: "1h" },
  );

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const subject = "Password Reset Request";
  const html = `<p>Hi ${user.fullname},</p>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>`;

  try {
    await sendMail(email, subject, html);
  } catch (mailError) {
    console.error("Failed to send password reset email:", mailError);
    throw new ApiError(
      500,
      "Failed to send password reset email. Please try again later.",
    );
  }

  return { message: "Password reset email sent successfully." };
};

/**
 * Reset Password service to update user's password.
 */
export const resetPasswordService = async (token, newPassword) => {
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.PASSWORD_RESET_SECRET);
  } catch (jwtError) {
    const message =
      jwtError.name === "TokenExpiredError"
        ? "Password reset token expired."
        : "Invalid password reset token.";
    throw new ApiError(401, message);
  }

  const user = await db.User.findByPk(decodedToken.id);

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  user.password = hashedPassword;
  await user.save();

  return { message: "Password has been reset successfully." };
};
