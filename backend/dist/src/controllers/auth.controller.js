"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, env_1.ENV.JWT_SECRET, { expiresIn: '7d' });
};
const register = async (req, res) => {
    try {
        const { email, username, password, name, avatar, bio } = req.body;
        if (!email || !username || !password || !name) {
            res.status(400).json({ message: 'Name, username, email, and password are required.' });
            return;
        }
        const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
        const cleanEmail = email.toLowerCase().trim();
        if (cleanUsername.length < 3) {
            res.status(400).json({ message: 'Username must be at least 3 characters long and alphanumeric.' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters long.' });
            return;
        }
        // Check existing
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ email: cleanEmail }, { username: cleanUsername }],
            },
        });
        if (existingUser) {
            if (existingUser.email === cleanEmail) {
                res.status(400).json({ message: 'An account with this email already exists.' });
                return;
            }
            res.status(400).json({ message: 'This username is already taken. Please choose another.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: name.trim(),
                username: cleanUsername,
                email: cleanEmail,
                password: hashedPassword,
                avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
                bio: bio || '',
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatar: true,
                coverImage: true,
                bio: true,
                website: true,
                location: true,
                isVerified: true,
                createdAt: true,
            },
        });
        const token = generateToken(user.id);
        res.status(201).json({
            message: 'Account created successfully!',
            token,
            user: {
                ...user,
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { loginOrEmail, password } = req.body;
        if (!loginOrEmail || !password) {
            res.status(400).json({ message: 'Email/Username and password are required.' });
            return;
        }
        const cleanInput = loginOrEmail.toLowerCase().trim();
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ email: cleanInput }, { username: cleanInput }],
            },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    },
                },
            },
        });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials. User not found.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
            return;
        }
        const token = generateToken(user.id);
        const { password: _, _count, ...userData } = user;
        res.json({
            message: 'Logged in successfully!',
            token,
            user: {
                ...userData,
                followersCount: _count.followers,
                followingCount: _count.following,
                postsCount: _count.posts,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        const { password: _, _count, ...userData } = user;
        res.json({
            user: {
                ...userData,
                followersCount: _count.followers,
                followingCount: _count.following,
                postsCount: _count.posts,
            },
        });
    }
    catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: 'Server error fetching user profile.', error: error.message });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const { name, bio, website, location, avatar, coverImage } = req.body;
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name: name.trim() }),
                ...(bio !== undefined && { bio }),
                ...(website !== undefined && { website }),
                ...(location !== undefined && { location }),
                ...(avatar !== undefined && { avatar }),
                ...(coverImage !== undefined && { coverImage }),
            },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    },
                },
            },
        });
        const { password: _, _count, ...userData } = updatedUser;
        res.json({
            message: 'Profile updated successfully!',
            user: {
                ...userData,
                followersCount: _count.followers,
                followingCount: _count.following,
                postsCount: _count.posts,
            },
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile.', error: error.message });
    }
};
exports.updateProfile = updateProfile;
