"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("./config/env");
const chat_socket_1 = require("./sockets/chat.socket");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// CORS configuration (supports localhost, Firebase app URLs, and custom domains)
const allowedOrigins = [
    ...env_1.ENV.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) ||
            allowedOrigins.some((allowed) => origin.startsWith(allowed)) ||
            origin.endsWith('.web.app') ||
            origin.endsWith('.firebaseapp.com') ||
            origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        return callback(null, true); // Allow all in dev mode for flexibility
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: `${env_1.ENV.MAX_FILE_SIZE_MB}mb` }));
app.use(express_1.default.urlencoded({ extended: true, limit: `${env_1.ENV.MAX_FILE_SIZE_MB}mb` }));
// Serve uploaded files statically
const uploadsPath = path_1.default.resolve(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsPath)) {
    fs_1.default.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsPath));
// Socket.io initialization
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    maxHttpBufferSize: 1e8, // 100 MB for media
});
(0, chat_socket_1.setupChatSocket)(io);
// Health check endpoint for Render
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Pulse Social & Chat Backend',
        environment: env_1.ENV.NODE_ENV,
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/posts', post_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
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
app.use((err, _req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error occurred.',
        error: env_1.ENV.NODE_ENV === 'development' ? err : undefined,
    });
});
const PORT = env_1.ENV.PORT;
server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Pulse API Server running on port ${PORT}`);
    console.log(`⚡ Environment: ${env_1.ENV.NODE_ENV}`);
    console.log(`💬 Socket.io enabled & listening`);
    console.log(`📁 Uploads served at /uploads`);
    console.log(`=========================================`);
});
