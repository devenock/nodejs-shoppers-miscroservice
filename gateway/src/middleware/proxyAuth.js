/**
 * Public paths that do not require JWT (gateway forwards without validating).
 * All other /api/* require valid JWT (handled by services or we validate here).
 * We validate JWT for protected routes so gateway can return 401 before proxying.
 */
const PUBLIC_PATHS = [
  { method: 'POST', path: '/api/auth/register' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/refresh' },
  { method: 'GET', path: '/api/auth/verify' },
  { method: 'GET', path: '/health' },
];

function isPublic(method, path) {
  return PUBLIC_PATHS.some((p) => p.method === method && path.startsWith(p.path));
}

const jwt = require('jsonwebtoken');
const config = require('../config');

function proxyAuth(req, res, next) {
  if (isPublic(req.method, req.path)) return next();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No token provided', type: 'UnauthorizedError' });
  }
  try {
    jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token', type: 'UnauthorizedError' });
  }
}

module.exports = { proxyAuth };
