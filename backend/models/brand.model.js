export default (sequelize, DataTypes) => {
  const Brand = sequelize.define("Brand", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false },
  });

  return Brand;
};
