const crypto = require('crypto');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours
const sessions = new Map();

const createToken = () => crypto.randomBytes(32).toString('hex');

const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (!session || session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
};

const createAdminSession = () => {
  cleanupExpiredSessions();
  const token = createToken();
  sessions.set(token, {
    username: ADMIN_USERNAME,
    expiresAt: Date.now() + TOKEN_TTL_MS
  });
  return token;
};

const invalidateAdminSession = (token) => {
  if (token) {
    sessions.delete(token);
  }
};

const verifyAdminCredentials = (username, password) =>
  username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

const requireAdminAuth = (req, res, next) => {
  cleanupExpiredSessions();

  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }

  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token'
    });
  }

  req.admin = { username: session.username, token };
  next();
};

module.exports = {
  createAdminSession,
  invalidateAdminSession,
  verifyAdminCredentials,
  requireAdminAuth
};
