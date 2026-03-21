export default (sequelize, DataTypes) => {
  const ReviewReport = sequelize.define("ReviewReport", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reviewId: { type: DataTypes.UUID, allowNull: false },
    reporterId: { type: DataTypes.UUID, allowNull: false },
    reporterRole: {
      type: DataTypes.ENUM("user", "seller"),
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM(
        "spam",
        "fake_review",
        "profanity",
        "competitor_manipulation",
        "hate_speech",
        "misleading",
        "irrelevant",
        "abuse",
        "other",
      ),
      allowNull: false,
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("open", "resolved", "dismissed"),
      defaultValue: "open",
      allowNull: false,
    },
    resolvedBy: { type: DataTypes.UUID, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  });

  ReviewReport.associate = (models) => {
    ReviewReport.belongsTo(models.Review, {
      foreignKey: "reviewId",
      onDelete: "CASCADE",
    });
    ReviewReport.belongsTo(models.User, {
      as: "reporter",
      foreignKey: "reporterId",
    });
    ReviewReport.belongsTo(models.User, {
      as: "resolver",
      foreignKey: "resolvedBy",
      constraints: false,
    });
  };

  ReviewReport.addHook("beforeCreate", async (report) => {
    const existing = await ReviewReport.findOne({
      where: { reviewId: report.reviewId, reporterId: report.reporterId },
    });
    if (existing) {
      const { default: ApiError } = await import("../utils/ApiError.js");
      throw new ApiError(409, "You have already reported this review.");
    }
  });

  return ReviewReport;
};
