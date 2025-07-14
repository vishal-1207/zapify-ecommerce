import db from "../models/index.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import generateTokens from "../utils/token.utils.js";
import ApiError from "../utils/ApiError.js";
import setTokensInCookies from "../utils/setTokensInCookies.js";

const User = db.User;

//Create User Service
export const createUser = async (userData, res) => {
  const { fullname, username, email, password } = userData;

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

    throw new ApiError(409, message);
  }

  const saltRounds = parseInt(process.env.SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    fullname,
    username,
    email,
    password: hashedPassword,
    roles: ["user"],
    provider: "local",
  });

  const payload = { userId: user.id, roles: user.roles };
  const tokens = generateTokens(payload);

  setTokensInCookies(res, tokens);

  return { user, accessToken: tokens.accessToken };
};

//Find User Service
export const findUser = async (userData, res) => {
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
