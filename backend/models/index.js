import sequelize from "../config/db.js";
import { Sequelize } from "sequelize";

import userModel from "./user.model.js";
import productModel from "./product.model.js";
import categoryModel from "./category.model.js";
import cartModel from "./cart.model.js";
import cartItemModel from "./cartItem.model.js";
import orderModel from "./order.model.js";
import orderItemModel from "./orderItem.model.js";
import refreshTokenModel from "./refreshToken.model.js";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = userModel(sequelize, Sequelize);
db.Product = productModel(sequelize, Sequelize);
db.Category = categoryModel(sequelize, Sequelize);
db.Cart = cartModel(sequelize, Sequelize);
db.CartItem = cartItemModel(sequelize, Sequelize);
db.Order = orderModel(sequelize, Sequelize);
db.OrderItem = orderItemModel(sequelize, Sequelize);
db.RefreshToken = refreshTokenModel(sequelize, Sequelize);

db.Category.hasMany(db.Product, { foreignKey: "categoryId" });
db.Product.belongsTo(db.Category, { foreignKey: "categoryId" });

db.User.hasOne(db.Cart, { foreignKey: "userId" });
db.Cart.belongsTo(db.User, { foreignKey: "userId" });

db.Cart.hasMany(db.CartItem, { foreignKey: "cartId" });
db.CartItem.belongsTo(db.Cart, { foreignKey: "cartId" });

db.Product.hasMany(db.CartItem, { foreignKey: "productId" });
db.CartItem.belongsTo(db.Product, { foreignKey: "productId" });

db.User.hasMany(db.Order, { foreignKey: "userId" });
db.Order.belongsTo(db.User, { foreignKey: "userId" });

db.Order.hasMany(db.OrderItem, { foreignKey: "orderId" });
db.OrderItem.belongsTo(db.Order, { foreignKey: "orderId" });

db.Product.hasMany(db.OrderItem, { foreignKey: "productId" });
db.OrderItem.belongsTo(db.Product, { foreignKey: "productId" });

db.User.hasMany(db.RefreshToken, { foreignKey: "userId" });
db.RefreshToken.belongsTo(db.User, { foreignKey: "userId" });

export default db;
