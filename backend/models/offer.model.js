export default (sequelize, DataTypes) => {
  const Offer = sequelize.define(
    "Offer",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "The price set by the seller for this offer.",
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Live stock for this seller's offer.",
      },
      condition: {
        type: DataTypes.ENUM(
          "New",
          "Used - New Like",
          "Used - Good",
          "Refurbished",
        ),
        defaultValue: "New",
      },
      status: {
        type: DataTypes.ENUM("draft", "active"),
        allowNull: false,
        defaultValue: "draft",
      },
    },
    {
      hooks: {
        afterCreate: async (offer) => {
          const { updateProductAggregates } =
            await import("../services/product.service.js");
          await updateProductAggregates(offer.productId);
        },
        afterUpdate: async (offer) => {
          const { updateProductAggregates } =
            await import("../services/product.service.js");
          await updateProductAggregates(offer.productId);
        },
        afterDestroy: async (offer) => {
          const { updateProductAggregates } =
            await import("../services/product.service.js");
          await updateProductAggregates(offer.productId);
        },
      },
    },
  );

  Offer.associate = (models) => {
    Offer.belongsTo(models.Product, {
      as: "product",
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
    Offer.belongsTo(models.SellerProfile, {
      as: "sellerProfile",
      foreignKey: "sellerProfileId",
      onDelete: "CASCADE",
    });

    Offer.hasMany(models.CartItem, {
      as: "cartItems",
      foreignKey: "offerId",
    });
    Offer.hasMany(models.OrderItem, {
      as: "orderItems",
      foreignKey: "offerId",
    });
  };

  return Offer;
};
