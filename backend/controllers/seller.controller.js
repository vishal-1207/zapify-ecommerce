import * as sellerService from "../services/seller.service.js";
import asyncHandler from "../utils/asyncHandler";

// Seller profile registration controller
export const createProfile = asyncHandler(async (req, res) => {
  const {
    storeName,
    contactNumber,
    address,
    bio = null,
    website = null,
  } = req.body;
  const userId = req.user.id;

  const data = { storeName, contactNumber, address, userId };
  const optional = { bio, website };
  const seller = await sellerService.createSellerProfile(data, optional);
  res
    .status(201)
    .json({ message: "Seller profile created successfully.", seller });
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profile = await sellerService.getSellerProfile(userId);
  return res
    .status(200)
    .json({ message: "Seller profile fetched successfully.", profile });
});

// Update seller profile controller
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    storeName,
    contactNumber,
    address,
    bio = null,
    website = null,
  } = req.body;

  const slug = req.params.slug;

  const data = { storeName, contactNumber, address, slug };
  const optional = { bio, website };

  const updatedSeller = await sellerService.updateSellerProfile(data, optional);

  return res.status(201).json({
    message: "Seller profile updated successfully.",
    seller: updatedSeller,
  });
});

export const deleteSellerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await sellerService.deleteSellerProfile(userId);
  return res.status(200).json({ message: result });
});
