import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired or invalid, clear stored session if needed
      // (do not auto-redirect if checking public routes)
    }
    return Promise.reject(error);
  }
);
