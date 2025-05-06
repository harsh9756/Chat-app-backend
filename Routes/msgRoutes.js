const express = require('express');
const { authenticateToken } = require('../Config/tokenFunctions');
const { sendMsgController, getChatMsgController } = require('../Controllers/msgController');
const msgRoutes = express.Router()

msgRoutes.post('/',authenticateToken,sendMsgController)
msgRoutes.get('/:chatID',authenticateToken,getChatMsgController)

module.exports = msgRoutes;