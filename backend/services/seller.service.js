import slugify from "slugify";
import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

const User = db.User;
const SellerProfile = db.SellerProfile;
const SellerSettings = db.SellerSettings;

const findStore = async (storeName) => {
  const slug = slugify(storeName, {
    replacement: "-",
    lower: true,
    strict: true,
    trim: true,
  });

  const existingSeller = await SellerProfile.findOne({
    where: { slug },
  });

  return { slug, existingSeller };
};

export const registerSellerService = async (data, optional) => {
  const transaction = sequelize.transaction();
  try {
    const { storeName, contactNumber, address, userId } = data;
    const { bio, website } = optional;

    const { slug, existingSeller } = await findStore(storeName);

    if (existingSeller)
      throw new ApiError(400, `Store ${existingSeller} already exists.`);

    const seller = await SellerProfile.create(
      {
        storeName,
        bio,
        website,
        contactNumber,
        address,
        slug,
      },
      { transaction }
    );

    const user = await User.findByPk(userId, { transaction });
    const roles = new Set(user.roles);
    roles.add("seller");
    user.roles = Array.from(roles);
    await user.save({ transaction });

    await SellerSettings.create(
      { sellerProfileId: seller.id },
      { transaction }
    );

    await transaction.commit();
    return seller;
  } catch (err) {
    await transaction.rollback();
  }
};

export const updateSellerService = async (data, optional) => {
  const { storeName, contactNumber, address, slug } = data;
  const { bio, website } = optional;

  const existingSeller = await SellerProfile.findOne({ where: { slug } });

  if (!existingSeller) {
    throw new ApiError(404, `Store ${storeName} not found.`);
  }

  let newSlug = "";
  if (existingSeller.storeName !== storeName) {
    newSlug = slugify(storeName, {
      replacement: "-",
      lower: true,
      strict: true,
      trim: true,
    });
  }

  existingSeller.storeName = storeName;
  existingSeller.contactNumber = contactNumber;
  existingSeller.address = address;
  existingSeller.slug = newSlug === "" ? slug : newSlug;
  existingSeller.bio = bio;
  existingSeller.website = website;

  await existingSeller.save();
  return existingSeller;
};
