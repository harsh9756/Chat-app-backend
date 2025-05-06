const express = require("express")
const { authenticateToken } = require("../Config/tokenFunctions");
const createChatController = require("../Controllers/chatController");
const chatRoutes = express.Router()

chatRoutes.post('/api/getAllChats', authenticateToken, createChatController)
module.exports = chatRoutes;