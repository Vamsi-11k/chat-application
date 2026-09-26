import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Chat } from './pages/Chat';
import { NotFound } from './pages/NotFound';
import { AmbientBackground } from './components/AmbientBackground';

export default function App() {
  const { isDark, theme } = useTheme();

  const getToastStyle = () => {
    switch (theme) {
      case 'anime':
        return {
          background: '#200c33',
          color: '#fdf2f8',
          border: '1px solid #4c1d78',
          boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.4)'
        };
      case 'nostalgic':
        return {
          background: '#181036',
          color: '#fdf4ff',
          border: '1px solid #3b2875',
          boxShadow: '0 10px 25px -5px rgba(6, 182, 212, 0.4)'
        };
      case 'dark':
        return {
          background: '#072420',
          color: '#f0fdfa',
          border: '1px solid #14423a',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)'
        };
      default:
        return {
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)'
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <AuthProvider>
      <SocketProvider>
        {/* Subtle Ambient Background Layer (Off by default, theme-aware, auto-pausing) */}
        <AmbientBackground />

        <Routes>
          {/* Landing Page Entry Point */}
          <Route path="/" element={<Landing />} />

          {/* Public Authentication Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* Protected Chat App Route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<Chat />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Global Dynamic Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              ...toastStyle,
              fontSize: '13px',
              borderRadius: '12px',
              padding: '12px 16px'
            },
            success: {
              iconTheme: {
                primary: theme === 'anime' ? '#ec4899' : theme === 'nostalgic' ? '#06b6d4' : '#10b981',
                secondary: isDark ? '#0f172a' : '#ffffff'
              }
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: isDark ? '#0f172a' : '#ffffff'
              }
            }
          }}
        />
      </SocketProvider>
    </AuthProvider>
  );
}
