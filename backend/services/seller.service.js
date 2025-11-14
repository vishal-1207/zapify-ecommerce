import slugify from "slugify";
import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";

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

// Profile Management Services

/**
 * Creates a seller profile for an existing user, upgrading their role.
 * This is an atomic operation within a transaction.
 * @param {string} userId - The ID of the user becoming a seller.
 * @param {object} profileData - The initial data for the seller profile (e.g., storeName).
 * @returns {Promise<SellerProfile>} The newly created seller profile.
 */
export const createSellerProfile = async (data, optional) => {
  const transaction = sequelize.transaction();
  try {
    const { storeName, contactNumber, userId } = data;
    const bio = optional;

    const { slug, existingSeller } = await findStore(storeName);

    if (existingSeller)
      throw new ApiError(400, `Store ${existingSeller} already exists.`);

    const seller = await db.SellerProfile.create(
      {
        storeName,
        bio,
        contactNumber,
        slug,
      },
      { transaction }
    );

    const user = await db.User.findByPk(userId, { transaction });
    const roles = new Set(user.roles);
    roles.add("seller");
    user.roles = Array.from(roles);
    await user.save({ transaction });

    await transaction.commit();
    return seller;
  } catch (err) {
    await transaction.rollback();
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
    where: { status: { [Op.in]: ["pending", "processing"] } },
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
      `You cannot close your store while you have ${pendingItems} pending order(s) to fulfill.`
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
      { where: { id: userId }, transaction }
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

// Seller Dashboard Analytics Services

/**
 * Seller dashboard service to get quick-glance KPI stats card for the top of the dashboard.
 * @param {string} userId
 * @param {number} days
 * @returns
 */
export const getSellerDashboardStats = async (userId, days = 30) => {
  const profile = await getSellerProfile(userId);
  const dateRange = new Date();
  dateRange.setDate(dateRange.getDate() - days);

  // 1. Total Revenue (for the selected period)
  const totalRevenue = await db.OrderItem.sum("priceAtTimeOfPurchase", {
    where: { status: "delivered", createdAt: { [Op.gte]: dateRange } },
    include: [
      { model: db.Offer, as: "offer", where: { sellerProfileId: profile.id } },
    ],
  });

  // 2. Total Orders (for the selected period)
  const totalOrders = await db.OrderItem.count({
    distinct: true,
    col: "orderId",
    where: { status: "delivered", createdAt: { [Op.gte]: dateRange } },
    include: [
      { model: db.Offer, as: "offer", where: { sellerProfileId: profile.id } },
    ],
  });

  // 3. Total Sales (Items Sold, for the selected period)
  const totalSales = await db.OrderItem.sum("quantity", {
    where: { status: "delivered", createdAt: { [Op.gte]: dateRange } },
    include: [
      { model: db.Offer, as: "offer", where: { sellerProfileId: profile.id } },
    ],
  });

  return {
    totalRevenue: totalRevenue || 0.0,
    totalOrders: totalOrders || 0,
    totalSales: totalSales || 0,
  };
};

/**
 * Seller dashboard service which gets sales/revenue/orders data grouped by day for the dashboard line chart.
 * Takes a dynamic number of days to look back.
 * @param {string} userId
 * @param {number} days
 * @returns
 */
export const getSellerSalesAnalytics = async (userId, days) => {
  const profile = await getSellerProfile(userId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db.OrderItem.findAll({
    where: {
      status: "delivered",
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [
        db.sequelize.fn("DATE", db.sequelize.col("OrderItem.createdAt")),
        "date",
      ],
      [
        db.sequelize.fn("SUM", db.sequelize.col("priceAtTimeOfPurchase")),
        "totalRevenue",
      ],
      [
        db.sequelize.fn(
          "COUNT",
          db.sequelize.fn("DISTINCT", db.sequelize.col("orderId"))
        ),
        "totalOrders",
      ],
      [db.sequelize.fn("SUM", db.sequelize.col("quantity")), "totalSales"],
    ],
    include: [
      {
        model: db.Offer,
        as: "offer",
        attributes: [],
        where: { sellerProfileId: profile.id },
      },
    ],
    group: ["date"],
    order: [["date", "ASC"]],
    raw: true,
  });

  // Format data for Chart.js
  const labels = results.map((row) =>
    new Date(row.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );
  const revenueData = results.map((row) => row.totalRevenue);
  const orderData = results.map((row) => row.totalOrders);
  const salesData = results.map((row) => row.totalSales);

  return {
    labels,
    datasets: [
      {
        label: "Revenue (INR)",
        data: revenueData,
        borderColor: "rgb(75, 192, 192)",
      },
      { label: "Orders", data: orderData, borderColor: "rgb(255, 99, 132)" },
      {
        label: "Items Sold",
        data: salesData,
        borderColor: "rgb(54, 162, 235)",
      },
    ],
  };
};

/**
 * Gets a specific seller's top 5 best-performing products by revenue.
 * @param {*} userId
 * @param {*} days
 * @returns
 */
export const getSellerTopProducts = async (userId, days = 30) => {
  const profile = await getSellerProfile(userId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db.OrderItem.findAll({
    where: { status: "delivered", createdAt: { [Op.gte]: startDate } },
    attributes: [
      [
        db.sequelize.fn("SUM", db.sequelize.col("priceAtTimeOfPurchase")),
        "totalRevenue",
      ],
    ],
    include: [
      {
        model: db.Offer,
        as: "offer",
        attributes: [],
        where: { sellerProfileId: profile.id },
        include: [
          {
            model: db.Product,
            as: "product",
            attributes: ["name"],
          },
        ],
      },
    ],
    group: ["offer.product.id", "offer.product.name"],
    order: [
      [
        db.sequelize.fn("SUM", db.sequelize.col("priceAtTimeOfPurchase")),
        "DESC",
      ],
    ],
    limit: 5,
    raw: true,
    nest: true,
  });
};

/**
 * Gets sales data grouped by Category for a pie chart.
 * @param {string} userId
 * @param {number} days
 * @returns
 */
export const getSellerCategoryPerformance = async (userId, days = 30) => {
  const profile = await getSellerProfile(userId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db.OrderItem.findAll({
    where: { status: "delivered", createdAt: { [Op.gte]: startDate } },
    attributes: [
      [
        db.sequelize.fn("SUM", db.sequelize.col("priceAtTimeOfPurchase")),
        "totalRevenue",
      ],
    ],
    include: [
      {
        model: db.Offer,
        as: "offer",
        attributes: [],
        where: { sellerProfileId: profile.id },
        include: [
          {
            model: db.Product,
            as: "product",
            attributes: [],
            include: [
              {
                model: db.Category,
                as: "category",
                attributes: ["name"],
              },
            ],
          },
        ],
      },
    ],
    group: ["offer.product.category.id", "offer.product.category.name"],
    order: [
      [
        db.sequelize.fn("SUM", db.sequelize.col("priceAtTimeOfPurchase")),
        "DESC",
      ],
    ],
    raw: true,
    nest: true,
  });

  // Format data for Chart.js
  const labels = results.map((row) => row.Offer.Product.Category.name);
  const data = results.map((row) => row.totalRevenue);

  return {
    labels,
    datasets: [
      {
        label: "Revenue by Category",
        data,
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
      },
    ],
  };
};
