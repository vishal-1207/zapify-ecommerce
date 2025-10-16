export default (sequelize, DataTypes) => {
  const Notification = sequelize.define("Notification", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    message: { type: DataTypes.STRING, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        // Types for Sellers
        "new_order",
        "product_suggestion_approved",
        "product_suggestion_rejected",

        // Types for Customers
        "order_status_update",
        "review_approved",
        "review_rejected",

        // Types for Admins
        "new_product_suggestion",
        "new_review_for_moderation"
      ),
    },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    linkUrl: { type: DataTypes.STRING, allowNull: true },
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      as: "Recipient",
      foreignKey: "recipientId",
    });
  };
};
