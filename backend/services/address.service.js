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

  const address = db.Address.create({
    ...addressData,
    addressableId,
    addressableType,
  });

  return address;
};

/**
 * Fetches address for a specific entity based on address type and id.
 * @param {*} addressableId
 * @param {*} addressableType
 * @returns
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

  await address.update(updateData);
  return address;
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

  await address.destroy();
  return { message: "Address deleted successfully." };
};
