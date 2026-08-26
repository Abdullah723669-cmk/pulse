import { apiClient } from './client';
import { Post, Comment, MediaItem } from '../types';

export const postApi = {
  getFeed: async (page = 1, limit = 15) => {
    const res = await apiClient.get<{ posts: Post[]; page: number; hasMore: boolean }>(
      `/api/posts/feed?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getUserPosts: async (username: string, type: 'posts' | 'media' | 'likes' = 'posts') => {
    const res = await apiClient.get<{ posts: Post[] }>(`/api/posts/user/${username}?type=${type}`);
    return res.data;
  },

  createPost: async (data: { content: string; media: MediaItem[] }) => {
    const res = await apiClient.post<{ message: string; post: Post }>('/api/posts', data);
    return res.data;
  },

  likePost: async (postId: string) => {
    const res = await apiClient.post<{ message: string; isLiked: boolean; likesCount: number }>(
      `/api/posts/${postId}/like`
    );
    return res.data;
  },

  getComments: async (postId: string) => {
    const res = await apiClient.get<{ comments: Comment[] }>(`/api/posts/${postId}/comments`);
    return res.data;
  },

  addComment: async (postId: string, content: string) => {
    const res = await apiClient.post<{ message: string; comment: Comment }>(`/api/posts/${postId}/comments`, {
      content,
    });
    return res.data;
  },

  deletePost: async (postId: string) => {
    const res = await apiClient.delete<{ message: string }>(`/api/posts/${postId}`);
    return res.data;
  },
};
