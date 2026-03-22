# Convo — Backend

REST API and WebSocket server for the Convo chat app. Pairs with the [Convo Frontend](../frontend).

## Tech Stack

- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **Socket.io** — real-time events
- **JWT** — authentication
- **bcryptjs** — password hashing
- **Google Auth Library** — Google OAuth verification

## Getting Started

```bash
git clone https://github.com/yourname/convo-backend.git
cd convo-backend
npm install
```

Create a `.env` file in the root:

```env
MONGO_URL=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
PORT=5000
```

Then run:

```bash
npm run dev
```

## API Reference

### Auth — `/user`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register with email/password |
| POST | `/api/login` | Login with email/password |
| POST | `/api/google-login` | Login or register via Google OAuth |
| GET | `/api/tokenVerify` | Verify JWT and return user + chats |
| GET | `/api/getSearchedUser?q=` | Search user by username or email |
| POST | `/api/edit` | Update profile (name, username, email) |

### Chats — `/chat`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/getAllChats` | Get all chats for current user, or create a new one |

### Messages — `/msg`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Send a message |
| GET | `/:chatID` | Get paginated messages (`?before=<messageId>`) |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Client → Server | Register user's socket ID |
| `isTyping` | Client → Server | Notify recipient user is typing |
| `stoppedTyping` | Client → Server | Notify recipient stopped typing |
| `msgsRead` | Client → Server | Mark messages as read |
| `newMessage` | Server → Client | Deliver a new message |
| `newChat` | Server → Client | Notify of a new chat created |
| `typing` | Server → Client | Forward typing indicator |
| `stoppedTyping` | Server → Client | Forward stopped typing |
| `markRead` | Server → Client | Notify messages were read |

## Project Structure

```
├── Config/
│   ├── database.js
│   └── tokenFunctions.js
├── Controllers/
│   ├── chatController.js
│   ├── msgController.js
│   └── userController.js
├── Models/
│   ├── chatModel.js
│   ├── msgModel.js
│   └── userModel.js
├── Routes/
│   ├── chatRoutes.js
│   ├── msgRoutes.js
│   └── userRoutes.js
└── socketio.js
```

## Deployment

Deployed on **Render**. Set the following environment variables in your Render service settings:

```
MONGO_URL=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
PORT=5000
```

Make sure to set the start command to:

```bash
node index.js
```
