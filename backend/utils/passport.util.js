import db from "../models/index.js";

const User = db.User;

export const generateUniqueName = async (fullName) => {
  const baseUsername = fullName.toLowerCase();

  let username = baseUsername;
  while (await User.findOne({ where: { username } })) {
    const randomSuffix = generateRandomSuffix(4);
    username = `${baseUsername}${randomSuffix}`;
  }

  return username;
};

const generateRandomSuffix = (count) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < count; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};
