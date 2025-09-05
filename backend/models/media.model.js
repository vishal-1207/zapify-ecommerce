export default (sequelize, DataTypes) => {
  const Media = sequelize.define("Media", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    publicId: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    fileType: { type: DataTypes.ENUM("image", "video"), allowNull: false },
    tag: {
      type: DataTypes.ENUM("thumbnail", "gallery"),
      allowNull: false,
      default: "gallery",
    },
    associatedType: {
      type: DataTypes.ENUM("product", "review", "category", "brand"),
      allowNull: false,
    },
    associatedId: { type: DataTypes.INTEGER, allowNull: false },
  });

  Media.associate = (models) => {
    Media.belongsTo(models.Brand, {
      foreignKey: "associatedId",
      constraints: false,
      as: "brand",
      onDelete: "CASCADE",
    });
    Media.belongsTo(models.Product, {
      foreignKey: "associatedId",
      constraints: false,
      as: "product",
      onDelete: "CASCADE",
    });
    Media.belongsTo(models.Review, {
      foreignKey: "associatedId",
      constraints: false,
      as: "review",
      onDelete: "CASCADE",
    });
    Media.belongsTo(models.Category, {
      foreignKey: "associatedId",
      constraints: false,
      as: "category",
      onDelete: "CASCADE",
    });
  };

  return Media;
};
