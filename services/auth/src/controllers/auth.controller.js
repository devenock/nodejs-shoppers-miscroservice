const authService = require('../services/auth.service');
const logger = require('../utils/logger');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.validated);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.validated);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.body.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const result = await authService.refresh(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const result = await authService.verify(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function profile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, verify, profile };