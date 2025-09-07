export default (sequelize, DataTypes) => {
  const Offer = sequelize.define("Offer", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      coment: "The price set by the seller for this offer.",
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "The number of items the seller has in stock for this offer.",
    },
    condition: {
      type: DataTypes.ENUM(
        "New",
        "Used - New Like",
        "Used - Good",
        "Refurbished"
      ),
      defaultValue: "New",
    },
  });

  Offer.associate = (models) => {
    Offer.belongsTo(models.Product, {
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
    Offer.belongsTo(models.SellerProfile, {
      foreignKey: "sellerProfileId",
      onDelete: "CASCADE",
    });

    Offer.hasMany(models.CartItem, {
      foreignKey: "offerId",
    });
    Offer.hasMany(models.OrderItem, {
      foreignKey: "offerId",
    });
  };

  return Offer;
};
