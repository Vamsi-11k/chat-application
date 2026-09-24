import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://chat-application-1xs8.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getStoredAccessToken = () => {
  return localStorage.getItem('chat_access_token');
};

export const getStoredRefreshToken = () => {
  return localStorage.getItem('chat_refresh_token');
};

export const setStoredTokens = ({ accessToken, refreshToken, user }) => {
  if (accessToken) localStorage.setItem('chat_access_token', accessToken);
  if (refreshToken) localStorage.setItem('chat_refresh_token', refreshToken);
  if (user) localStorage.setItem('chat_user', JSON.stringify(user));
};

export const clearStoredTokens = () => {
  localStorage.removeItem('chat_access_token');
  localStorage.removeItem('chat_refresh_token');
  localStorage.removeItem('chat_user');
};

// Request Interceptor: Attach Bearer Token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Auto Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip refresh token logic if error came from auth login/signup/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/signup') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getStoredRefreshToken();

      try {
        const response = await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          { refreshToken },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              ...(refreshToken ? { 'x-refresh-token': refreshToken } : {})
            }
          }
        );

        const newAccessToken = response.data?.data?.accessToken;
        const newRefreshToken = response.data?.data?.refreshToken;
        const user = response.data?.data?.user;

        if (newAccessToken) {
          setStoredTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || refreshToken,
            user
          });
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearStoredTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
