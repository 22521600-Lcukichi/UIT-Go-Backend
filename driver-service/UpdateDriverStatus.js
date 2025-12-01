const express = require('express');
const router = express.Router();
const path = require('path');
const dotenv = require('dotenv');
const Driver = require('./model/Driver_model.js');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'uit-go-internal-service-token-change-in-production';

/**
 * Middleware xác thực Internal Service Token
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

/**
 * PUT /api/drivers/:driver_id/status
 * Cập nhật trạng thái online/offline của driver từ user-service
 */
router.put('/api/drivers/:driver_id/status', verifyInternalServiceToken, async (req, res) => {
  try {
    const { driver_id } = req.params;
    const { is_online, vehicle_type, latitude, longitude } = req.body;

    if (is_online === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'is_online là bắt buộc'
        }
      });
    }

    // Nếu driver online và có location, cập nhật location
    if (is_online && latitude !== undefined && longitude !== undefined) {
      const updatedDriver = await Driver.findOneAndUpdate(
        { driver_id: driver_id },
        {
          driver_id,
          location: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          updated_at: new Date()
        },
        {
          new: true,
          upsert: true
        }
      );

      return res.json({
        success: true,
        message: "Driver status updated successfully",
        driver: updatedDriver
      });
    } else if (!is_online) {
      // Nếu driver offline, có thể xóa location hoặc giữ nguyên
      // Ở đây ta chỉ trả về success
      return res.json({
        success: true,
        message: "Driver status updated to offline",
        driver_id: driver_id
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Khi is_online = true, latitude và longitude là bắt buộc'
      }
    });

  } catch (err) {
    console.error("❌ Error in /api/drivers/:driver_id/status:", err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

module.exports = router;

