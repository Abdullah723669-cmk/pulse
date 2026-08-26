import { apiClient } from './client';
import { MediaItem } from '../types';

export const uploadApi = {
  uploadSingle: async (file: File): Promise<MediaItem> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<MediaItem>('/api/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  uploadMultiple: async (files: File[]): Promise<MediaItem[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const res = await apiClient.post<{ files: MediaItem[] }>('/api/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.files;
  },
};
