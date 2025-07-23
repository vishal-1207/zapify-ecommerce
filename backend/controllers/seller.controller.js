//TODO: implement controllers for seller module
import db from "../models/index.js";
import { registerSellerService } from "../services/seller.service.js";
import asyncHandler from "../utils/asyncHandler";

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

export const updateSellerProfile = asyncHandler(async (req, res) => {
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

  //TODO: complete update seller profile service
  const updatedSeller = await updateSellerService(data, optional);

  res.status(201).json({
    message: "Seller profile updated successfully.",
    seller: updatedSeller,
  });
});

export const deleteSellerProfile = asyncHandler(async (req, res) => {});

export const getSellerProfile = asyncHandler(async (req, res) => {});

export const getSellerAnalytics = asyncHandler(async (req, res) => {});

export const otpVerification = asyncHandler(async (req, res) => {});
