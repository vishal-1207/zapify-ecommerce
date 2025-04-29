export default (sequelize, DataTypes) => {
  const OrderItem = sequelize.define("OrderItem", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  });
  return OrderItem;
};
