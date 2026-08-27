import { apiClient } from './client';
import { Post, Comment, MediaItem } from '../types';
import { DEMO_POSTS } from './demoData';

export const postApi = {
  // READ — demo fallback only when backend is truly offline
  getFeed: async (
    page = 1,
    limit = 15,
    tab: 'foryou' | 'following' = 'foryou'
  ): Promise<{ posts: Post[]; page: number; hasMore: boolean }> => {
    try {
      const res = await apiClient.get<{ posts: Post[]; page: number; hasMore: boolean }>(
        `/api/posts/feed?page=${page}&limit=${limit}&tab=${tab}`
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
      return { posts: [] };
    } catch {
      return { posts: [] };
    }
  },

  // WRITES — must always persist to Neon, NO demo fallback
  createPost: async (data: { content: string; media: MediaItem[] }): Promise<{ message: string; post: Post }> => {
    const res = await apiClient.post<{ message: string; post: Post }>('/api/posts', data);
    return res.data;
  },

  likePost: async (postId: string): Promise<{ message: string; isLiked: boolean; likesCount: number }> => {
    const res = await apiClient.post<{ message: string; isLiked: boolean; likesCount: number }>(
      `/api/posts/${postId}/like`
    );
    return res.data;
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
    const res = await apiClient.post<{ message: string; comment: Comment }>(`/api/posts/${postId}/comments`, {
      content,
    });
    return res.data;
  },

  deletePost: async (postId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/api/posts/${postId}`);
    return res.data;
  },
};
