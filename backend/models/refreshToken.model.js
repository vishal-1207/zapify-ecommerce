import { UUIDV4 } from "sequelize";

export default (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define("RefreshToken", {
    tokenId: { type: DataTypes.UUID, defaultValue: UUIDV4, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  });
  return RefreshToken;
};
