export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  coverImage?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  isFollower?: boolean;
  isMutual?: boolean;
  canChat?: boolean;
  createdAt?: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'file' | 'audio';
  thumbnail?: string;
  filename?: string;
  size?: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    isVerified?: boolean;
  };
}

export interface Post {
  id: string;
  content: string;
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    isVerified?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  bookmarksCount?: number;
  isLiked: boolean;
  recentComments?: Comment[];
}

export interface ChatPermission {
  canChat: boolean;
  reason?: string;
  isFollowing: boolean;
  isFollower: boolean;
  isMutual: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | 'file' | 'audio' | null;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    isVerified?: boolean;
  };
  lastMessage: {
    id: string;
    text: string | null;
    mediaUrl: string | null;
    mediaType: string | null;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  chatPermission: ChatPermission;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorId: string;
  type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'MESSAGE';
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    isVerified?: boolean;
  };
}
