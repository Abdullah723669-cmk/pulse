import { apiClient } from './client';
import { MediaItem } from '../types';
import { normalizeMediaItem, normalizeMediaList } from '../utils/media';

export const uploadApi = {
  uploadSingle: async (file: File): Promise<MediaItem> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<any>('/api/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const normalized = normalizeMediaItem(res.data);
    if (!normalized) {
      throw new Error('Invalid response from upload server.');
    }
    return normalized;
  },

  uploadMultiple: async (files: File[]): Promise<MediaItem[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const res = await apiClient.post<any>('/api/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const rawList = Array.isArray(res.data) ? res.data : res.data?.files || [];
    return normalizeMediaList(rawList);
  },
};
