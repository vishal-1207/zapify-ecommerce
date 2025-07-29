import { UUIDV4 } from "sequelize";

export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
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

  return User;
};
