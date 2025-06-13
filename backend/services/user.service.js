import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

const User = db.User;

const checkExistingUser = async (param) => {
  const user = await User.findOne({
    where: { [Op.or]: [{ username: param }, { email: param }] },
  });

  return user;
};

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
};
