const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const User = require('../Models/userModel');
const { generateToken } = require('../Config/tokenFunctions');
const Chat = require('../Models/chatModel');

// FIX: instantiate once at module level, not on every request
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerController = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body;

    // FIX: single query instead of two separate ones
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
        if (existing.username === username) return res.status(409).send('Username already taken.');
        if (existing.email === email) return res.status(409).send('Email already registered.');
    }

    const user = await User.create({ name, username, email, password });
    const token = generateToken({ _id: user._id, name: user.name, username: user.username, email: user.email });
    res.status(200).json({
        userData: { _id: user._id, name: user.name, username: user.username, email: user.email },
        token,
    });
});

const loginController = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const user = await User.findOne({
        $or: [{ username }, { email }, { username: email }, { email: username }]
    });

    // FIX: added return so execution stops here on failure
    if (!user) return res.status(401).send("Username/Email not found.");

    const isMatch = await bcrypt.compare(password, user.password);

    // FIX: password check moved before chatData fetch — no wasted DB query on bad login
    if (!isMatch) return res.status(401).send('Invalid password.');

    const allChats = await Chat.find({ users: user._id })
        .populate('users', 'name email')
        .populate('latestMessage');

    const token = generateToken({ _id: user._id, name: user.name, username: user.username, email: user.email });
    res.status(200).json({
        chatData: allChats,
        userData: { _id: user._id, name: user.name, username: user.username, email: user.email },
        token,
    });
});

const editUserController = asyncHandler(async (req, res) => {
    const { old, update } = req.body;

    // FIX: check for username/email conflicts before saving
    const { name, username, email } = update;
    const conflict = await User.findOne({
        $or: [{ username }, { email }],
        _id: { $ne: req.user._id },  // exclude the current user
    });
    if (conflict) {
        if (conflict.username === username) return res.status(409).send('Username already taken.');
        if (conflict.email === email) return res.status(409).send('Email already registered.');
    }

    const user = await User.findById(req.user._id);

    // FIX: only update whitelisted fields — prevents injecting arbitrary fields into the document
    // FIX: exclude password from the update to prevent triggering the bcrypt pre-save re-hash
    user.name = name ?? user.name;
    user.username = username ?? user.username;
    user.email = email ?? user.email;

    await user.save();

    // FIX: whitelist token payload — don't sign raw req.body into the JWT
    const token = generateToken({ _id: user._id, name: user.name, username: user.username, email: user.email });
    res.status(202).json({
        userData: { _id: user._id, name: user.name, username: user.username, email: user.email },
        token,
    });
});

const tokenVerifyController = asyncHandler(async (req, res) => {
    const allChats = await Chat.find({ users: req.user._id })
        .populate('users', 'name email')
        .populate('latestMessage');
    res.status(200).send({ userData: req.user, chatData: allChats });
});

const searchUserController = asyncHandler(async (req, res) => {
    const data = req.query.q;
    const user = await User.findOne({
        $or: [{ username: data }, { email: data }]
    }).select("-password");

    if (!user) return res.status(404).send({ message: 'User not found.' });
    res.status(200).json(user);
});

const googleLoginController = asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).send("Missing Google credential token.");

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name, sub } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            // FIX: handle username collision for Google signups
            let baseUsername = email.split('@')[0];
            let username = baseUsername;
            const exists = await User.findOne({ username });
            if (exists) username = `${baseUsername}_${Math.random().toString(36).slice(2, 6)}`;

            user = await User.create({ name, username, email, password: sub });
        }

        const allChats = await Chat.find({ users: user._id })
            .populate('users', 'name email')
            .populate('latestMessage');

        const token = generateToken({ _id: user._id, name: user.name, username: user.username, email: user.email });
        return res.status(200).json({
            token,
            userData: { _id: user._id, name: user.name, username: user.username, email: user.email },
            chatData: allChats,
        });
    } catch (error) {
        return res.status(401).send("Invalid Google token.");
    }
});

module.exports = {
    registerController,
    loginController,
    tokenVerifyController,
    editUserController,
    searchUserController,
    googleLoginController,
};