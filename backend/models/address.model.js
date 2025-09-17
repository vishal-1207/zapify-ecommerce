export default (sequelize, DataTypes) => {
  const Address = sequelize.define("Address", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
    addressableId: { type: DataTypes.UUID, allowNull: false },
    addressableType: {
      type: DataTypes.ENUM("User", "SellerProfile"),
      defaultValue: "User",
    },
    addressType: {
      type: DataTypes.ENUM("Shipping", "Billing", "Business"),
      defaultValue: "Shipping",
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Stores structured details like flat, landmark or store number.",
    },
    street: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zipCode: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  Address.associate = (models) => {
    Address.belongsTo(models.User, {
      foreignKey: "addressableId",
      constraints: false,
      as: "User",
    });

    Address.belongsTo(models.SellerProfile, {
      foreignKey: "addressableId",
      constraints: false,
      as: "SellerProfile",
    });
  };

  return Address;
};
