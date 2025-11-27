const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const express = require('express');
const axios = require('axios');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const router = express.Router();

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || 'http://localhost:3004';

// POST /api/cancel-trip
router.post("/cancel-trip", async (req, res) => {
  const { trip_id } = req.body;

  if (!trip_id) {
    return res.status(400).json({ error: "Missing required fields (trip_id)" });
  }

  try {
    const response = await axios.patch(`${TRIP_SERVICE_URL}/cancel_trip`, {
      trip_id
    });

    return res.status(200).json({
      success: true,
      message: "Trip canceled successfully",
      trip: response.data
    });

  } catch (error) {
    console.error("❌ Error in /cancel-trip:", error.message);
    return res.status(500).json({
      error: "Service unavailable",
      details: error.message
    });
  }
});


module.exports = router;
