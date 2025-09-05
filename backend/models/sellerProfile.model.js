export default (sequelize, DataTypes) => {
  const SellerProfile = sequelize.define("SellerProfile", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    storeName: { type: DataTypes.STRING, allowNull: false },
    bio: { type: DataTypes.TEXT, allowNull: true },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isUrl: true },
    },
    contactNumber: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verficationStatus: {
      type: DataTypes.ENUM("pending", "verified", "rejected"),
      defaultValue: "pending",
    },
    slug: { type: DataTypes.STRING, allowNull: true, unique: true },
  });

  SellerProfile.associate = (models) => {
    SellerProfile.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    SellerProfile.hasOne(models.SellerSettings, {
      foreignKey: "sellerProfileId",
    });
  };

  return SellerProfile;
};
