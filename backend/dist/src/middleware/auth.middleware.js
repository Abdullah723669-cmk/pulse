"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const prisma_1 = require("../config/prisma");
const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Authentication required. No token provided.' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatar: true,
            },
        });
        if (!user) {
            res.status(401).json({ message: 'User belonging to this token no longer exists.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
exports.authenticateJWT = authenticateJWT;
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    name: true,
                    avatar: true,
                },
            });
            if (user) {
                req.user = user;
            }
        }
    }
    catch {
        // Ignore error for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
