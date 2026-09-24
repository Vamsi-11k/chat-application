import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateAccessToken = (userId) => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access_default_secret_key_123';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '15m'
  });
};

export const generateRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh_default_secret_key_123';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d'
  });
};

export const getCookieOptions = (isRefresh = false) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: isRefresh ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000 // 7 days or 15 mins
  };
};

export const hashToken = async (token) => {
  return await bcrypt.hash(token, 10);
};

export const compareToken = async (token, hashedToken) => {
  return await bcrypt.compare(token, hashedToken);
};
