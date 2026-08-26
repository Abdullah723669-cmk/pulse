import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, ENV.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const existingUser = await prisma.user.findFirst({
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
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
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loginOrEmail, password } = req.body;

    if (!loginOrEmail || !password) {
      res.status(400).json({ message: 'Email/Username and password are required.' });
      return;
    }

    const cleanInput = loginOrEmail.toLowerCase().trim();

    const user = await prisma.user.findFirst({
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

    const isMatch = await bcrypt.compare(password, user.password);
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
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
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
  } catch (error: any) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error fetching user profile.', error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const { name, bio, website, location, avatar, coverImage } = req.body;

    const updatedUser = await prisma.user.update({
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
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
};
