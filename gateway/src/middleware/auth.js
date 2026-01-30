const jwt = require('jsonwebtoken');
const config = require('../config');

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  res.status(401).json({ error: 'No token provided', type: 'UnauthorizedError' });
}

module.exports = { optionalAuth, requireAuth };
