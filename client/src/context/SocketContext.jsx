import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getStoredAccessToken } from '../api/axios';

const SocketContext = createContext(null);

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://chat-application-1xs8.onrender.com';
  }
  return 'http://localhost:5000';
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      const token = getStoredAccessToken();
      const socketUrl = getSocketUrl();

      const newSocket = io(socketUrl, {
        withCredentials: true,
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        // Socket connected
      });

      newSocket.on('user_online', ({ userId }) => {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      });

      newSocket.on('user_offline', ({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      newSocket.on('connect_error', (err) => {
        console.warn('Socket connection warning:', err.message);
      });

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setOnlineUsers(new Set());
    }
  }, [user?._id]);

  const value = {
    socket,
    onlineUsers,
    isUserOnline: (userId) => onlineUsers.has(userId)
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
