// Helper to ensure media URLs (images, videos, attachments) point to the absolute URL
// whether they are absolute CDN URLs, relative upload paths, or data URLs.

const API_SERVER_URL = 'https://pulse-hbu2.onrender.com';

export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  
  // Already absolute or inline
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  // Relative path uploaded to backend
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_SERVER_URL}${cleanPath}`;
};
