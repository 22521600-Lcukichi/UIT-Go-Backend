const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://user-service:8001',
  DRIVER_SERVICE_URL: process.env.DRIVER_SERVICE_URL || 'http://driver-service:3003',
  TRIP_SERVICE_URL: process.env.TRIP_SERVICE_URL || 'http://trip-service:3004',
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || 'uit-go-internal-service-token-change-in-production',
  REQUEST_TIMEOUT: 10000 // 10 seconds
};

