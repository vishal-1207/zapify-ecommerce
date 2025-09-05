export default (sequelize, DataTypes) => {
  const ProductSpec = sequelize.define("ProductSpec", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.STRING, allowNull: false },
  });

  ProductSpec.associate = (models) => {
    ProductSpec.belongsTo(models.Product, {
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
  };

  return ProductSpec;
};
