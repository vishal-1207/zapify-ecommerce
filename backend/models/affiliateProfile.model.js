export default (sequelize, DataTypes) => {
  const AffiliateProfile = sequelize.define("AffiliateProfile", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    referralCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "suspended"),
      defaultValue: "active", // Make active by default for immediate onboarding
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 10.0, // 10% commission
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    pendingEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
  });

  AffiliateProfile.associate = (models) => {
    AffiliateProfile.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    AffiliateProfile.hasMany(models.Order, { foreignKey: "affiliateId", as: "referredOrders" });
  };

  return AffiliateProfile;
};
