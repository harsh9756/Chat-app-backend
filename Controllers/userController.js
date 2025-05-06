const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const User = require('../Models/userModel');
const { generateToken } = require('../Config/tokenFunctions');
const Chat = require('../Models/chatModel');
const registerController = asyncHandler(async (req, res) => {
    if (await User.findOne({ username: req.body.username })) {
        return res.status(409).send('Username already taken');
    }
    if (await User.findOne({ email: req.body.email })) {
        return res.status(409).send('Email already registered!');
    }
    const user = await User.create(req.body);
    res.status(200).json({ "userData": { _id:user._id,name: user.name, username: user.username, email: user.email }, "token": generateToken({ name: user.name, username: user.username, email: user.email }) });
});

const loginController = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const user = await User.findOne({
        $or: [{ username: username }, { email: email }, { username: email }, { email: username }]
    })
    if (!user) {
        res.status(401).send("Username/Email not Found.")
    }
    const isMatch = await bcrypt.compare(password, user.password)
    const allChats = await Chat.find({ users: user._id })
        .populate('users', 'name email')
        .populate('latestMessage');
    if (!isMatch) {
        return res.status(401).send('Invalid password');
    }
    res.status(200).json({ "chatData": allChats, "userData": { _id:user._id,name: user.name, username: user.username, email: user.email }, "token": generateToken({ name: user.name, username: user.username, email: user.email }) });
});

const editUserController = asyncHandler(async (req, res) => {
    const { old, update } = req.body;
    const user = await User.findOne({
        $or: [{ username: old.username }, { email: old.email }]
    })
    Object.keys(update).forEach(key => {
        user[key] = update[key];
    });
    await user.save();
    res.status(202).json({"userData":update,"token":generateToken(update)})
})

const tokenVerifyController = asyncHandler(async (req, res) => {
    const user = req.user
    const allChats = await Chat.find({ users: user._id })
        .populate('users', 'name email')
        .populate('latestMessage');
    res.status(200).send({ "userData": req.user, "chatData": allChats })
})

const searchUserController = asyncHandler(async (req, res) => {
    const data = req.query.q;
    try {
        const user = await User.findOne({
            $or: [{ username: data }, { email: data }]
        }).select("-password");
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

const googleLoginController = asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).send("Missing Google credential token.");
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                username: email.split('@')[0],
                email,
                password: sub, // dummy password, not used
            });
        }

        const allChats = await Chat.find({ users: user._id })
            .populate('users', 'name email')
            .populate('latestMessage');

        const token = generateToken({ _id: user._id, name: user.name, username: user.username, email: user.email });

        return res.status(200).json({
            token,
            userData: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
            },
            chatData: allChats,
        });

    } catch (error) {
        return res.status(401).send("Invalid Google token.");
    }
});


module.exports = { registerController, loginController, tokenVerifyController, editUserController, searchUserController,googleLoginController };
