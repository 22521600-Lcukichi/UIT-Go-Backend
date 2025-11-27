const express = require('express');
const router = express.Router();
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const Driver = require('./model/Driver_model.js');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || 'http://localhost:3004';

router.get('/driver_location', async (req, res) => {
  const { driver_id, trip_id } = req.query;

  if (!driver_id || !trip_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1️⃣ Lấy trip đã accept
    const tripResp = await axios.get(`${TRIP_SERVICE_URL}/trips/driver`, {
      params: { driver_id, trip_id }
    }).catch(() => ({ data: null }));

    const trip = tripResp.data || {};

    // 2️⃣ Nếu trip đã accept → lấy vị trí tài xế
    let driverLocation = null;
    if (trip.status_trip === 'ACCEPTED') {
      driverLocation = await Driver.findOne({ driver_id }, { location: 1, _id: 0 });
    }

    return res.status(200).json({ 
      success: true, 
      location: driverLocation ? driverLocation.location : null
    });

  } catch (error) {
    console.error("Error in /driver_location:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
