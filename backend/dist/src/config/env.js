"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.ENV = {
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    DIRECT_URL: process.env.DIRECT_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'pulse_fallback_secret_key_change_me_in_prod',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB ? parseInt(process.env.MAX_FILE_SIZE_MB, 10) : 50
};
