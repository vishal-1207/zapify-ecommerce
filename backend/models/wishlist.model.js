export default (sequelize, DataTypes) => {
  const WishList = sequelize.define("WishList", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  });

  WishList.associate = (models) => {
    WishList.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    WishList.belongsTo(models.Product, {
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
  };

  return WishList;
};
