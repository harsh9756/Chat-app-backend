const jwt = require("jsonwebtoken")
const User=require("../Models/userModel")
require('dotenv').config()

function generateToken(user) {
    try {
        const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '7d' });
        return token;
    } catch (error) {
        throw new Error('Token generation failed');
    }
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_KEY, async (err, user) => {
        if (err) return res.sendStatus(400,err);
        req.user = await User.findOne({ username: user.username }).select('-password');
        next();
    });
}
module.exports = {generateToken,authenticateToken};