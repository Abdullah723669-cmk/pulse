"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed for Pulse Social & Chat App...');
    // Clean existing records
    await prisma.notification.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.conversationParticipant.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.postLike.deleteMany({});
    await prisma.bookmark.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.follow.deleteMany({});
    await prisma.user.deleteMany({});
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    // 1. Create Users
    const userAlex = await prisma.user.create({
        data: {
            name: 'Alex Rivera',
            username: 'alex_rivera',
            email: 'alex@example.com',
            password: passwordHash,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
            bio: '🚀 Full-stack engineer & creator. Building high-scale web apps & real-time communication systems. Welcome to my feed!',
            website: 'https://alexrivera.dev',
            location: 'San Francisco, CA',
            isVerified: true,
        },
    });
    const userSarah = await prisma.user.create({
        data: {
            name: 'Sarah Chen',
            username: 'sarah_chen',
            email: 'sarah@example.com',
            password: passwordHash,
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
            coverImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
            bio: '✨ Senior Product Designer & Photographer. Visual storytelling, micro-interactions & sleek dark interfaces.',
            website: 'https://sarahchen.design',
            location: 'Tokyo, Japan',
            isVerified: true,
        },
    });
    const userDavid = await prisma.user.create({
        data: {
            name: 'David Miller',
            username: 'david_miller',
            email: 'david@example.com',
            password: passwordHash,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
            coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
            bio: '🎬 Filmmaker, drone pilot & digital nomad. Sharing cinematic clips and behind-the-scenes production stories.',
            website: 'https://davidmiller.film',
            location: 'Vancouver, Canada',
            isVerified: false,
        },
    });
    const userElena = await prisma.user.create({
        data: {
            name: 'Elena Rostova',
            username: 'elena_art',
            email: 'elena@example.com',
            password: passwordHash,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
            coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
            bio: '🎨 3D Artist, motion designer & shader enthusiast. Exploring generative art and neon aesthetics.',
            website: 'https://elena-art.studio',
            location: 'Berlin, Germany',
            isVerified: true,
        },
    });
    console.log('✅ Created 4 realistic users (password for all: password123)');
    // 2. Create Follow Relationships
    // Alex and Sarah follow each other (MUTUAL FOLLOWERS -> Allowed to Chat!)
    await prisma.follow.create({
        data: { followerId: userAlex.id, followingId: userSarah.id },
    });
    await prisma.follow.create({
        data: { followerId: userSarah.id, followingId: userAlex.id },
    });
    // David follows Alex (Alex does not follow David -> Allowed to Chat as David is follower)
    await prisma.follow.create({
        data: { followerId: userDavid.id, followingId: userAlex.id },
    });
    // Sarah follows Elena (Elena does not follow Alex -> Used to demonstrate Chat Lock on Alex's profile!)
    await prisma.follow.create({
        data: { followerId: userSarah.id, followingId: userElena.id },
    });
    console.log('✅ Created follow relationships (Mutual: Alex & Sarah)');
    // 3. Create Posts with Images and Videos
    const post1 = await prisma.post.create({
        data: {
            authorId: userAlex.id,
            content: 'Just deployed the new real-time architecture with WebSockets, Neon PostgreSQL, and Render! The sub-50ms latency is incredible. What do you all think of the dark glassmorphic design? 🚀🔥 #FullStack #WebDev #Engineering',
            mediaUrls: JSON.stringify([
                {
                    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
                    type: 'image',
                },
            ]),
        },
    });
    const post2 = await prisma.post.create({
        data: {
            authorId: userSarah.id,
            content: 'Morning light in Tokyo ☀️ Captured these architectural frames during my sunrise walk in Shibuya. Minimalism is about removing everything that distracts from the core essence.',
            mediaUrls: JSON.stringify([
                {
                    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80',
                    type: 'image',
                },
                {
                    url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1200&auto=format&fit=crop&q=80',
                    type: 'image',
                },
            ]),
        },
    });
    const post3 = await prisma.post.create({
        data: {
            authorId: userDavid.id,
            content: 'Quick drone flight over the misty mountain ridge earlier today. The dynamic range on this sensor is unreal! Check out the clip below: 🚁🏔️',
            mediaUrls: JSON.stringify([
                {
                    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    type: 'video',
                    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
                },
            ]),
        },
    });
    const post4 = await prisma.post.create({
        data: {
            authorId: userElena.id,
            content: 'New 3D loop experiment rendered in Blender Cycles. Playing with volumetric lighting and iridescent materials. ✨🔮',
            mediaUrls: JSON.stringify([
                {
                    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                    type: 'video',
                    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
                },
            ]),
        },
    });
    console.log('✅ Created posts with rich images and video clips');
    // 4. Create Likes & Comments
    await prisma.postLike.createMany({
        data: [
            { postId: post1.id, userId: userSarah.id },
            { postId: post1.id, userId: userDavid.id },
            { postId: post2.id, userId: userAlex.id },
            { postId: post3.id, userId: userAlex.id },
            { postId: post3.id, userId: userSarah.id },
            { postId: post4.id, userId: userAlex.id },
        ],
    });
    await prisma.comment.createMany({
        data: [
            {
                postId: post1.id,
                userId: userSarah.id,
                content: 'Looks super clean Alex! Love the color palette and responsiveness 👌',
            },
            {
                postId: post1.id,
                userId: userDavid.id,
                content: 'Incredible speed! Would love to see a tutorial on your Socket.io setup.',
            },
            {
                postId: post3.id,
                userId: userElena.id,
                content: 'That mountain mist shot is breathtaking David! What camera setup did you use?',
            },
        ],
    });
    // 5. Create Initial Conversation & Messages between Alex and Sarah
    const conversation = await prisma.conversation.create({
        data: {
            participants: {
                create: [{ userId: userAlex.id }, { userId: userSarah.id }],
            },
        },
    });
    await prisma.message.createMany({
        data: [
            {
                conversationId: conversation.id,
                senderId: userSarah.id,
                text: 'Hey Alex! Loved your latest post on the new real-time architecture 🎉',
                isRead: true,
                createdAt: new Date(Date.now() - 1000 * 60 * 60),
            },
            {
                conversationId: conversation.id,
                senderId: userAlex.id,
                text: 'Thanks Sarah! Really appreciate the feedback. How is the new UI project going?',
                isRead: true,
                createdAt: new Date(Date.now() - 1000 * 60 * 30),
            },
            {
                conversationId: conversation.id,
                senderId: userSarah.id,
                text: 'Going great! We just finished the follower-gated messaging prototypes. Look at this preview:',
                mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
                mediaType: 'image',
                isRead: true,
                createdAt: new Date(Date.now() - 1000 * 60 * 10),
            },
            {
                conversationId: conversation.id,
                senderId: userAlex.id,
                text: 'That looks stunning! The contrast and glow are on point 🔥',
                isRead: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 2),
            },
        ],
    });
    console.log('✅ Created initial chat conversation and messages');
    console.log('🎉 Seed complete!');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
