export default (sequelize, DataTypes) => {
  const Media = sequelize.define("Media", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    publicId: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    fileType: { type: DataTypes.ENUM("image", "video"), allowNull: false },
    associatedType: {
      type: DataTypes.ENUM("product", "review"),
      allowNull: false,
    },
    associatedId: { type: DataTypes.INTEGER, allowNull: false },
  });
  return Media;
};
