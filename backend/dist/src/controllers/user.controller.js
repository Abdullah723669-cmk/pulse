"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestedUsers = exports.searchUsers = exports.getFollowing = exports.getFollowers = exports.unfollowUser = exports.followUser = exports.getUserProfile = void 0;
const prisma_1 = require("../config/prisma");
const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user?.id;
        const user = await prisma_1.prisma.user.findUnique({
            where: { username: username.toLowerCase() },
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
        let isFollowing = false;
        let isFollower = false; // Does this user follow the current logged-in user?
        let canChat = false;
        if (currentUserId && currentUserId !== user.id) {
            const followRelations = await prisma_1.prisma.follow.findMany({
                where: {
                    OR: [
                        { followerId: currentUserId, followingId: user.id }, // Current user follows profile user
                        { followerId: user.id, followingId: currentUserId }, // Profile user follows current user
                    ],
                },
            });
            isFollowing = followRelations.some((f) => f.followerId === currentUserId && f.followingId === user.id);
            isFollower = followRelations.some((f) => f.followerId === user.id && f.followingId === currentUserId);
            // Follower-gated messaging rule:
            // A user can message another user if they are mutual followers OR if the recipient is followed by the sender
            canChat = isFollowing || isFollower;
        }
        else if (currentUserId === user.id) {
            canChat = true;
        }
        const { password: _, _count, ...userData } = user;
        res.json({
            user: {
                ...userData,
                followersCount: _count.followers,
                followingCount: _count.following,
                postsCount: _count.posts,
                isFollowing,
                isFollower,
                isMutual: isFollowing && isFollower,
                canChat,
            },
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Error retrieving user profile.', error: error.message });
    }
};
exports.getUserProfile = getUserProfile;
const followUser = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;
        if (targetUserId === currentUserId) {
            res.status(400).json({ message: 'You cannot follow yourself.' });
            return;
        }
        const targetUser = await prisma_1.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            res.status(404).json({ message: 'Target user not found.' });
            return;
        }
        // Check if already following
        const existingFollow = await prisma_1.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
        });
        if (existingFollow) {
            res.status(400).json({ message: 'You are already following this user.' });
            return;
        }
        // Create follow
        await prisma_1.prisma.follow.create({
            data: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        });
        // Create Notification
        await prisma_1.prisma.notification.create({
            data: {
                recipientId: targetUserId,
                actorId: currentUserId,
                type: 'FOLLOW',
            },
        });
        // Check mutual status
        const reverseFollow = await prisma_1.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: targetUserId,
                    followingId: currentUserId,
                },
            },
        });
        const isMutual = !!reverseFollow;
        res.json({
            message: `You are now following @${targetUser.username}!`,
            isFollowing: true,
            isMutual,
            canChat: true,
        });
    }
    catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ message: 'Error following user.', error: error.message });
    }
};
exports.followUser = followUser;
const unfollowUser = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;
        const existingFollow = await prisma_1.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
        });
        if (!existingFollow) {
            res.status(400).json({ message: 'You are not following this user.' });
            return;
        }
        await prisma_1.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
        });
        // Check if target user still follows current user
        const reverseFollow = await prisma_1.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: targetUserId,
                    followingId: currentUserId,
                },
            },
        });
        res.json({
            message: 'Unfollowed successfully.',
            isFollowing: false,
            isMutual: false,
            canChat: !!reverseFollow,
        });
    }
    catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ message: 'Error unfollowing user.', error: error.message });
    }
};
exports.unfollowUser = unfollowUser;
const getFollowers = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id;
        const followers = await prisma_1.prisma.follow.findMany({
            where: { followingId: id },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        isVerified: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        let followingIds = [];
        if (currentUserId) {
            const myFollowings = await prisma_1.prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true },
            });
            followingIds = myFollowings.map((f) => f.followingId);
        }
        const formatted = followers.map((f) => ({
            ...f.follower,
            isFollowing: followingIds.includes(f.follower.id),
            followedAt: f.createdAt,
        }));
        res.json({ followers: formatted });
    }
    catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Error retrieving followers.', error: error.message });
    }
};
exports.getFollowers = getFollowers;
const getFollowing = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id;
        const following = await prisma_1.prisma.follow.findMany({
            where: { followerId: id },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        isVerified: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        let currentFollowingIds = [];
        if (currentUserId) {
            const myFollowings = await prisma_1.prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true },
            });
            currentFollowingIds = myFollowings.map((f) => f.followingId);
        }
        const formatted = following.map((f) => ({
            ...f.following,
            isFollowing: currentFollowingIds.includes(f.following.id),
            followedAt: f.createdAt,
        }));
        res.json({ following: formatted });
    }
    catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Error retrieving following list.', error: error.message });
    }
};
exports.getFollowing = getFollowing;
const searchUsers = async (req, res) => {
    try {
        const query = (req.query.q || '').toLowerCase().trim();
        const currentUserId = req.user?.id;
        if (!query) {
            res.json({ users: [] });
            return;
        }
        const users = await prisma_1.prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 20,
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                bio: true,
                isVerified: true,
                _count: {
                    select: {
                        followers: true,
                    },
                },
            },
        });
        let followingIds = [];
        if (currentUserId) {
            const myFollowings = await prisma_1.prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true },
            });
            followingIds = myFollowings.map((f) => f.followingId);
        }
        const formatted = users.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            avatar: u.avatar,
            bio: u.bio,
            isVerified: u.isVerified,
            followersCount: u._count.followers,
            isFollowing: followingIds.includes(u.id),
        }));
        res.json({ users: formatted });
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Error searching users.', error: error.message });
    }
};
exports.searchUsers = searchUsers;
const getSuggestedUsers = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        let excludeIds = [];
        if (currentUserId) {
            excludeIds.push(currentUserId);
            const myFollowings = await prisma_1.prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true },
            });
            excludeIds.push(...myFollowings.map((f) => f.followingId));
        }
        const suggested = await prisma_1.prisma.user.findMany({
            where: {
                id: { notIn: excludeIds },
            },
            take: 5,
            orderBy: {
                followers: {
                    _count: 'desc',
                },
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                bio: true,
                isVerified: true,
                _count: {
                    select: {
                        followers: true,
                    },
                },
            },
        });
        const formatted = suggested.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            avatar: u.avatar,
            bio: u.bio,
            isVerified: u.isVerified,
            followersCount: u._count.followers,
            isFollowing: false,
        }));
        res.json({ users: formatted });
    }
    catch (error) {
        console.error('Suggested users error:', error);
        res.status(500).json({ message: 'Error retrieving suggestions.', error: error.message });
    }
};
exports.getSuggestedUsers = getSuggestedUsers;
