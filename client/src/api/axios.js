import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token and active officer context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('phdms_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const savedUser = localStorage.getItem('phdms_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.id) config.headers['x-officer-id'] = u.id;
        if (u.badge_number) config.headers['x-officer-badge'] = u.badge_number;
      } catch (_) {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize responses and catch authentication drops
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data || {
      success: false,
      message: error.message || 'Network communication error with Police HQ API.',
    };

    if (error.response?.status === 401) {
      console.warn('[API Auth] Session expired or unauthorized. Token cleared.');
      // Optional: window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(errorResponse);
  }
);

export default api;
