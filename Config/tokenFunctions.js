const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");
require('dotenv').config();

function generateToken(user) {
    try {
        // Always include _id so middleware can look up by _id instead of username
        const token = jwt.sign(
            { _id: user._id, name: user.name, username: user.username, email: user.email },
            process.env.SECRET_KEY,
            { expiresIn: '7d' }
        );
        return token;
    } catch (error) {
        throw new Error('Token generation failed');
    }
}

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // FIX: guard missing token before calling jwt.verify
    if (!token) return res.status(401).json({ message: "No token provided." });

    jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
        // FIX: was res.sendStatus(400, err) — second arg silently ignored, and 400 is wrong for auth
        if (err) return res.status(401).json({ message: "Token invalid or expired." });

        // FIX: look up by _id instead of username — one less DB index scan per request
        req.user = await User.findById(decoded._id).select('-password');
        if (!req.user) return res.status(401).json({ message: "User not found." });

        next();
    });
}

module.exports = { generateToken, authenticateToken };