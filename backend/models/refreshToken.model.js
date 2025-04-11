export default (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define("RefreshToken", {
    tokenId: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  });
  return RefreshToken;
};
