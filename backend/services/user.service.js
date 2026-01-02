import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

const User = db.User;

const checkExistingUser = async (param) => {
  const user = await User.findOne({
    where: { [Op.or]: [{ username: param }, { email: param }] },
  });

  return user;
};

/**
 * User service to update their profile data such as email, name, password, etc, fields may vary.
 * @param {*} userId - User ID for which the profile will be updated.
 * @param {*} profileData - User profile data including email, name and password (maybe).
 */
export const updateUserProfile = async (userId, profileData) => {
  const { name, email, currentPassword, newPassword } = profileData;
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) throw new ApiError(401, "Invalid current password.");

  if (name && name !== user.name) {
    const existingUser = await checkExistingUser(name);
    if (existingUser) {
      throw new ApiError(401, "Username already in use.");
    }
  }

  if (email && email !== user.email) {
    const existingUser = await checkExistingUser(email);
    if (existingUser) {
      throw new ApiError(401, "Email already in use.");
    }
    user.email = email;
  }

  if (newPassword) {
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    user.password = await bcrypt.hash(newPassword, saltRounds);
  }

  await user.save();

  return user;
};

/**
 * Forgot password service to send users to change/reset their account password.
 * @param {email} - Require user email which will recieve password reset link mail.
 */
export const forgotPassword = async (email) => {
  const user = await db.User.findOne({ where: { email } });

  if (!user) {
    return {
      message:
        "If a user exists with this email, a password reset link has been sent.",
    };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const subject = "Your Password Reset Request.";
  const html = `<p>You requested a password reset. Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
  await sendMail(email, subject, html).catch((error) => {
    console.error("Failed to send password reset mail: ", error);
  });

  return { message: "Password reset link sent." };
};

/**
 * Resets a user's password using a valid token.
 * @param {*} token
 * @param {*} newPassword
 */
export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await db.User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [db.Sequelize.Op.gt]: Date.now() },
    },
  });

  if (!user) throw new ApiError(400, "Token is invalid or has expired.");

  const saltRounds = parseInt(process.env.SALT_ROUNDS);
  user.password = await bcrypt.hash(newPassword, saltRounds);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return { message: "Password has been reset successfully." };
};

/**
 * User service to schedule user account deletion once the user has confirmed their account deletion.
 * @param {*} userId - User ID for which account deletion will be scheduled.
 * @param {*} gracePeriodInDays - Nmber of days after which the account will be permanently deleted.
 */
export const scheduleUserDeletion = async (userId, gracePeriodInDays = 30) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + gracePeriodInDays);

  await User.update({
    scheduledForDeletionAt: deletionDate,
  });

  await User.destroy();

  return {
    message: `Account deletion initiated. All personal data will be permanently erased on ${deletionDate.toISOString()}.`,
  };
};
