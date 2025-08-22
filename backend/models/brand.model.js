export default (sequelize, DataTypes) => {
  const Brand = sequelize.define("Brand", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false },
  });

  Brand.associate = (models) => {
    Brand.hasOne(models.Media, {
      foreignKey: "associatedId",
      constraints: false,
      scope: { associatedType: "brand" },
      as: "media",
    });
    Brand.hasMany(models.Product, { foreignKey: "brandId" });
  };

  return Brand;
};
