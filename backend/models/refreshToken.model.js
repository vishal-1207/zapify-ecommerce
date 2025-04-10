export default (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define("RefreshToken", {
    tokenId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    accessToken: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  });
  return RefreshToken;
};
