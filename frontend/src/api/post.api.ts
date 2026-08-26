import { apiClient } from './client';
import { Post, Comment, MediaItem } from '../types';
import { DEMO_POSTS } from './demoData';

export const postApi = {
  getFeed: async (page = 1, limit = 15): Promise<{ posts: Post[]; page: number; hasMore: boolean }> => {
    try {
      const res = await apiClient.get<{ posts: Post[]; page: number; hasMore: boolean }>(
        `/api/posts/feed?page=${page}&limit=${limit}`
      );
      if (res.data && Array.isArray(res.data.posts)) {
        return res.data;
      }
      return { posts: DEMO_POSTS, page: 1, hasMore: false };
    } catch {
      return { posts: DEMO_POSTS, page: 1, hasMore: false };
    }
  },

  getUserPosts: async (username: string, type: 'posts' | 'media' | 'likes' = 'posts'): Promise<{ posts: Post[] }> => {
    try {
      const res = await apiClient.get<{ posts: Post[] }>(`/api/posts/user/${username}?type=${type}`);
      if (res.data && Array.isArray(res.data.posts)) {
        return res.data;
      }
      return { posts: DEMO_POSTS.filter((p) => p.author.username === username) };
    } catch {
      return { posts: DEMO_POSTS.filter((p) => p.author.username === username) };
    }
  },

  createPost: async (data: { content: string; media: MediaItem[] }): Promise<{ message: string; post: Post }> => {
    try {
      const res = await apiClient.post<{ message: string; post: Post }>('/api/posts', data);
      return res.data;
    } catch {
      // Local fallback post creation
      const newPost: Post = {
        id: 'post-' + Date.now(),
        content: data.content,
        media: data.media || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 'user-current',
          name: 'You',
          username: 'you',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          isVerified: true,
        },
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        recentComments: [],
      };
      return { message: 'Post created', post: newPost };
    }
  },

  likePost: async (postId: string): Promise<{ message: string; isLiked: boolean; likesCount: number }> => {
    try {
      const res = await apiClient.post<{ message: string; isLiked: boolean; likesCount: number }>(
        `/api/posts/${postId}/like`
      );
      return res.data;
    } catch {
      return { message: 'Liked', isLiked: true, likesCount: 1 };
    }
  },

  getComments: async (postId: string): Promise<{ comments: Comment[] }> => {
    try {
      const res = await apiClient.get<{ comments: Comment[] }>(`/api/posts/${postId}/comments`);
      if (res.data && Array.isArray(res.data.comments)) {
        return res.data;
      }
      return { comments: [] };
    } catch {
      return { comments: [] };
    }
  },

  addComment: async (postId: string, content: string): Promise<{ message: string; comment: Comment }> => {
    try {
      const res = await apiClient.post<{ message: string; comment: Comment }>(`/api/posts/${postId}/comments`, {
        content,
      });
      return res.data;
    } catch {
      const newComment: Comment = {
        id: 'c-' + Date.now(),
        content,
        createdAt: new Date().toISOString(),
        user: {
          id: 'user-current',
          name: 'You',
          username: 'you',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          isVerified: true,
        },
      };
      return { message: 'Comment added', comment: newComment };
    }
  },

  deletePost: async (postId: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.delete<{ message: string }>(`/api/posts/${postId}`);
      return res.data;
    } catch {
      return { message: 'Deleted' };
    }
  },
};
