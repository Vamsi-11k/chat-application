import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Chat } from './pages/Chat';
import { NotFound } from './pages/NotFound';

export default function App() {
  const { isDark } = useTheme();

  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public Routes */}
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

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Chat />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Global Dynamic Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: isDark ? '#0f172a' : '#ffffff',
              color: isDark ? '#f8fafc' : '#0f172a',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
              fontSize: '13px',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: isDark
                ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.08)'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
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
