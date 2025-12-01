const { INTERNAL_SERVICE_TOKEN } = require('../config/services');

/**
 * Middleware xác thực Internal Service Token
 * Dùng cho service-to-service communication
 */
const verifyInternalServiceToken = (req, res, next) => {
  const serviceToken = req.headers['x-internal-service-token'] || req.headers['x-service-token'];

  if (!serviceToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Internal service token không được cung cấp'
      }
    });
  }

  if (serviceToken !== INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Internal service token không hợp lệ'
      }
    });
  }

  next();
};

module.exports = {
  verifyInternalServiceToken
};

