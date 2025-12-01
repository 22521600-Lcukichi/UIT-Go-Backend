const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:8001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'uit-go-internal-service-token-change-in-production';

/**
 * Validate customer_id với user-service
 */
const validateCustomerId = async (customer_id) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/api/auth/${customer_id}/`,
      {
        headers: {
          'X-Internal-Service-Token': INTERNAL_SERVICE_TOKEN
        },
        timeout: 5000
      }
    );
    return response.data.success === true;
  } catch (error) {
    console.error('Error validating customer_id:', error.message);
    return false;
  }
};

/**
 * Validate driver_id với user-service
 */
const validateDriverId = async (driver_id) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/api/drivers/${driver_id}/profile/`,
      {
        headers: {
          'X-Internal-Service-Token': INTERNAL_SERVICE_TOKEN
        },
        timeout: 5000
      }
    );
    return response.data.success === true;
  } catch (error) {
    console.error('Error validating driver_id:', error.message);
    return false;
  }
};

module.exports = {
  validateCustomerId,
  validateDriverId
};

