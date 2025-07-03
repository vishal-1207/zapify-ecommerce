export default (sequelize, DataTypes) => {
  const SellerProfile = sequelize.define("SellerProfile", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    storeName: { type: DataTypes.SRTING, allowNull: false },
    bio: { type: DataTypes.TEXT, allowNull: true },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isUrl: true },
    },
    contactNumber: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false },
    verficationStatus: {
      type: DataTypes.ENUM("pending", "verified", "rejected"),
      defaultValue: "pending",
    },
  });

  return SellerProfile;
};
