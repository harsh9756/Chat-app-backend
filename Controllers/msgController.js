const asyncHandler = require('express-async-handler');
const Message = require('../Models/msgModel');
const Chat = require('../Models/chatModel');
const { io, getUserSocketId } = require('../socketio');

const sendMsgController = asyncHandler(async (req, res) => {
    const { Rid, content, chatID } = req.body;
    if (!content || !chatID) {
        return res.status(400).send("Data not sufficient.");
    }
    try {
        let msg = await Message.create({
            sender: req.user._id,
            content,
            chatId: chatID,
        });
        msg = await msg.populate("sender", "name");
        await Chat.findByIdAndUpdate(chatID, { latestMessage: msg });

        const Rsid = getUserSocketId(Rid);
        if (Rsid) io.to(Rsid).emit("newMessage", msg);

        return res.status(200).send(msg);
    } catch (error) {
        res.status(400).json(error);
    }
});

const getChatMsgController = asyncHandler(async (req, res) => {
    try {
        const LIMIT = 30;
        const { before } = req.query;

        const query = { chatId: req.params.chatID };
        if (before) query._id = { $lt: before };

        // FIX: fetch LIMIT + 1 to accurately determine hasMore
        // If we get 31 back, there are more. Slice to 30 before sending.
        const messages = await Message.find(query)
            .populate("sender", "name")
            .sort({ _id: -1 })
            .limit(LIMIT + 1);

        const hasMore = messages.length > LIMIT;
        const paginated = hasMore ? messages.slice(0, LIMIT) : messages;

        await Message.updateMany(
            { chatId: req.params.chatID, sender: { $ne: req.user._id } },
            { $set: { isRead: true } }
        );

        res.status(200).send({ messages: paginated, hasMore });
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = { sendMsgController, getChatMsgController };