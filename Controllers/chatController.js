const asyncHandler = require('express-async-handler');
const Chat = require('../Models/chatModel');
const { getUserSocketId, io } = require('../socketio');

const createChatController = asyncHandler(async (req, res) => {
    const user = req.user;
    const { userId } = req.body;
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
    else {
        let existingChat = await Chat.findOne({
            users: { $all: [user._id, userId] },
        });

        if (!existingChat) {
            const Rsid = getUserSocketId(userId);
            let Chatitem = new Chat({
                chatName: `${userId} and ${user._id}`,
                users: [user._id, userId],
            });

            await Chatitem.save();
            console.log("Chat item created");

            const fullChat = await Chat.find({ users: user._id })
                .populate('users', 'name email')
                .populate({
                    path: 'latestMessage',
                    populate: { path: 'sender', select: 'name email' }
                })
                .sort({ updatedAt: -1 });
            console.log("Rsid online h and bata diya", Rsid);
            if (Rsid) {
                Chatitem = await Chatitem.populate('users', 'name email');
                io.to(Rsid).emit("newChat", Chatitem);
            }
            return res.status(200).send({ fullChat });
        }
    }
});

module.exports = createChatController;
