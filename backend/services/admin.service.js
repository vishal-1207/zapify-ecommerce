import db from "../models/index.js";
import paginate from "../utils/paginate.js";
import { Op } from "sequelize";
import { sendVerificationCode, verifyCode } from "./otp.service.js";
import ApiError from "../utils/ApiError.js";
import { createNotification } from "./notification.service.js";

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
  const totalSellers = await db.User.count({
    where: db.sequelize.literal(`JSON_CONTAINS(roles, '"seller"')`),
  });
  const totalRevenue = await db.Order.sum("totalAmount", {
    where: { status: "delivered" },
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
    }),
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
          db.sequelize.literal(
            "CASE WHEN JSON_CONTAINS(roles, '\"user\"') THEN 1 ELSE 0 END",
          ),
        ),
        "newUsers",
      ],
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal(
            "CASE WHEN JSON_CONTAINS(roles, '\"seller\"') THEN 1 ELSE 0 END",
          ),
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
    }),
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
            "CASE WHEN status = 'delivered' THEN 1 ELSE 0 END",
          ),
        ),
        "delivered",
      ],
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal(
            "CASE WHEN status = 'processed' THEN 1 ELSE 0 END",
          ),
        ),
        "processed",
      ],
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal(
            "CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END",
          ),
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
    }),
  );
  const deliveredData = results.map((row) => row.delivered);
  const processingData = results.map((row) => row.processed);
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
    order: [["createdAt", "DESC"]],
  };

  if (role) {
    // JSON_CONTAINS correctly queries JSON array columns like `roles`
    // Must be wrapped in Op.and so Sequelize treats it as a WHERE condition
    queryOptions.where[Op.and] = [
      db.sequelize.literal(`JSON_CONTAINS(\`roles\`, '"${role}"')`),
    ];
  }

  if (role === "seller") {
    queryOptions.include = [{ model: db.SellerProfile, as: "sellerProfile" }];
  }

  return await paginate(db.User, queryOptions, page, limit);
};

/**
 * Update user status service
 */
export const updateUserStatusService = async (userId, status) => {
  const user = await db.User.findByPk(userId);
  if (!user) throw new Error("User not found");

  // Assuming we use 'isActive' boolean or a status field.
  // The User model currently doesn't have a 'status' field, but it has 'roles'.
  // Blocking might mean removing access.
  // Let's assume we want to add a 'isBlocked' field or similar, OR use 'paranoid' soft delete for blocking?
  // User model has 'scheduledForDeletionAt'.
  // For now, let's assume valid status is 'blocked' or 'active' and we might toggling a boolean if it existed.
  // Wait, I saw User model. It doesn't have `status` or `isBlocked`.
  // It has `paranoid: true`.
  // Let's implement Block as SOFT DELETE for now? OR we should add `isBlocked` to model?
  // The user prompt asked for Block/Unblock. Soft delete is separate (DELETE /user/:id).
  // I should probably add `isBlocked` to User model to support this cleanly.
  // For now, I will use a placeholder implementation that throws if we can't persist it,
  // BUT I will add `isBlocked` to the model in the next step to be correct.

  // For this step, I'll update the 'roles' to include 'blocked' maybe? No that's hacky.
  // Let's UPDATE the User model to include `isBlocked`.

  if (status === "blocked") {
    user.isBlocked = true;
  } else {
    user.isBlocked = false;
  }
  await user.save();
  return user;
};

/**
 * Soft delete user service
 */
export const deleteUserService = async (userId) => {
  const user = await db.User.findByPk(userId);
  if (!user) throw new Error("User not found");
  await user.destroy(); // Soft delete because paranoid is true
  return true;
};

/**
 * Get all orders service
 */
export const getAllOrdersService = async (page = 1, limit = 10, status) => {
  const queryOptions = {
    where: {},
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["id", "fullname", "email"],
      },
      {
        model: db.OrderItem,
        as: "orderItems",
        include: [
          {
            model: db.Offer,
            include: [
              {
                model: db.SellerProfile,
                as: "sellerProfile",
                attributes: ["storeName"],
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  };

  if (status) {
    queryOptions.where.status = status;
  }

  return await paginate(db.Order, queryOptions, page, limit);
};

/**
 * Get a single order's full details with items, offers, seller, product info
 */
export const getOrderDetailsService = async (orderId) => {
  const order = await db.Order.findByPk(orderId, {
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["id", "fullname", "email", "phoneNumber"],
      },
      {
        model: db.OrderItem,
        as: "orderItems",
        include: [
          {
            model: db.Offer,
            include: [
              {
                model: db.Product,
                as: "product",
                attributes: ["id", "name", "slug"],
              },
              {
                model: db.SellerProfile,
                as: "sellerProfile",
                attributes: ["storeName"],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!order) throw new ApiError(404, "Order not found.");
  return order;
};

/**
 * Update an order's status - also cascades to its OrderItems
 */
export const updateOrderStatusService = async (orderId, status) => {
  const validStatuses = [
    "pending",
    "processed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    );
  }

  const order = await db.Order.findByPk(orderId);
  if (!order) throw new ApiError(404, "Order not found.");

  order.status = status;
  await order.save();

  // Cascade status update to all OrderItems
  await db.OrderItem.update({ status }, { where: { orderId } });

  // Notify the customer about the status change
  const statusLabel =
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  const shortId = order.orderId || orderId.slice(0, 8).toUpperCase();
  const message = `Your order #${shortId} status has been updated to: ${statusLabel}.`;
  const linkUrl = `/account/orders/${orderId}`;
  createNotification(order.userId, "order_status_update", message, linkUrl);

  return await getOrderDetailsService(orderId);
};

/**
 * Request OTP to edit a user
 */
export const requestUserEditOtpService = async (userId, adminId) => {
  const user = await db.User.findByPk(userId);
  if (!user) throw new ApiError(404, "User not found.");

  // Send OTP to the user's email so they can hand it to the admin
  // otp.service.js uses `user.email`
  await sendVerificationCode(userId, "email");

  return { success: true };
};

/**
 * Edit User with an OTP
 */
export const editUserWithOtpService = async (
  userId,
  otp,
  updateData,
  adminId,
) => {
  // Verify the OTP via the otp service
  await verifyCode(userId, otp, "email");

  const user = await db.User.findByPk(userId, {
    include: [{ model: db.SellerProfile, as: "sellerProfile" }],
  });
  if (!user) throw new ApiError(404, "User not found.");

  // Apply user updates
  if (updateData.fullname) user.fullname = updateData.fullname;
  if (updateData.email) user.email = updateData.email;
  if (updateData.phoneNumber !== undefined)
    user.phoneNumber = updateData.phoneNumber;

  await user.save();

  // If this user is a seller and seller data was provided, update it
  if (user.roles.includes("seller") && user.sellerProfile) {
    const sp = user.sellerProfile;
    let sellerUpdated = false;

    if (updateData.storeName) {
      sp.storeName = updateData.storeName;
      sellerUpdated = true;
    }
    if (updateData.storeDescription !== undefined) {
      sp.storeDescription = updateData.storeDescription;
      sellerUpdated = true;
    }
    if (updateData.businessAddress !== undefined) {
      sp.businessAddress = updateData.businessAddress;
      sellerUpdated = true;
    }

    if (sellerUpdated) {
      await sp.save();
    }
  }

  // Refresh user data to return
  return await db.User.findByPk(userId, {
    include: [{ model: db.SellerProfile, as: "sellerProfile" }],
    attributes: {
      exclude: ["password", "verificationCode", "verificationCodeExpiry"],
    },
  });
};

// ======== ADMIN REVIEW MODERATION SERVICES ========

/**
 * Fetch the admin review moderation queue, filterable by status.
 * Includes automated moderation flag breakdown per review.
 */
export const getReviewQueue = async (
  statusFilter = "pending",
  page = 1,
  limit = 10,
) => {
  const where = {};
  const validStatuses = [
    "pending",
    "flagged",
    "approved",
    "rejected",
    "hidden",
  ];
  if (statusFilter && statusFilter !== "all") {
    if (!validStatuses.includes(statusFilter)) {
      throw new ApiError(
        400,
        `Invalid status filter. Must be one of: ${validStatuses.join(", ")}`,
      );
    }
    where.status = statusFilter;
  }

  return paginate(
    db.Review,
    {
      where,
      include: [
        { model: db.User, as: "user", attributes: ["id", "fullname", "email"] },
        {
          model: db.Product,
          as: "product",
          attributes: ["id", "name", "slug"],
        },
        { model: db.Media, as: "media" },
      ],
      order: [["createdAt", "ASC"]],
    },
    page,
    limit,
  );
};

/**
 * Admin action to approve, reject, flag, or hide a review.
 * Records who acted, when, and with what reason.
 */
export const adminModerateReview = async (
  reviewId,
  adminId,
  decision,
  reason,
  note,
) => {
  const validDecisions = ["approved", "rejected", "flagged", "hidden"];
  if (!validDecisions.includes(decision)) {
    throw new ApiError(
      400,
      `Invalid decision. Must be one of: ${validDecisions.join(", ")}`,
    );
  }

  const review = await db.Review.findByPk(reviewId, {
    include: [
      { model: db.Product, as: "product", attributes: ["name", "id"] },
      { model: db.User, as: "user", attributes: ["id"] },
      {
        model: db.OrderItem,
        include: [{ model: db.Offer, attributes: ["sellerProfileId"] }],
      },
    ],
  });
  if (!review) throw new ApiError(404, "Review not found.");

  const previousStatus = review.status;

  review.status = decision;
  review.moderatedBy = adminId;
  review.moderatedAt = new Date();
  if (reason) review.moderationReason = reason;
  if (note) review.moderationNote = note;

  await review.save();

  // Recalculate product + seller rating if approving or if moving away from approved
  const { updateProductAverageRating, updateSellerAverageRating } =
    await import("./reviews.service.js");

  if (decision === "approved" || previousStatus === "approved") {
    updateProductAverageRating(review.productId).catch(() => {});
    if (review.OrderItem?.Offer?.sellerProfileId) {
      updateSellerAverageRating(review.OrderItem.Offer.sellerProfileId).catch(
        () => {},
      );
    }
  }

  // Notify the user (lowercase alias names from association)
  if (review.user?.id && review.product?.name) {
    const message = `Your review for '${review.product.name}' has been ${decision}.${
      reason ? ` Reason: ${reason}` : ""
    }`;
    const linkUrl = `/products/${review.productId}`;
    createNotification(review.user.id, `review_${decision}`, message, linkUrl);
  }

  return review;
};

/**
 * Fetch all user/seller-submitted review reports for admin.
 */
export const getReviewReports = async (
  statusFilter = "open",
  page = 1,
  limit = 10,
) => {
  const where = {};
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  return paginate(
    db.ReviewReport,
    {
      where,
      include: [
        {
          model: db.Review,
          attributes: ["id", "comment", "rating", "status"],
          include: [
            { model: db.User, as: "user", attributes: ["id", "fullname"] },
          ],
        },
        {
          model: db.User,
          as: "reporter",
          attributes: ["id", "fullname", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    },
    page,
    limit,
  );
};

/**
 * Admin resolves or dismisses a review report.
 */
export const resolveReport = async (reportId, adminId, resolution) => {
  const validResolutions = ["resolved", "dismissed"];
  if (!validResolutions.includes(resolution)) {
    throw new ApiError(400, "Resolution must be 'resolved' or 'dismissed'.");
  }

  const report = await db.ReviewReport.findByPk(reportId);
  if (!report) throw new ApiError(404, "Report not found.");
  if (report.status !== "open") {
    throw new ApiError(409, "This report has already been closed.");
  }

  report.status = resolution;
  report.resolvedBy = adminId;
  report.resolvedAt = new Date();
  await report.save();

  return report;
};
