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
    moderationReason: { type: DataTypes.TEXT, allowNull: true },
    moderationNote: { type: DataTypes.TEXT, allowNull: true },
    autoModScore: { type: DataTypes.FLOAT, defaultValue: 0.0 },
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
    moderatedBy: { type: DataTypes.UUID, allowNull: true },
    moderatedAt: { type: DataTypes.DATE, allowNull: true },

    sellerResponse: { type: DataTypes.TEXT, allowNull: true },
    sellerResponseAt: { type: DataTypes.DATE, allowNull: true },

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
