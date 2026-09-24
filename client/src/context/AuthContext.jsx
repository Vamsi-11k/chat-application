import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api, {
  setStoredTokens,
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken
} from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('chat_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  const checkAuth = useCallback(async () => {
    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    // If no tokens stored and not in cookie, stop loading
    if (!token && !refreshToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data?.data?.user) {
        const fetchedUser = response.data.data.user;
        setUser(fetchedUser);
        localStorage.setItem('chat_user', JSON.stringify(fetchedUser));
      }
    } catch (error) {
      // If error, axios interceptor already attempted token refresh.
      // If still failed, clear session.
      setUser(null);
      clearStoredTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const loggedUser = response.data?.data?.user;
      const accessToken = response.data?.data?.accessToken;
      const refreshToken = response.data?.data?.refreshToken;

      setStoredTokens({ accessToken, refreshToken, user: loggedUser });
      setUser(loggedUser);
      toast.success(`Welcome back, ${loggedUser.username}!`);
      return { success: true, user: loggedUser };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to login';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      const newUser = response.data?.data?.user;
      const accessToken = response.data?.data?.accessToken;
      const refreshToken = response.data?.data?.refreshToken;

      setStoredTokens({ accessToken, refreshToken, user: newUser });
      setUser(newUser);
      toast.success(`Account created! Welcome, ${newUser.username}!`);
      return { success: true, user: newUser };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to register';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      // ignore network errors on logout
    } finally {
      clearStoredTokens();
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
