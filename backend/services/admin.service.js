import db from "../models/index.js";
import paginate from "../utils/paginate.js";

/**
 * Admin dashboard service to counts of pending reviews and products, total sellers and revenues for stats card
 * @returns
 */
export const getAdminDashboardStats = async () => {
  const pendingProducts = await db.Product.count({
    where: { status: "pending" },
  });
  const pendingReviews = await db.Review.count({
    where: { status: "pending" },
  });
  const totalSellers = await db.User.count({ where: { role: "seller" } });
  const totalRevenue = await db.Order.sum("totalAmount", {
    where: { status: "Delivered" },
  });

  return {
    pendingProducts: pendingProducts || 0,
    pendingReviews: pendingReviews || 0,
    totalSellers: totalSellers || 0,
    totalRevenue: totalRevenue || 0.0,
  };
};

/**
 * Get platform-wide sales data grouped by day for a line chart.
 */
export const getPlatformSalesOverTime = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db.Order.findAll({
    where: {
      status: "delivered", // Only count completed orders
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [db.sequelize.fn("DATE", db.sequelize.col("createdAt")), "date"],
      [db.sequelize.fn("SUM", db.sequelize.col("totalAmount")), "totalSales"],
    ],
    group: ["date"],
    order: [["date", "ASC"]],
    raw: true,
  });

  const labels = results.map((row) =>
    new Date(row.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );
  const data = results.map((row) => row.totalSales);

  return {
    labels,
    datasets: [
      {
        label: "Total Sales",
        data,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  };
};

/**
 * Gets platform-wide sales data grouped by product category for a pie chart.
 * @returns
 */
export const getPlatformSalesByCategory = async () => {
  const results = await db.OrderItem.findAll({
    attributes: [
      [
        db.sequelize.fn("SUM", db.sequelize.col("priceAtTimeOfPurchase")),
        "totalSales",
      ],
    ],
    include: [
      {
        model: db.Offer,
        as: "offer",
        attributes: [],
        include: [
          {
            model: db.Product,
            as: "product",
            attributes: [],
            include: [
              {
                model: db.Category,
                as: "category",
                attributes: ["name"], // Group by this name
              },
            ],
          },
        ],
      },
    ],
    where: { status: "delivered" },
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

  const labels = results.map((row) => row.Offer.Product.Category.name);
  const data = results.map((row) => row.totalSales);

  return {
    labels,
    datasets: [
      {
        label: "Sales by Category",
        data,
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
        ],
      },
    ],
  };
};

/**
 * Gets user and seller signup data grouped by day for a line chart.
 * @param {number} days - The number of days back to fetch data for.
 */
export const getSignupAnalytics = async (days) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db.User.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [db.sequelize.fn("DATE", db.sequelize.col("createdAt")), "date"],
      // Use SUM(CASE...) to count customers and sellers in one query
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal("CASE WHEN role = 'user' THEN 1 ELSE 0 END")
        ),
        "newUsers",
      ],
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal("CASE WHEN role = 'seller' THEN 1 ELSE 0 END")
        ),
        "newSellers",
      ],
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
  const customerData = results.map((row) => row.newUsers);
  const sellerData = results.map((row) => row.newSellers);

  return {
    labels,
    datasets: [
      {
        label: "New Customers",
        data: customerData,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
      },
      {
        label: "New Sellers",
        data: sellerData,
        borderColor: "rgb(255, 159, 64)",
        backgroundColor: "rgba(255, 159, 64, 0.5)",
      },
    ],
  };
};

/**
 * Gets order activity (delivered, processing, cancelled) grouped by day.
 * @param {number} days - The number of days back to fetch data for.
 */
export const getOrderActivityAnalytics = async (days) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db.Order.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [db.sequelize.fn("DATE", db.sequelize.col("createdAt")), "date"],
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal(
            "CASE WHEN status = 'delivered' THEN 1 ELSE 0 END"
          )
        ),
        "delivered",
      ],
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal(
            "CASE WHEN status = 'processing' THEN 1 ELSE 0 END"
          )
        ),
        "processing",
      ],
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal(
            "CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END"
          )
        ),
        "cancelled",
      ],
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
  const deliveredData = results.map((row) => row.delivered);
  const processingData = results.map((row) => row.processing);
  const cancelledData = results.map((row) => row.cancelled);

  return {
    labels,
    datasets: [
      {
        label: "Delivered",
        data: deliveredData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
      {
        label: "Processing",
        data: processingData,
        borderColor: "rgb(255, 206, 86)",
        backgroundColor: "rgba(255, 206, 86, 0.5)",
      },
      {
        label: "Cancelled",
        data: cancelledData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };
};

/**
 * Admin user management service to get list of all users (customer or seller) for admin purpose.
 */
export const getUsersList = async (role = "user", page, limit) => {
  const queryOptions = {
    where: {},
    attributes: {
      exclude: [
        "password",
        "verificationCode",
        "verificationCodeExpiry",
        "passwordResetToken",
        "passwordResetExpires",
      ],
    },
    order: [["createdAt", "DESC"]], // Corrected: Order moved to root level
  };

  if (role) {
    queryOptions.where.role = role;
  }

  if (role === "seller") {
    queryOptions.include = [{ model: db.SellerProfile, as: "SellerProfile" }];
  }

  // Uses the paginate utility for paginated user list results
  return await paginate(db.User, queryOptions, page, limit);
};
