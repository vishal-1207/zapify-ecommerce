import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

/**
 * Creates a new address for a specific entity (User or SellerProfile).
 * @param {string} addressableId - The ID of the owner (e.g., userId or sellerProfileId).
 * @param {'User' | 'SellerProfile'} addressableType - The model name of the owner.
 * @param {object} addressData - The address details.
 * @returns {Promise<Address>} The newly created address.
 */
export const createAddress = async (
  addressableId,
  addressableType,
  addressData
) => {
  if (addressableType === "SellerProfile" && addressData.type === "Business") {
    const existing = await db.Address.findOne({
      where: { addressableId, addressableType, type: "Business" },
    });

    if (existing) {
      throw new ApiError(
        409,
        "A business address already exists for this seller profile."
      );
    }
  }

  try {
    const transaction = await db.sequelize.transaction();

    const address = await db.Address.create(
      {
        ...addressData,
        addressableId,
        addressableType,
      },
      { transaction }
    );

    await transaction.commit();
    return address;
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Something went wrong: ", error);
  }
};

/**
 * Fetches all addresses for a specific entity based on address type and id.
 * @param {string} addressableId
 * @param {string} addressableType
 * @returns {Promise<Array<Address>>} List of addresses
 */
export const getAddresses = async (addressableId, addressableType) => {
  const addresses = await db.Address.findAll({
    where: { addressableId, addressableType },
  });
  return addresses;
};

/**
 * Fetches a single address for a specific entity based on address type and id.
 * @param {string} addressableId
 * @param {string} addressableType
 * @returns {Promise<Address>}
 */
export const getAddress = async (addressableId, addressableType) => {
  const address = await db.Address.findOne({
    where: { addressableId, addressableType },
  });
  return address;
};

/**
 * Updates a specific address, verifying ownership.
 * @param {*} addressId
 * @param {*} addressableId
 * @param {*} addressableType
 * @param {*} updateData
 * @returns
 */
export const updateAddress = async (
  addressId,
  addressableId,
  addressableType,
  updateData
) => {
  const address = await db.Address.findOne({
    where: { id: addressId, addressableId, addressableType },
  });
  if (!address)
    throw new ApiError(404, "Address not found or does not belong to you.");

  try {
    const transaction = await db.sequelize.transaction();
    await address.update(updateData);

    await transaction.commit();

    return address;
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Something went wrong. Failed to update address.");
  }
};

/**
 * Deletes a specific address, verifying ownership.
 * @param {*} addressId
 * @param {*} addressableId
 * @param {*} addressableType
 * @returns
 */
export const deleteAddress = async (
  addressId,
  addressableId,
  addressableType
) => {
  const address = await db.Address.findOne({
    where: { id: addressId, addressableId, addressableType },
  });
  if (!address)
    throw new ApiError(404, "Address not found or does not belong to you.");

  try {
    const transaction = await db.sequelize.transaction();
    await address.destroy();
    await transaction.commit();

    return { message: "Address deleted successfully." };
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Something went wrong. Failed to delete address.");
  }
};
