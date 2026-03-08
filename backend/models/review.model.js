export default (sequelize, DataTypes) => {
  const Review = sequelize.define("Review", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
    orderItemId: { type: DataTypes.UUID, allowNull: false, unique: true },
    likes: { type: DataTypes.INTEGER, defaultValue: 0 },
    dislikes: { type: DataTypes.INTEGER, defaultValue: 0 },
    likedBy: { type: DataTypes.JSON, defaultValue: [] },
    dislikedBy: { type: DataTypes.JSON, defaultValue: [] },

    // ── Moderation ──────────────────────────────────────────────────────────
    status: {
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected",
        "flagged",
        "hidden",
      ),
      defaultValue: "pending",
      allowNull: false,
    },
    // Reason shown to the user when their review is rejected or flagged
    moderationReason: { type: DataTypes.TEXT, allowNull: true },
    // Internal note visible to admins only (never sent to user)
    moderationNote: { type: DataTypes.TEXT, allowNull: true },
    // Composite automated moderation score (0.0 = clean, 1.0 = very harmful)
    autoModScore: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    // Breakdown of flags from the automated pipeline
    autoModFlags: {
      type: DataTypes.JSON,
      defaultValue: {
        profanity: false,
        spam: false,
        suspicious: false,
        toxicity: 0.0,
        nsfw: false,
      },
    },
    // Admin who last acted on this review
    moderatedBy: { type: DataTypes.UUID, allowNull: true },
    moderatedAt: { type: DataTypes.DATE, allowNull: true },

    // ── Seller Response ──────────────────────────────────────────────────────
    sellerResponse: { type: DataTypes.TEXT, allowNull: true },
    sellerResponseAt: { type: DataTypes.DATE, allowNull: true },

    // ── Soft hide ────────────────────────────────────────────────────────────
    isHidden: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  Review.associate = (models) => {
    Review.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    Review.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
    Review.belongsTo(models.OrderItem, { foreignKey: "orderItemId" });
    Review.hasMany(models.Media, {
      foreignKey: "associatedId",
      constraints: false,
      scope: { associatedType: "review" },
      as: "media",
    });
    Review.belongsTo(models.SellerProfile, {
      foreignKey: "sellerProfileId",
      as: "respondedBy",
      constraints: false,
    });
    Review.belongsTo(models.User, {
      foreignKey: "moderatedBy",
      as: "moderator",
      constraints: false,
    });
    Review.hasMany(models.ReviewReport, {
      foreignKey: "reviewId",
      as: "reports",
    });
  };

  return Review;
};
