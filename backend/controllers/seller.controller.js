import { registerSellerService } from "../services/seller.service.js";
import asyncHandler from "../utils/asyncHandler";

// Seller profile registration controller
export const registerSellerProfile = asyncHandler(async (req, res) => {
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
  const seller = await registerSellerService(data, optional);
  res
    .status(201)
    .json({ message: "Seller profile created successfully.", seller });
});

// Update seller profile controller
export const updateSellerProfile = asyncHandler(async (req, res) => {
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

  const updatedSeller = await updateSellerService(data, optional);

  res.status(201).json({
    message: "Seller profile updated successfully.",
    seller: updatedSeller,
  });
});

// TODO: Implement delete seller profile controller
export const deleteSellerProfile = asyncHandler(async (req, res) => {});

// TODO: Implement get seller profile controller
export const getSellerProfile = asyncHandler(async (req, res) => {});

// TODO: Implement get seller analytics controller
export const getSellerAnalytics = asyncHandler(async (req, res) => {});

// TODO: Implement otp verfication controller via email
export const otpVerification = asyncHandler(async (req, res) => {});
