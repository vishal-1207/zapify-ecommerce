export default (sequelize, DataTypes) => {
  const ProductSpec = sequelize.define("ProductSpec", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.STRING, allowNull: false },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Product", key: "id" },
    },
  });
  return ProductSpec;
};
