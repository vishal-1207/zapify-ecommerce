export default (sequelize, DataTypes) => {
  const SellerSetting = sequelize.define("SellerSetting", {
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

  SellerSetting.associate = (models) => {
    SellerSetting.belongsTo(models.SellerProfile, {
      foreignKey: "sellerProfileId",
    });
  };

  return SellerSetting;
};
