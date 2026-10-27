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

// Helper to extract clear, human-readable error messages from any API or network error
export function getErrorMessage(err, fallback = 'Operation failed. Please review your input.') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err.message && typeof err.message === 'string' && err.message.trim() !== '') {
    return err.message;
  }
  if (err.error?.message) {
    return err.error.message;
  }
  if (err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

// Response Interceptor: Normalize responses and catch authentication drops
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    const detailedMessage =
      data?.error?.message ||
      data?.message ||
      error.message ||
      'Network communication error with Police HQ API.';

    const errorResponse = {
      success: false,
      message: detailedMessage,
      error: data?.error || {
        code: `ERR_${error.response?.status || 500}`,
        message: detailedMessage,
      },
      details: data?.error?.details || data?.details || null,
      status: error.response?.status || 500,
      response: error.response, // Preserves backward compatibility with err.response?.data
    };

    if (error.response?.status === 401) {
      console.warn('[API Auth] Session expired or unauthorized. Token cleared.');
    }

    return Promise.reject(errorResponse);
  }
);

export default api;
