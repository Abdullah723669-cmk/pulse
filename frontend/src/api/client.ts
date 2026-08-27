import axios from 'axios';

// Hardcoded Render backend URL — this is the single source of truth.
// VITE_API_URL in .env.production also sets this, but we hardcode as
// a reliable fallback so the build always points to the correct backend.
const RENDER_BACKEND_URL = 'https://pulse-hbu2.onrender.com';

const baseURL = import.meta.env.VITE_API_URL || RENDER_BACKEND_URL;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout — Render free tier cold starts and media uploads
});

// Attach JWT Token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_token');
  if (token && !token.startsWith('demo-token-')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: if the backend returns HTML (Firebase SPA rewrite), reject it
apiClient.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      return Promise.reject(new Error('Received HTML instead of JSON — backend not reachable.'));
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { baseURL as API_BASE_URL };
