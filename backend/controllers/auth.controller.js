const db = require('../models/user.model');
const { Op } = require('sequelize');

const User = db.User;

exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ where: { [Op.or]: [{username}, {email}] } });;

        if (existingUser) {
            const message = existingUser.username === username
                ? 'Username is already taken.'
                : 'Email is already registered.';
            return res.status(409).json({ message });
        }

        const newUser = await User.create({ username, email, password });
        res.status(201).json({ message: 'User registered successfully.', user: newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.login = async (req, res) => {
    
}
