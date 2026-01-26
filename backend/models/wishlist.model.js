export default (sequelize, DataTypes) => {
  const Wishlist = sequelize.define("Wishlist", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  });

  Wishlist.associate = (models) => {
    Wishlist.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    Wishlist.belongsTo(models.Product, {
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
  };

  return Wishlist;
};
