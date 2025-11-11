import { asyncHandler } from "../utils/asyncHandler.js";
import * as addressService from "../services/address.service.js";

/**
 * A helper function to dynamically get the address owner (addressableId)
 * based on the addressableType and the authenticated user.
 */
const getAddressOwner = async (userId, addressableType) => {
  if (addressableType === "User") {
    return userId;
  }
  if (addressableType === "SellerProfile") {
    const sellerProfile = await db.SellerProfile.findOne({ where: { userId } });
    if (!sellerProfile) {
      throw new ApiError(
        403,
        "Forbidden: You must have a seller profile to perform this action."
      );
    }
    return sellerProfile.id;
  }

  throw new ApiError(500, "Invalid addressable type specified.");
};

/**
 * A factory function that returns a controller for adding an address.
 * @param {'User' | 'SellerProfile'} addressableType
 */
const addAddressFactory = (addressableType) =>
  asyncHandler(async (req, res) => {
    const addressableId = await getAddressOwner(req.user.id, addressableType);
    const newAddress = await addressService.createAddress(
      addressableId,
      addressableType,
      req.body
    );
    return res
      .status(201)
      .json({ message: "Address added successfully.", newAddress });
  });

/**
 * A factory function that returns a controller for getting all addresses.
 * @param {'User' | 'SellerProfile'} addressableType
 */
const getAddressesFactory = (addressableType) =>
  asyncHandler(async (req, res) => {
    const addressableId = await getAddressOwner(req.user.id, addressableType);
    const addresses = await addressService.getAddresses(
      addressableId,
      addressableType
    );
    return res
      .status(200)
      .json({ message: "Addresses fetched successfully.", addresses });
  });

/**
 * A factory function that returns a controller for updating an address.
 * @param {'User' | 'SellerProfile'} addressableType
 */
const updateAddressFactory = (addressableType) =>
  asyncHandler(async (req, res) => {
    const addressableId = await getAddressOwner(req.user.id, addressableType);
    const updatedAddress = await addressService.updateAddress(
      req.params.addressId,
      addressableId,
      addressableType,
      req.body
    );
    return res
      .status(200)
      .json({ message: "Address updated successfully.", updatedAddress });
  });

/**
 * A factory function that returns a controller for deleting an address.
 * @param {'User' | 'SellerProfile'} addressableType
 */
const deleteAddressFactory = (addressableType) =>
  asyncHandler(async (req, res) => {
    const addressableId = await getAddressOwner(req.user.id, addressableType);
    const result = await addressService.deleteAddress(
      req.params.addressId,
      addressableId,
      addressableType
    );
    return res.status(200).json({ message: result.message, result });
  });

// --- Customer Address Controllers ---
export const addCustomerAddress = addAddressFactory("User");
export const getCustomerAddresses = getAddressesFactory("User");
export const updateCustomerAddress = updateAddressFactory("User");
export const deleteCustomerAddress = deleteAddressFactory("User");

// --- Seller Address Controllers ---
export const addSellerAddress = addAddressFactory("SellerProfile");
export const getSellerAddresses = getAddressesFactory("SellerProfile");
export const updateSellerAddress = updateAddressFactory("SellerProfile");
export const deleteSellerAddress = deleteAddressFactory("SellerProfile");
