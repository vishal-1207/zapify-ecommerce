export default (sequelize, DataTypes) => {
  const SellerSettings = sequelize.define("SellerSettings", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    storeVisibility: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    lowStockNotification: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    salesReportEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    autoApproveReviews: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  });

  SellerSettings.associate = (models) => {
    SellerSettings.belongsTo(models.SellerProfile, {
      foreignKey: "sellerProfileId",
      onDelete: "CASCADE",
    });
  };

  return SellerSettings;
};
