const express = require('express');
const { loginController, registerController, tokenVerifyController, editUserController, searchUserController, googleLoginController } = require('../Controllers/userController');
const { authenticateToken } = require('../Config/tokenFunctions');
const userRoutes = express.Router()

userRoutes.post('/api/login', loginController)
userRoutes.post('/api/google-login', googleLoginController);
userRoutes.post('/api/register', registerController)
userRoutes.post('/api/edit', authenticateToken, editUserController)
userRoutes.get('/api/getSearchedUser', authenticateToken,searchUserController)

userRoutes.get('/api/tokenVerify', authenticateToken, tokenVerifyController)

module.exports = userRoutes;