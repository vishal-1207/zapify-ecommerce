import db from "../models/index.js";
import { v4 as uuidv4 } from "uuid";

const { AffiliateProfile, Order, OrderItem, Product, User } = db;

/**
 * Creates an affiliate profile for a user
 */
export const applyForAffiliate = async (userId) => {
  // Check if they already have one
  const existing = await AffiliateProfile.findOne({ where: { userId } });
  if (existing) {
    throw new Error("You are already registered as an affiliate.");
  }

  // Generate a unique code like ZAP-XXXX
  const referralCode = `ZAP-${uuidv4().substring(0, 8).toUpperCase()}`;

  const profile = await AffiliateProfile.create({
    userId,
    referralCode,
    status: "active", // Active by default for immediate earnings
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

  // Count total referred orders
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
      },
      {
        model: OrderItem,
        as: "orderItems",
        include: [{ model: Product, as: "product", attributes: ["name", "images"] }]
      }
    ],
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  return orders;
};
