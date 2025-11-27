const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const axios = require('axios');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const router = express.Router();
const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || 'http://localhost:3003';

/**
 * POST /get_driver_location
 * Lấy vị trí tài xế hiện tại từ driver-service (Frontend xử lý việc polling còn đây chỉ nhận lệnh)
 */
router.post("/get_driver_location", async (req, res) => {
  const { driver_id, trip_id } = req.body;

  if (!driver_id || !trip_id) {
    return res.status(400).json({ error: "Missing required fields: driver_id or trip_id" });
  }

  try {
    // Gọi driver-service, dùng query params
    const response = await axios.get(`${DRIVER_SERVICE_URL}/driver_location`, {
      params: { driver_id, trip_id } // ✅ gửi đúng query params
    });

    const location = response.data;
    console.log("Data Driver Location:", location);

    return res.status(200).json({
      success: true,
      message: "Driver location retrieved successfully",
      location: location
    });

  } catch (error) {
    console.error("❌ Error in /get_driver_location:", error.message);
    return res.status(500).json({
      error: "Service unavailable",
      details: error.message
    });
  }
});

module.exports = router;
