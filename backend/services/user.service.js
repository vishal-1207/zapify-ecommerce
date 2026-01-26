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
