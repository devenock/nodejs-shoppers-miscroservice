const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('common');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next(new UnauthorizedError('No token provided'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
}

module.exports = { authenticate };