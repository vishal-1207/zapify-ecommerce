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
import mediaModel from "./media.model.js";
import reviewModel from "./review.model.js";
import productSpecModel from "./productSpec.model.js";
import brand from "./brand.model.js";
import { userSettings, sellerSettings } from "./settings.model.js";
import sellerProfile from "./sellerProfile.model.js";
import wishList from "./wishlist.model.js";

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
db.Media = mediaModel(sequelize, Sequelize);
db.Review = reviewModel(sequelize, Sequelize);
db.ProductSpec = productSpecModel(sequelize, Sequelize);
db.Brand = brand(sequelize, Sequelize);
db.UserSettings = userSettings(sequelize, Sequelize);
db.SellerSettings = sellerSettings(sequelize, Sequelize);
db.SellerProfile = sellerProfile(sequelize, Sequelize);
db.WishList = wishList(sequelize, Sequelize);

// Category <-> Product
db.Category.hasMany(db.Product, {
  foreignKey: { name: "categoryId", allowNull: false },
});
db.Product.belongsTo(db.Category, {
  foreignKey: { name: "categoryId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// WishList <-> User
db.User.hasMany(db.WishList, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});
db.User.belongsToMany(db.Product, {
  through: db.WishList,
  foreignKey: "userId",
  otherKey: "productId",
  as: "wishListedProducts",
});
db.WishList.belongsTo(db.User, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});

// WishList <-> Product
db.Product.hasMany(db.WishList, {
  foreignKey: { name: "productId", allowNull: false },
  onDelete: "CASCADE",
});
db.Product.belongsToMany(db.User, {
  through: db.WishList,
  foreignKey: "productId",
  otherKey: "userId",
  as: "wishListedByUsers",
});
db.WishList.belongsTo(db.Product, {
  foreignKey: { name: "productId", allowNull: false },
  onDelete: "CASCADE",
});

// User <-> Cart
db.User.hasOne(db.Cart, {
  foreignKey: { name: "userId", allowNull: false },
});
db.Cart.belongsTo(db.User, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Cart <-> CartItem
db.Cart.hasMany(db.CartItem, {
  foreignKey: { name: "cartId", allowNull: false },
});
db.CartItem.belongsTo(db.Cart, {
  foreignKey: { name: "cartId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Product <-> CartItem
db.Product.hasMany(db.CartItem, {
  foreignKey: { name: "productId", allowNull: false },
});
db.CartItem.belongsTo(db.Product, {
  foreignKey: { name: "productId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// User <-> Order
db.User.hasMany(db.Order, {
  foreignKey: { name: "userId", allowNull: false },
});
db.Order.belongsTo(db.User, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// User <-> Review
db.User.hasMany(db.Review, {
  foreignKey: { name: "userId", allowNull: false },
});
db.Review.belongsTo(db.User, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Order <-> OrderItem
db.Order.hasMany(db.OrderItem, {
  foreignKey: { name: "orderId", allowNull: false },
});
db.OrderItem.belongsTo(db.Order, {
  foreignKey: { name: "orderId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Product <-> OrderItem
db.Product.hasMany(db.OrderItem, {
  foreignKey: { name: "productId", allowNull: false },
});
db.OrderItem.belongsTo(db.Product, {
  foreignKey: { name: "productId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// User <-> RefreshToken
db.User.hasMany(db.RefreshToken, {
  foreignKey: { name: "userId", allowNull: false },
});
db.RefreshToken.belongsTo(db.User, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// User <-> User Settings
db.User.hasOne(db.UserSettings, {
  foreignKey: { name: "userId", allowNull: false },
});
db.UserSettings.belongsTo(db.User, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Seller <-> Seller Settings
db.SellerProfile.hasOne(db.SellerSettings, {
  foreignKey: { name: "sellerProfileId", allowNull: false },
});
db.SellerSettings.belongsTo(db.SellerProfile, {
  foreignKey: { name: "sellerProfileId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// User <-> SellerProfile
db.User.hasOne(db.SellerProfile, {
  foreignKey: { name: "userId", allowNull: false },
});

db.SellerProfile.belongsTo(db.User, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Brand <-> Product
db.Brand.hasMany(db.Product, {
  foreignKey: { name: "brandId", allowNull: false },
});

db.Product.belongsTo(db.Brand, {
  foreignKey: { name: "brandId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Product <-> ProductSpec
db.Product.hasMany(db.ProductSpec, {
  foreignKey: { name: "productId", allowNull: false },
});

db.ProductSpec.belongsTo(db.Product, {
  foreignKey: { name: "productId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Product <-> Review
db.Product.hasMany(db.Review, {
  foreignKey: { name: "productId", allowNull: false },
});
db.Review.belongsTo(db.Product, {
  foreignKey: { name: "productId", allowNull: false },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
  as: "product",
});

// Polymorphic Media associations

// Brand -> Media
db.Brand.hasOne(db.Media, {
  foreignKey: "associatedId",
  constraints: false,
  scope: { associatedType: "brand" },
  as: "media",
});

// Product -> Media
db.Product.hasMany(db.Media, {
  foreignKey: "associatedId",
  constraints: false,
  scope: { associatedType: "product" },
  as: "media",
});

// Category -> Media
db.Category.hasOne(db.Media, {
  foreignKey: "associatedId",
  constraints: false,
  scope: { associatedType: "category" },
  as: "media",
});

// Review -> Media
db.Review.hasMany(db.Media, {
  foreignKey: "associatedId",
  constraints: false,
  scope: { associatedType: "review" },
  as: "media",
});

// Media -> Brand/Product/Review/Category
db.Media.belongsTo(db.Brand, {
  foreignKey: "associatedId",
  constraints: false,
  as: "brand",
});

db.Media.belongsTo(db.Product, {
  foreignKey: "associatedId",
  constraints: false,
  as: "product",
});

db.Media.belongsTo(db.Review, {
  foreignKey: "associatedId",
  constraints: false,
  as: "review",
});

db.Media.belongsTo(db.Category, {
  foreignKey: "associatedId",
  constraints: false,
  as: "category",
});

export default db;
