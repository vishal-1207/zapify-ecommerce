import slugify from "slugify";
import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

const getStoreSlug = (storeName) => {
  const slug = slugify(storeName, {
    replacement: "-",
    lower: true,
    strict: true,
    trim: true,
  });

  return slug;
};

const findStore = async (storeName) => {
  const slug = getStoreSlug(storeName);

  const existingSeller = await db.SellerProfile.findOne({
    where: { slug },
  });

  return { slug, existingSeller };
};

/**
 * Creates a seller profile for an existing user, upgrading their role.
 * This is an atomic operation within a transaction.
 * @param {string} userId - The ID of the user becoming a seller.
 * @param {object} profileData - The initial data for the seller profile (e.g., storeName).
 * @returns {Promise<SellerProfile>} The newly created seller profile.
 */
export const createSellerProfile = async (data, optional) => {
  const transaction = sequelize.transaction();
  try {
    const { storeName, contactNumber, address, userId } = data;
    const bio = optional;

    const { slug, existingSeller } = await findStore(storeName);

    if (existingSeller)
      throw new ApiError(400, `Store ${existingSeller} already exists.`);

    const seller = await db.SellerProfile.create(
      {
        storeName,
        bio,
        contactNumber,
        address,
        slug,
      },
      { transaction }
    );

    const user = await db.User.findByPk(userId, { transaction });
    const roles = new Set(user.roles);
    roles.add("seller");
    user.roles = Array.from(roles);
    await user.save({ transaction });

    await transaction.commit();
    return seller;
  } catch (err) {
    await transaction.rollback();
  }
};

/**
 * Fetches the profile of the currently authenticated seller.
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<SellerProfile>} The seller's profile.
 */
export const getSellerProfile = async (userId) => {
  const seller = await db.SellerProfile.findOne({ where: { userId } });

  if (!seller) {
    throw new ApiError(404, "Seller profile not found for this user.");
  }

  return seller;
};

/**
 * Updates the core details (storeName, bio) of a seller's profile.
 * @param {string} userId - The ID of the authenticated user.
 * @param {object} updateData - The data to update (storeName, bio).
 * @returns {Promise<SellerProfile>} The updated seller profile.
 */
export const updateSellerProfile = async (data, optional) => {
  const { storeName, contactNumber, address, slug } = data;
  const bio = optional;

  const profile = await db.SellerProfile.findOne({ where: { slug } });

  if (!profile) {
    throw new ApiError(404, `Store ${storeName} not found.`);
  }

  let newSlug = "";
  if (profile.storeName !== storeName) {
    newSlug = getStoreSlug(storeName);
  }

  profile.storeName = storeName;
  profile.contactNumber = contactNumber;
  profile.address = address;
  profile.slug = newSlug === "" ? slug : newSlug;
  profile.bio = bio;

  await profile.save();
  return profile;
};

/**
 * Deletes a seller's profile (downgrade them to customer).
 * This is protected action that checks for pending orders first.
 * @param {string} userId - The ID of user to downgrade
 * @returns {Promise<Object>} - A success message.
 */
export const deleteSellerProfile = async (userId) => {
  const sellerProfile = await getSellerProfile(userId);

  const pendingItems = await db.OrderItem.count({
    where: { status: { [Op.in]: ["pending", "processing"] } },
    include: [
      {
        model: db.Offer,
        as: "Offer",
        where: { sellerProfileId: sellerProfile.id },
        attributes: [],
      },
    ],
  });

  if (pendingItems > 0) {
    throw new ApiError(
      400,
      `You cannot close your store while you have ${pendingItems} pending order(s) to fulfill.`
    );
  }

  const transaction = await db.sequelize.transaction();
  try {
    await db.Offer.destroy({
      where: { sellerProfileId: sellerProfile.id },
      transaction,
    });

    await sellerProfile.destroy({ transaction });

    await db.User.update(
      { role: "user" },
      { where: { id: userId }, transaction }
    );

    await transaction.commit();
    return {
      message:
        "Your seller profile has been successfully deleted and your account has been converted back to a customer account.",
    };
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to delete seller profile.", error);
  }
};
