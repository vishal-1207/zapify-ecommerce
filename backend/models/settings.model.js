import { UUIDV4 } from "sequelize";

export default (sequelize, DataTypes) => {
  const UserSettings = sequelize.define("UserSettings", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    language: { type: DataTypes.STRING, allowNull: false, defaultValue: "en" },
    theme: { type: DataTypes.STRING, allowNull: false, defaultValue: "light" },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    smsNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    loginAlert: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    dataSharingConsent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

  const SellerSettings = sequelize.define("SellerSettings", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
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

  return { UserSettings, SellerSettings };
};
