import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data?.data?.user) {
          setUser(response.data.data.user);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const loggedUser = response.data?.data?.user;
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
      await api.post('/auth/logout');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout
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
