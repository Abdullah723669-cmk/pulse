# Pulse — Social Feed & Follower-Gated Real-Time Chat App

A full-stack social networking and messaging platform featuring rich media sharing (text, high-resolution photos, and HTML5 video streaming) with direct chat strictly gated by follower relationships.

Designed for deployment on:
- **Frontend**: [Firebase Hosting](https://firebase.google.com/docs/hosting)
- **Backend API & WebSockets**: [Render](https://render.com/)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)

---

## 🌟 Key Features

1. **Follower-Gated Direct Messaging**:
   - Users can only direct message creators they follow or who follow them.
   - Live locked state with a 1-click Follow button to unlock conversations.
   - Real-time instant messaging via Socket.io.
   - Live typing indicators ("Sarah is typing...").
   - Real-time online/offline presence tracking.
   - Message read status ticks (sent vs read).
   - Rich media attachments inside messages (images and video player).

2. **Rich Media Social Feed**:
   - Timeline composer supporting text, multiple images, and video clips (MP4/WebM/MOV).
   - Responsive custom HTML5 video player with mute/unmute, progress seek, and fullscreen.
   - Image gallery with full-resolution Lightbox viewer.
   - Instant like animations with live counter.
   - Threaded comment section with real-time updates.

3. **User Profiles**:
   - Custom avatar and cover banner photos.
   - Editable bio, location, and website links.
   - Dynamic counters for Posts, Followers, and Following.
   - Interactive Follow / Unfollow actions with real-time state synchronization.
   - Followers & Following modal viewer.
   - Profile tabs: *Posts*, *Media (Photos & Clips)*, and *Likes*.

4. **Explore & Notifications**:
   - Instant search for creators and hashtags.
   - Activity notification stream for new follows, likes, comments, and messages.

---

## 🛠️ Project Structure

```
ChatApp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL Neon database schema
│   │   └── seed.ts             # Rich demo seed script (4 users, posts, chats)
│   ├── src/
│   │   ├── config/             # Environment & Prisma client instances
│   │   ├── controllers/        # Auth, User, Post, Chat, Upload, Notification
│   │   ├── middleware/         # JWT Auth & Multer upload handlers
│   │   ├── routes/             # REST API routes
│   │   ├── sockets/            # Socket.io real-time chat & presence engine
│   │   └── server.ts           # Express HTTP + WebSocket server
│   ├── render.yaml             # Render deployment configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API endpoints
│   │   ├── components/
│   │   │   ├── chat/           # ConversationList, ChatWindow, MessageBubble, ChatInput
│   │   │   ├── feed/           # CreatePostCard, PostCard, VideoPlayer
│   │   │   ├── layout/         # Sidebar, RightBar, MainLayout
│   │   │   ├── profile/        # ProfileHeader, EditProfileModal, FollowListModal
│   │   │   └── ui/             # MediaLightbox, Modals
│   │   ├── context/            # AuthContext, SocketContext, ChatContext
│   │   ├── pages/              # Feed, Profile, Chat, Explore, Notifications, Login, Register
│   │   └── index.css           # Modern Tailwind theme with dark mode
│   ├── firebase.json           # Firebase Hosting configuration
│   ├── .firebaserc             # Firebase project definition
│   └── package.json
└── README.md
```

---

## 🚀 Deployment Guide

### 1. Database Deployment (Neon PostgreSQL)
1. Go to [neon.tech](https://neon.tech/) and create a free PostgreSQL project (e.g. `pulse-db`).
2. In the Neon Dashboard, copy your connection details:
   - **Pooled connection string** (use for `DATABASE_URL`):
     `postgresql://user:password@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - **Direct connection string** (use for `DIRECT_URL`):
     `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. Run the initial database push & seed:
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:push
   npm run prisma:seed
   ```

---

### 2. Backend Deployment (Render)
1. Push your repository to GitHub or GitLab.
2. Sign in to [Render](https://render.com/) and click **New +** -> **Web Service**.
3. Connect your repository.
4. Set the following configuration:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run start`
5. In the **Environment Variables** section, add:
   - `DATABASE_URL`: *(Your Neon pooled connection string)*
   - `DIRECT_URL`: *(Your Neon direct connection string)*
   - `JWT_SECRET`: *(A long random secret string)*
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `https://your-app.web.app,https://your-app.firebaseapp.com`
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**. Render will assign a public URL (e.g. `https://pulse-backend-api.onrender.com`).

---

### 3. Frontend Deployment (Firebase Hosting)
1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to Firebase:
   ```bash
   firebase login
   ```
3. Initialize or link your Firebase project:
   ```bash
   cd frontend
   firebase use --add
   ```
   *(Select your Firebase project ID)*
4. Configure your Render backend URL in `frontend/.env`:
   ```env
   VITE_API_URL=https://pulse-backend-api.onrender.com
   VITE_SOCKET_URL=https://pulse-backend-api.onrender.com
   ```
5. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
6. Your social chat app is now live with global CDN caching and SSL!

---

## 💻 Local Development Setup

### Backend Setup:
```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```
*Backend runs on `http://localhost:5000`*

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 👥 Demo Accounts (Seeded)

| Account | Email | Password | Role & Highlights |
|---|---|---|---|
| **Alex Rivera** | `alex@example.com` | `password123` | Full-stack creator & UI engineer (Mutual with Sarah) |
| **Sarah Chen** | `sarah@example.com` | `password123` | Senior Product Designer (Mutual with Alex) |
| **David Miller** | `david@example.com` | `password123` | Filmmaker & drone pilot (Follows Alex) |
| **Elena Rostova** | `elena@example.com` | `password123` | 3D artist & motion designer (Test locked chat) |
# pulse
