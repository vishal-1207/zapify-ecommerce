export default (sequelize, DataTypes) => {
  const WishList = sequelize.define("WishList", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
  });

  return WishList;
};
