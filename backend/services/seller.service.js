import slugify from "slugify";
import sequelize from "../config/db.js";
import { Op } from "sequelize"; // Added Op import
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { invalidateCache } from "../utils/cache.js";

const getStoreSlug = (storeName) => {
  const slug = slugify(storeName, {
    replacement: "-",
    lower: true,
    strict: true,
    trim: true,
  });

  return slug;
};

const findStore = async (storeName) => {
  const slug = getStoreSlug(storeName);

  const existingSeller = await db.SellerProfile.findOne({
    where: { slug },
  });

  return { slug, existingSeller };
};


/**
 * Creates a seller profile for an existing user, upgrading their role.
 * This is an atomic operation within a transaction.
 * @param {string} userId - The ID of the user becoming a seller.
 * @param {object} profileData - The initial data for the seller profile (e.g., storeName).
 * @returns {Promise<SellerProfile>} The newly created seller profile.
 */
export const createSellerProfile = async (data, optional) => {
  const transaction = await sequelize.transaction();
  try {
    console.log("[DEBUG] createSellerProfile called with:", data);
    const { storeName, contactNumber, userId } = data;
    const { bio } = optional;

    const { slug, existingSeller } = await findStore(storeName);

    if (existingSeller)
      throw new ApiError(400, `Store ${existingSeller} already exists.`);

    const seller = await db.SellerProfile.create(
      {
        storeName,
        bio,
        contactNumber,
        slug,
        userId,
      },
      { transaction },
    );

    const user = await db.User.findByPk(userId, { transaction });
    let currentRoles = user.roles;
    if (typeof currentRoles === "string") {
      try {
        currentRoles = JSON.parse(currentRoles);
      } catch (e) {
        currentRoles = [];
      }
    }
    if (!Array.isArray(currentRoles)) {
      currentRoles = [currentRoles].filter(Boolean); // Handle single string case or empty
    }

    let newRoles = currentRoles;
    if (!currentRoles.includes("seller")) {
      newRoles = [...currentRoles, "seller"];
      const [affectedRows] = await db.User.update(
        { roles: newRoles },
        { where: { id: userId }, transaction, validate: false },
      );
      console.log(`[DEBUG] Roles update affected rows: ${affectedRows}`);

      if (affectedRows === 0) {
        throw new Error(
          "Failed to update user roles - User not found or no change.",
        );
      }
    }


    console.log(
      `[DEBUG] Seller Profile Created for UserID: ${userId}. New Roles:`,
      newRoles,
    );

    await transaction.commit();
    await invalidateCache(`user_session:${userId}`);
    return seller;
  } catch (err) {
    console.error("[DEBUG] createSellerProfile failed:", err);
    await transaction.rollback();
    throw err;
  }
};

/**
 * Fetches the profile of the currently authenticated seller.
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<SellerProfile>} The seller's profile.
 */
export const getSellerProfile = async (userId) => {
  const seller = await db.SellerProfile.findOne({ where: { userId } });

  if (!seller) {
    throw new ApiError(404, "Seller profile not found for this user.");
  }

  return seller;
};

/**
 * Updates the core details (storeName, bio) of a seller's profile.
 * @param {string} userId - The ID of the authenticated user.
 * @param {object} updateData - The data to update (storeName, bio).
 * @returns {Promise<SellerProfile>} The updated seller profile.
 */
export const updateSellerProfile = async (data, optional) => {
  const { storeName, contactNumber, slug } = data;
  const bio = optional;

  const profile = await db.SellerProfile.findOne({ where: { slug } });

  if (!profile) {
    throw new ApiError(404, `Store ${storeName} not found.`);
  }

  let newSlug = "";
  if (profile.storeName !== storeName) {
    newSlug = getStoreSlug(storeName);
  }

  profile.storeName = storeName;
  profile.contactNumber = contactNumber;
  profile.slug = newSlug === "" ? slug : newSlug;
  profile.bio = bio;

  await profile.save();
  return profile;
};

/**
 * Deletes a seller's profile (downgrade them to customer).
 * This is protected action that checks for pending orders first.
 * @param {string} userId - The ID of user to downgrade
 * @returns {Promise<Object>} - A success message.
 */
export const deleteSellerProfile = async (userId) => {
  const sellerProfile = await getSellerProfile(userId);

  const pendingItems = await db.OrderItem.count({
    where: { status: { [Op.in]: ["pending", "processed"] } },
    include: [
      {
        model: db.Offer,
        as: "Offer",
        where: { sellerProfileId: sellerProfile.id },
        attributes: [],
      },
    ],
  });

  if (pendingItems > 0) {
    throw new ApiError(
      400,
      `You cannot close your store while you have ${pendingItems} pending order(s) to fulfill.`,
    );
  }

  const transaction = await db.sequelize.transaction();
  try {
    await db.Offer.destroy({
      where: { sellerProfileId: sellerProfile.id },
      transaction,
    });

    await sellerProfile.destroy({ transaction });

    await db.User.update(
      { role: "user" },
      { where: { id: userId }, transaction },
    );

    await transaction.commit();
    return {
      message:
        "Your seller profile has been successfully deleted and your account has been converted back to a customer account.",
    };
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to delete seller profile.", error);
  }
};


export const getSellerDashboardStats = async (userId, days = 30) => {
  const profile = await getSellerProfile(userId);
  const now = new Date();
  
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

  const runQuery = async (query, replacements) => {
    const [result] = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });
    return result;
  };

  const currentMetrics = await runQuery(`
    SELECT 
      SUM(OI.priceAtTimeOfPurchase * OI.quantity) as totalRevenue,
      COUNT(DISTINCT OI.orderId) as totalOrders,
      SUM(OI.quantity) as totalSales
    FROM OrderItems OI
    INNER JOIN Offers O ON OI.offerId = O.id
    WHERE O.sellerProfileId = :sellerProfileId
      AND OI.status = 'delivered'
      AND OI.createdAt >= :startDate
  `, { sellerProfileId: profile.id, startDate: currentPeriodStart });

  const totalRevenue = parseFloat(currentMetrics?.totalRevenue) || 0.0;
  const totalOrders = parseInt(currentMetrics?.totalOrders) || 0;
  const totalSales = parseInt(currentMetrics?.totalSales) || 0;

  const prevMetrics = await runQuery(`
    SELECT SUM(OI.priceAtTimeOfPurchase * OI.quantity) as totalRevenue
    FROM OrderItems OI
    INNER JOIN Offers O ON OI.offerId = O.id
    WHERE O.sellerProfileId = :sellerProfileId
      AND OI.status = 'delivered'
      AND OI.createdAt >= :prevStartDate
      AND OI.createdAt < :currentStartDate
  `, { 
    sellerProfileId: profile.id, 
    prevStartDate: previousPeriodStart, 
    currentStartDate: currentPeriodStart 
  });

  const prevRevenue = parseFloat(prevMetrics?.totalRevenue) || 0;
  let revenueGrowth = 0;
  if (prevRevenue === 0 && totalRevenue > 0) revenueGrowth = 100;
  else if (prevRevenue > 0) revenueGrowth = ((totalRevenue - prevRevenue) / prevRevenue) * 100;

  const avgResult = await runQuery(`
    SELECT AVG(R.rating) as averageRating
    FROM Reviews R
    INNER JOIN Products P ON R.productId = P.id
    INNER JOIN Offers O ON P.id = O.productId
    WHERE O.sellerProfileId = :sellerProfileId
  `, { sellerProfileId: profile.id });
  
  const averageRating = parseFloat(avgResult?.averageRating) || 0;

  const pendingResult = await runQuery(`
    SELECT COUNT(*) as pendingOrders
    FROM OrderItems OI
    INNER JOIN Offers O ON OI.offerId = O.id
    WHERE O.sellerProfileId = :sellerProfileId
      AND OI.status IN ('pending', 'processed')
  `, { sellerProfileId: profile.id });
  const pendingOrders = parseInt(pendingResult?.pendingOrders) || 0;

  const activeOffers = await db.Offer.count({
    where: { sellerProfileId: profile.id, status: 'active' }
  });

  const outOfStock = await db.Offer.count({
    where: { 
      sellerProfileId: profile.id,
      status: 'active',
      stockQuantity: 0
    }
  });

  return {
    totalRevenue,
    totalOrders,
    totalSales,
    averageRating: averageRating.toFixed(2),
    revenueGrowth,
    pendingOrders,
    activeOffers,
    outOfStock
  };
};

export const getSellerSalesAnalytics = async (userId, days = 30) => {
  const profile = await getSellerProfile(userId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db.OrderItem.findAll({
    where: {
      status: "delivered",
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [db.sequelize.fn("DATE", db.sequelize.col("OrderItem.createdAt")), "date"],
      [db.sequelize.fn("SUM", db.sequelize.literal("priceAtTimeOfPurchase * quantity")), "totalRevenue"],
      [db.sequelize.fn("COUNT", db.sequelize.fn("DISTINCT", db.sequelize.col("orderId"))), "totalOrders"],
      [db.sequelize.fn("SUM", db.sequelize.col("quantity")), "totalSales"],
    ],
    include: [
      {
        model: db.Offer,
        as: "Offer",
        attributes: [],
        where: { sellerProfileId: profile.id },
      },
    ],
    group: ["date"],
    order: [["date", "ASC"]],
    raw: true,
  });

  const labels = results.map((row) =>
    new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  return {
    labels,
    datasets: [
      {
        label: "Revenue (INR)",
        data: results.map((row) => parseFloat(row.totalRevenue) || 0),
        borderColor: "rgb(75, 192, 192)",
      },
      { 
        label: "Orders", 
        data: results.map((row) => parseInt(row.totalOrders) || 0), 
        borderColor: "rgb(255, 99, 132)",
      },
      {
        label: "Items Sold",
        data: results.map((row) => parseInt(row.totalSales) || 0),
        borderColor: "rgb(54, 162, 235)",
      },
    ],
  };
};

export const getSellerTopProducts = async (userId, days = 30) => {
  const profile = await getSellerProfile(userId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const aggregates = await db.OrderItem.findAll({
    attributes: [
      "offerId",
      [db.sequelize.fn("SUM", db.sequelize.literal("priceAtTimeOfPurchase * quantity")), "totalRevenue"],
      [db.sequelize.fn("SUM", db.sequelize.col("quantity")), "sold"],
    ],
    include: [{
      model: db.Offer,
      as: "Offer",
      attributes: [],
      where: { sellerProfileId: profile.id }
    }],
    where: { status: "delivered", createdAt: { [Op.gte]: startDate } },
    group: ["offerId"],
    order: [[db.sequelize.literal("totalRevenue"), "DESC"]],
    limit: 5,
    raw: true,
  });

  if (!aggregates.length) return [];

  const offerIds = aggregates.map((a) => a.offerId);
  const offers = await db.Offer.findAll({
    where: { id: offerIds },
    include: [{
      model: db.Product,
      as: "product",
      attributes: ["name"],
      include: [{ model: db.Media, as: "media", attributes: ["url"], limit: 1 }],
    }],
  });

  const offerMap = offers.reduce((acc, o) => {
    acc[o.id] = o;
    return acc;
  }, {});

  return aggregates.map((agg) => {
    const offer = offerMap[agg.offerId];
    return {
      name: offer?.product?.name || "Unknown Product",
      imageUrl: offer?.product?.media?.[0]?.url || null,
      revenue: parseFloat(agg.totalRevenue) || 0,
      sold: parseInt(agg.sold) || 0,
    };
  });
};

export const getSellerCategoryPerformance = async (userId, days = 30) => {
  const profile = await getSellerProfile(userId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const aggregates = await db.OrderItem.findAll({
    attributes: [
      "offerId",
      [db.sequelize.fn("SUM", db.sequelize.literal("priceAtTimeOfPurchase * quantity")), "totalRevenue"],
    ],
    include: [{
      model: db.Offer,
      as: "Offer",
      attributes: [],
      where: { sellerProfileId: profile.id }
    }],
    where: { status: "delivered", createdAt: { [Op.gte]: startDate } },
    group: ["offerId"],
    raw: true,
  });

  if (!aggregates.length) return { labels: [], datasets: [] };

  const offerIds = aggregates.map((a) => a.offerId);
  const offers = await db.Offer.findAll({
    where: { id: offerIds },
    include: [{
      model: db.Product,
      as: "product",
      attributes: ["id"],
      include: [{ model: db.Category, as: "category", attributes: ["name"] }]
    }],
  });

  const offerMap = offers.reduce((acc, o) => {
    acc[o.id] = o;
    return acc;
  }, {});

  const categoryData = {};
  aggregates.forEach(agg => {
    const offer = offerMap[agg.offerId];
    if (!offer || !offer.product || !offer.product.category) return;
    
    const catName = offer.product.category.name;
    if (!categoryData[catName]) categoryData[catName] = 0;
    categoryData[catName] += parseFloat(agg.totalRevenue) || 0;
  });

  const sortedCategories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
  const labels = sortedCategories.map(c => c[0]);
  const data = sortedCategories.map(c => c[1]);

  return {
    labels,
    datasets: [{
      label: "Revenue by Category",
      data,
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF8A65"],
    }]
  };
};

export const getSellerRecentOrders = async (userId, limit = 8) => {
  const profile = await getSellerProfile(userId);

  return db.OrderItem.findAll({
    attributes: ["id", "priceAtTimeOfPurchase", "quantity", "status", "createdAt"],
    where: {
      status: { [Op.ne]: "cancelled" }
    },
    include: [
      {
        model: db.Offer,
        as: "Offer",
        where: { sellerProfileId: profile.id },
        attributes: ["id"],
        include: [{
          model: db.Product,
          as: "product",
          attributes: ["name"]
        }]
      },
      {
        model: db.Order,
        as: "Order",
        attributes: ["id", "uniqueOrderId"],
        include: [{
          model: db.User,
          as: "user",
          attributes: ["fullname", "email"]
        }]
      }
    ],
    order: [["createdAt", "DESC"]],
    limit
  });
};
