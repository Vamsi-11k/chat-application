import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket/socketHandler.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
await connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      const isAllowed =
        normalized === 'https://chat-application-tau-ashy.vercel.app' ||
        normalized === (process.env.CLIENT_URL || '').trim().replace(/\/$/, '') ||
        normalized.endsWith('.vercel.app') ||
        normalized.includes('localhost') ||
        normalized.includes('127.0.0.1');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Setup Socket events
initSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Chat Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'https://chat-application-tau-ashy.vercel.app'}`);
  console.log(`=========================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});
