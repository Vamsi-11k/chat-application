import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Trust reverse proxy for HTTPS (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Allowed origins
const allowedOrigins = [
  'https://chat-application-tau-ashy.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
];

if (process.env.CLIENT_URL) {
  const normalized = process.env.CLIENT_URL.trim().replace(/\/$/, '');
  if (!allowedOrigins.includes(normalized)) {
    allowedOrigins.push(normalized);
  }
}

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app') ||
        normalizedOrigin.includes('localhost') ||
        normalizedOrigin.includes('127.0.0.1');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'x-refresh-token'
    ],
    exposedHeaders: ['set-cookie']
  })
);

// Body Parsers & Cookie Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat Application API is running smoothly',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
