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
      defaultValue: "gallery",
    },
    associatedType: {
      type: DataTypes.ENUM("product", "review", "category", "brand"),
      allowNull: false,
    },
    associatedId: { type: DataTypes.UUID, allowNull: false },
  });

  return Media;
};
