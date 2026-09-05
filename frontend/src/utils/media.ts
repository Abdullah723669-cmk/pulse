import { API_BASE_URL } from '../api/client';
import { MediaItem } from '../types';

// Helper to ensure media URLs (images, videos, attachments) point to a valid absolute URL.
// Handles Cloudinary CDN URLs, legacy /uploads/ paths, data URLs, and blob URLs.

export const getMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs and Blobs (e.g. local preview)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Already an absolute URL — Cloudinary CDN, or any https/http URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Legacy fallback: relative /uploads/ paths served from the backend
  const base = (API_BASE_URL || 'https://pulse-hbu2.onrender.com').replace(/\/+$/, '');
  if (trimmed.includes('/uploads/')) {
    const uploadPath = trimmed.substring(trimmed.indexOf('/uploads/'));
    return `${base}${uploadPath}`;
  }

  // Other relative path
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${cleanPath}`;
};

export const normalizeMediaItem = (item: any): MediaItem | null => {
  if (!item) return null;
  if (typeof item === 'string') {
    const isAudio =
      /\.(mp3|wav|ogg|m4a|aac|flac|weba)$/i.test(item) ||
      /voice-message/i.test(item);
    const isVideo = !isAudio && /\.(mp4|webm|mov|m4v|mkv)$/i.test(item);
    return {
      url: item,
      type: isAudio ? 'audio' : isVideo ? 'video' : 'image',
    };
  }
  if (typeof item === 'object') {
    const rawUrl = item.url || item.src || item.path || '';
    if (!rawUrl) return null;
    const isAudio =
      item.type?.toLowerCase() === 'audio' ||
      /\.(mp3|wav|ogg|m4a|aac|flac|weba)$/i.test(rawUrl) ||
      /voice-message/i.test(rawUrl) ||
      (typeof item.mimetype === 'string' && item.mimetype.startsWith('audio/'));

    const isVideo =
      !isAudio &&
      (item.type?.toLowerCase() === 'video' ||
        /\.(mp4|webm|mov|m4v|mkv)$/i.test(rawUrl) ||
        (typeof item.mimetype === 'string' && item.mimetype.startsWith('video/')) ||
        // Cloudinary video resource type marker (only if not recognized as audio)
        (typeof rawUrl === 'string' && rawUrl.includes('/video/upload/')));

    return {
      url: rawUrl,
      type: isAudio ? 'audio' : isVideo ? 'video' : 'image',
      thumbnail: item.thumbnail,
      filename: item.filename,
      size: item.size,
    };
  }
  return null;
};

export const normalizeMediaList = (mediaList?: any[] | null): MediaItem[] => {
  if (!mediaList || !Array.isArray(mediaList)) return [];
  return mediaList
    .map(normalizeMediaItem)
    .filter((item): item is MediaItem => item !== null && !!item.url);
};
