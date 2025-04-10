import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/db.js";

import userModel from "./user.model.js";
import productModel from "./product.model.js";
import categoryModel from "./category.model.js";
import cartModel from "./cart.model.js";
import cartItemModel from "./cartItem.model.js";
import orderModel from "./order.model.js";
import orderItemModel from "./orderItem.model.js";

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

// 1. Category ↔ Product
db.Category.hasMany(db.Product, { foreignKey: "categoryId" });
db.Product.belongsTo(db.Category, { foreignKey: "categoryId" });

// 2. User ↔ Cart
db.User.hasOne(db.Cart, { foreignKey: "userId" });
db.Cart.belongsTo(db.User, { foreignKey: "userId" });

// 3. Cart ↔ CartItem ↔ Product
db.Cart.hasMany(db.CartItem, { foreignKey: "cartId" });
db.CartItem.belongsTo(db.Cart, { foreignKey: "cartId" });

db.Product.hasMany(db.CartItem, { foreignKey: "productId" });
db.CartItem.belongsTo(db.Product, { foreignKey: "productId" });

// 4. User ↔ Order
db.User.hasMany(db.Order, { foreignKey: "userId" });
db.Order.belongsTo(db.User, { foreignKey: "userId" });

// 5. Order ↔ OrderItem ↔ Product
db.Order.hasMany(db.OrderItem, { foreignKey: "orderId" });
db.OrderItem.belongsTo(db.Order, { foreignKey: "orderId" });

db.Product.hasMany(db.OrderItem, { foreignKey: "productId" });
db.OrderItem.belongsTo(db.Product, { foreignKey: "productId" });

export default db;
