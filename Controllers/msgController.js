const asyncHandler = require('express-async-handler');
const Message = require('../Models/msgModel');
const Chat = require('../Models/chatModel');
const { io, getUserSocketId } = require('../socketio');

const sendMsgController = asyncHandler(async (req, res) => {
    const { Rid, content, chatID } = req.body
    if (!content || !chatID) {
        res.status(400).send("Data not sufficient")
    }
    var newMsg = {
        sender: req.user._id,
        content: content,
        chatId: chatID,
    }
    try {
        var msg = await Message.create(newMsg)
        msg = await msg.populate("sender", "name")
        await Chat.findByIdAndUpdate(req.body.chatID, {
            latestMessage: msg
        })
        const Rsid = getUserSocketId(Rid)
        if (Rsid) {
            io.to(Rsid).emit("newMessage", msg)
        }
        return res.status(200).send(msg);
    } catch (error) {
        res.status(400).json(error)
    }

})

const getChatMsgController = asyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chatId: req.params.chatID }).populate("sender", "name")
            .sort({ createdAt: -1 })
            .limit(50)
        await Message.updateMany({
            chatId: req.params.chatID,
            sender: { $ne: req.user._id }
        }, { $set: { isRead: true } })

        res.status(200).send(messages)
    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = { sendMsgController, getChatMsgController }