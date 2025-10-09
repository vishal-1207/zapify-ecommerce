export default (sequelize, DataTypes) => {
  const Shipment = sequelize.define("Shipment", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingCarrier: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "Processing",
        "Shipped",
        "In Transit",
        "Delivered",
        "Cancelled"
      ),
      defaultValue: "Processing",
      allowNull: false,
    },
  });

  Shipment.associate = (models) => {
    Shipment.belongsTo(models.Order, {
      foreignKey: "orderId",
      onDelete: "CASCADE",
    });

    Shipment.belongsTo(models.SellerProfile, {
      foreignKey: "sellerProfileId",
      onDelete: "SET NULL",
    });
  };

  return Shipment;
};
