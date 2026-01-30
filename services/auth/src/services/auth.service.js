const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ValidationError, NotFoundError, UnauthorizedError } = require('common');
const { publish } = require('../events/publishers');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const BCRYPT_ROUNDS = 10;

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

async function register({ email, password, name }) {
  const existing = await User.findOne({ email });
  if (existing) throw new ValidationError('Email already registered');

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ email, password: hashedPassword, name });

  await publish('user.created', {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  });

  const token = signToken({ userId: user._id.toString(), email: user.email });
  return { user: user.toPublic(), token };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const token = signToken({ userId: user._id.toString(), email: user.email });
  return { user: user.toPublic(), token };
}

async function refresh(token) {
  if (!token) throw new UnauthorizedError('Token required');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new NotFoundError('User');
    const newToken = signToken({ userId: user._id.toString(), email: user.email });
    return { user: user.toPublic(), token: newToken };
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid or expired token');
    }
    throw err;
  }
}

async function verify(token) {
  if (!token) return { valid: false };
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    return { valid: !!user, userId: user?._id?.toString() };
  } catch {
    return { valid: false };
  }
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User');
  return user.toPublic();
}

module.exports = { register, login, refresh, verify, getProfile };