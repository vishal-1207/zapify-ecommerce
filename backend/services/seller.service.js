import slugify from "slugify";
import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

const User = db.User;
const SellerProfile = db.SellerProfile;

export const registerSellerService = async (data, optional) => {
  const t = sequelize.transaction();
  try {
    const { storeName, contactNumber, address, userId } = data;
    const { bio, website } = optional;

    const normalizedStoreName = storeName.trim();
    const slug = slugify(normalizedStoreName, { lower: true, strict: true });
    const existingSellerProfile = await SellerProfile.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("storeName")),
        normalizedStoreName
      ),
    });

    if (existingSellerProfile) {
      throw new ApiError(400, "Seller profile already exists.");
    }

    const existingStoreName = await SellerProfile.findOne({
      where: { storeName },
    });

    if (existingStoreName)
      throw new ApiError(400, "Store name already in use.");

    const seller = await SellerProfile.create(
      {
        storeName,
        bio,
        website,
        contactNumber,
        address,
        slug,
      },
      { transaction: t }
    );

    const user = await User.findByPk(userId, { transaction: t });
    const roles = new Set(user.roles);
    roles.add("seller");
    user.roles = Array.from(roles);
    await user.save({ transaction: t });

    await t.commit();
    return seller;
  } catch (err) {
    await t.rollback();
  }
};
