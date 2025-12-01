const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/services');

/**
 * Middleware xác thực JWT token
 * Sử dụng: app.use('/api/protected-route', authenticateToken, handler)
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token không được cung cấp'
      }
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Token không hợp lệ hoặc đã hết hạn'
        }
      });
    }
    req.user = user; // Lưu thông tin user vào request
    next();
  });
};

module.exports = {
  authenticateToken
};