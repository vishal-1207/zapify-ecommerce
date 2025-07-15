import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";

const SellerProfile = db.SellerProfile;

//Allow only OTP verified seller
export const requireSellerVerification = asyncHandler(
  async (req, res, next) => {
    const profile = await SellerProfile.findOne({
      where: { userId: req.user.id },
    });

    if (!profile || !profile.isVerified) {
      return res.status(403).json({
        message:
          "Seller account not verified. Please complete OTP verification.",
      });
    }
    next();
  }
);
