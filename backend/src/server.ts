import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env';
import { setupChatSocket } from './sockets/chat.socket';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import chatRoutes from './routes/chat.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const server = http.createServer(app);

// CORS configuration (supports localhost, Firebase app URLs, and custom domains)
const allowedOrigins = [
  ...ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.some((allowed) => origin.startsWith(allowed)) ||
        origin.endsWith('.web.app') ||
        origin.endsWith('.firebaseapp.com') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all in dev mode for flexibility
    },
    credentials: true,
  })
);

app.use(express.json({ limit: `${ENV.MAX_FILE_SIZE_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${ENV.MAX_FILE_SIZE_MB}mb` }));

// Serve uploaded files statically
const uploadsPath = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Socket.io initialization
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 1e8, // 100 MB for media
});

setupChatSocket(io);

// Health check endpoint for Render
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Pulse Social & Chat Backend',
    environment: ENV.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Pulse API',
    description: 'Social Feed and Follower-Gated Real-Time Chat API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error occurred.',
      error: ENV.NODE_ENV === 'development' ? err : undefined,
    });
  }
);

const PORT = ENV.PORT;
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Pulse API Server running on port ${PORT}`);
  console.log(`⚡ Environment: ${ENV.NODE_ENV}`);
  console.log(`💬 Socket.io enabled & listening`);
  console.log(`📁 Uploads served at /uploads`);
  console.log(`=========================================`);
});
