export default (sequelize, DataTypes) => {
  const CartItem = sequelize.define("CartItem", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  });

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.Cart, {
      as: "cart",
      foreignKey: "cartId",
      onDelete: "CASCADE",
    });
    CartItem.belongsTo(models.Product, {
      as: "product",
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
  };

  return CartItem;
};
