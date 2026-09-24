import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getCookieOptions,
  hashToken,
  compareToken
} from '../utils/generateTokens.js';

export const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new ApiError(400, 'Email is already in use');
    }
    if (existingUser.username === username.toLowerCase()) {
      throw new ApiError(400, 'Username is already taken');
    }
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const hashedRefreshToken = await hashToken(refreshToken);
  user.refreshToken = hashedRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', accessToken, getCookieOptions(false));
  res.cookie('refreshToken', refreshToken, getCookieOptions(true));

  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    avatarColor: user.avatarColor,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt
  };

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userResponse,
      accessToken
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const hashedRefreshToken = await hashToken(refreshToken);
  user.refreshToken = hashedRefreshToken;
  user.isOnline = true;
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', accessToken, getCookieOptions(false));
  res.cookie('refreshToken', refreshToken, getCookieOptions(true));

  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    avatarColor: user.avatarColor,
    isOnline: true,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      accessToken
    }
  });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      refreshToken: null,
      isOnline: false,
      lastSeen: new Date()
    });
  }

  res.clearCookie('accessToken', getCookieOptions(false));
  res.clearCookie('refreshToken', getCookieOptions(true));

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null
  });
});

export const refresh = asyncHandler(async (req, res) => {
  let refreshToken = req.cookies?.refreshToken;

  if (!refreshToken && req.body?.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing. Please log in again.');
  }

  let decoded;
  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh_default_secret_key_123';
    decoded = jwt.verify(refreshToken, refreshSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || !user.refreshToken) {
    throw new ApiError(401, 'Invalid session. Please log in again.');
  }

  const isTokenMatch = await compareToken(refreshToken, user.refreshToken);
  if (!isTokenMatch) {
    // Refresh token reuse detected or invalid: invalidate existing stored token
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(401, 'Token verification failed. Please log in again.');
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = await hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', newAccessToken, getCookieOptions(false));
  res.cookie('refreshToken', newRefreshToken, getCookieOptions(true));

  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    avatarColor: user.avatarColor,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt
  };

  res.status(200).json({
    success: true,
    message: 'Tokens refreshed successfully',
    data: {
      user: userResponse,
      accessToken: newAccessToken
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: req.user
    }
  });
});
