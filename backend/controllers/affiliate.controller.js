import {
  applyForAffiliate,
  getAffiliateDashboardStats,
  getAffiliateRecentOrders
} from "../services/affiliate.service.js";

export const apply = async (req, res, next) => {
  try {
    const profile = await applyForAffiliate(req.user.id);
    res.status(201).json({
      success: true,
      message: "Affiliate account created successfully",
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardInfo = async (req, res, next) => {
  try {
    const data = await getAffiliateDashboardStats(req.user.id);
    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentOrders = async (req, res, next) => {
  try {
    const orders = await getAffiliateRecentOrders(req.user.id);
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};
