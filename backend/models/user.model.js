export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullname: { type: DataTypes.STRING, allowNull: false },
      username: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
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
      },
      verificationCode: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Stores the 6-digit code for email or phone verification.",
      },
      verificationCodeExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "The expiry time for the verification code.",
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          theme: "light",
          language: "en",
          emailNotifications: true,
          smsNotifications: true,
          deleteOnRead: false,
        },
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isPhoneVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      scheduledForDeletionAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      paranoid: true,
      indexes: [
        { unique: true, fields: ["username"], name: "users_username_unique" },
        { unique: true, fields: ["email"], name: "users_email_unique" },
        { unique: true, fields: ["phoneNumber"], name: "users_phone_number_unique" },
        { unique: true, fields: ["providerId"], name: "users_provider_id_unique" },
      ],
      hooks: {
        beforeValidate: (user) => {
          if (!user.email && !user.phoneNumber) {
            throw new Error("Either email or phone number must be provided.");
          }
        },
      },
    },
  );

  User.prototype.toJSON = function () {
    const user = { ...this.get() };
    delete user.password;
    delete user.verificationCode;
    delete user.verificationCodeExpiry;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.scheduledForDeletionAt;
    return user;
  };

  User.associate = (models) => {
    User.hasOne(models.Cart, { as: "cart", foreignKey: "userId" });
    User.hasOne(models.SellerProfile, {
      as: "sellerProfile",
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    User.hasMany(models.Order, { as: "orders", foreignKey: "userId" });
    User.hasMany(models.Review, { as: "reviews", foreignKey: "userId" });
    User.hasMany(models.RefreshToken, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    User.belongsToMany(models.Product, {
      through: models.Wishlist,
      foreignKey: "userId",
      otherKey: "productId",
      as: "wishListedProducts",
    });
  };

  return User;
};
