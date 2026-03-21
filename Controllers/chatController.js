const asyncHandler = require('express-async-handler');
const Chat = require('../Models/chatModel');
const { getUserSocketId, io } = require('../socketio');

const createChatController = asyncHandler(async (req, res) => {
    const user = req.user;
    const { userId } = req.body;

    // Fetch all chats for the current user (no userId = just load sidebar)
    if (userId === undefined) {
        const fullChat = await Chat.find({ users: user._id })
            .populate('users', 'name email')
            .populate({
                path: 'latestMessage',
                populate: { path: 'sender', select: 'name email' }
            })
            .sort({ updatedAt: -1 });
        return res.status(200).send({ fullChat });
    }

    // Create or return existing chat with another user
    const existingChat = await Chat.findOne({
        users: { $all: [user._id, userId] },
    }).populate('users', 'name email')
      .populate({
          path: 'latestMessage',
          populate: { path: 'sender', select: 'name email' }
      });

    // FIX: was hanging forever when chat already existed — now returns full chat list
    if (existingChat) {
        const fullChat = await Chat.find({ users: user._id })
            .populate('users', 'name email')
            .populate({
                path: 'latestMessage',
                populate: { path: 'sender', select: 'name email' }
            })
            .sort({ updatedAt: -1 });
        return res.status(200).send({ fullChat });
    }

    // No existing chat — create a new one
    const Rsid = getUserSocketId(userId);
    let chatItem = new Chat({
        chatName: `${userId} and ${user._id}`,
        users: [user._id, userId],
    });
    await chatItem.save();

    const fullChat = await Chat.find({ users: user._id })
        .populate('users', 'name email')
        .populate({
            path: 'latestMessage',
            populate: { path: 'sender', select: 'name email' }
        })
        .sort({ updatedAt: -1 });

    if (Rsid) {
        chatItem = await chatItem.populate('users', 'name email');
        io.to(Rsid).emit("newChat", chatItem);
    }

    return res.status(200).send({ fullChat });
});

module.exports = createChatController;