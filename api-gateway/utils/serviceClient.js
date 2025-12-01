const axios = require('axios');
const { USER_SERVICE_URL, REQUEST_TIMEOUT } = require('../config/services');

/**
 * Helper function để gọi User Service
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {string} endpoint - API endpoint (ví dụ: '/api/auth/register/')
 * @param {object} options - { data, headers, params }
 * @returns {Promise} Axios response
 */
const callUserService = async (method, endpoint, options = {}) => {
  const { data, headers = {}, params } = options;

  try {
    const response = await axios({
      method: method.toLowerCase(),
      url: `${USER_SERVICE_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      params,
      timeout: REQUEST_TIMEOUT
    });

    return response;
  } catch (error) {
    // Forward error response từ User Service
    throw {
      status: error.response?.status || 500,
      data: error.response?.data || {
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: 'Lỗi khi gọi User Service'
        }
      }
    };
  }
};

/**
 * Forward request từ client đến User Service
 * Giữ nguyên headers (đặc biệt là Authorization)
 */
const forwardRequest = async (req, res, method, endpoint, includeBody = true) => {
  try {
    const options = {
      headers: {
        ...(req.headers['authorization'] && { 'Authorization': req.headers['authorization'] })
      },
      ...(includeBody && req.body && { data: req.body }),
      ...(req.query && Object.keys(req.query).length > 0 && { params: req.query })
    };

    const response = await callUserService(method, endpoint, options);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.status).json(error.data);
  }
};

module.exports = {
  callUserService,
  forwardRequest
};