const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;


db.User = require('./user.model')(sequelize, Sequelize);
db.Product = require('./product.model')(sequelize, Sequelize);
db.Category = require('./category.model')(sequelize, Sequelize);
db.Cart = require('./cart.model')(sequelize, Sequelize);
db.CartItem = require('./cartItem.model')(sequelize, Sequelize);
db.Order = require('./order.model')(sequelize, Sequelize);
db.OrderItem = require('./orderItem.model')(sequelize, Sequelize);


db.User.hasOne(db.Cart);
db.Cart.belongsTo(db.User);

db.User.hasMany(db.Order);
db.Order.belongsTo(db.User);

db.Category.hasMany(db.Product);
db.Product.belongsTo(db.Category);

db.Cart.belongsToMany(db.Product, { through: db.CartItem });
db.Product.belongsToMany(db.Cart, { through: db.CartItem });

db.Order.belongsToMany(db.Product, { through: db.OrderItem });
db.Product.belongsToMany(db.Order, { through: db.OrderItem });

module.exports = db;
