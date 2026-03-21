import db from "../models/index.js";
import { v4 as uuidv4 } from "uuid";

const { AffiliateProfile, Order, OrderItem, Product, User, Offer } = db;

/**
 * Creates an affiliate profile for a user
 */
export const applyForAffiliate = async (userId) => {
  const existing = await AffiliateProfile.findOne({ where: { userId } });
  if (existing) {
    throw new Error("You are already registered as an affiliate.");
  }

  const referralCode = `ZAP-${uuidv4().substring(0, 8).toUpperCase()}`;

  const profile = await AffiliateProfile.create({
    userId,
    referralCode,
    status: "active",
    commissionRate: 10.0,
  });

  return profile;
};

/**
 * Gets the affiliate dashboard stats
 */
export const getAffiliateDashboardStats = async (userId) => {
  const profile = await AffiliateProfile.findOne({ where: { userId } });
  
  if (!profile) {
    throw new Error("Affiliate profile not found.");
  }

  const totalReferredOrders = await Order.count({
    where: { affiliateId: profile.id, status: ["processed", "shipped", "delivered"] },
  });

  return {
    profile,
    stats: {
      totalEarnings: profile.totalEarnings,
      pendingEarnings: profile.pendingEarnings,
      totalReferredOrders,
    }
  };
};

/**
 * Gets the recent orders credited to this affiliate
 */
export const getAffiliateRecentOrders = async (userId) => {
  const profile = await AffiliateProfile.findOne({ where: { userId } });
  if (!profile) {
    throw new Error("Affiliate profile not found.");
  }

  const orders = await Order.findAll({
    where: { 
      affiliateId: profile.id,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["fullname"]
      }
    ],
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  return orders;
};
