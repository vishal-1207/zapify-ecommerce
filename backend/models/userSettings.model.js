export default (sequelize, DataTypes) => {
  const UserSetting = sequelize.define("UserSetting", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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

  UserSetting.associate = (models) => {
    UserSetting.belongsTo(models.User, { foreignKey: "userId" });
  };

  return UserSetting;
};
