export default (sequelize, DataTypes) => {
    const Cart = sequelize.define("Cart", {
        id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true}
    });
    return Cart;
};