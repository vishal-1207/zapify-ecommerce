export default (sequelize, DataTypes) => {
  const Brand = sequelize.define("Brand", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false },
  });

  return Brand;
};
