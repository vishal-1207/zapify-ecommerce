export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullname: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: true },
    roles: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ["user"],
    },
    provider: {
      type: DataTypes.ENUM("local", "google", "github"),
      defaultValue: "local",
    },

    providerId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  });

  User.prototype.toJSON = function () {
    const user = { ...this.get() };
    delete user.password;
    return user;
  };

  User.associate = (models) => {
    User.hasOne(models.Cart, { foreignKey: "userId" });
    User.hasOne(models.SellerProfile, { foreignKey: "userId" });
    User.hasOne(models.UserSetting, { foreignKey: "userId" });
    User.hasMany(models.Order, { foreignKey: "userId" });
    User.hasMany(models.Review, { foreignKey: "userId" });
    User.hasMany(models.RefreshToken, { foreignKey: "userId" });
    User.belongsToMany(models.Product, {
      through: models.WishList,
      foreignKey: "userId",
      otherKey: "productId",
      as: "wishListedProducts",
    });
  };

  return User;
};
