import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Ensure CSRF cookie is present before any mutating request
api.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    // Fetch CSRF cookie if not already set (Sanctum)
    if (!document.cookie.includes('XSRF-TOKEN')) {
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    }
  }
  return config;
});

export default api;
