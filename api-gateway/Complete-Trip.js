const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const express = require('express');
const axios = require('axios');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const router = express.Router();

const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || 'http://localhost:3003';


// POST /api/complete-trip
router.post("/api/complete-trip", async (req, res) => {
    const { trip_id, pickup_latitude, pickup_longitude, destination_latitude, destination_longitude } = req.body;

    if (!trip_id || pickup_latitude == null || pickup_longitude == null || destination_latitude == null || destination_longitude == null) {
        return res.status(400).json({
            error: "Missing required fields (trip_id, pickup_latitude, pickup_longitude, destination_latitude, destination_longitude)"
        });
    }

    try {
        const response = await axios.patch(`${DRIVER_SERVICE_URL}/complete-trip`, {
            trip_id,
            pickup_latitude,
            pickup_longitude,
            destination_latitude,
            destination_longitude
        });

        return res.status(200).json(response.data);

    } catch (err) {
        console.error("❌ Error in API Gateway /complete-trip:", err.message);
        return res.status(500).json({
            error: "Trip service unavailable",
            details: err.message
        });
    }
});

module.exports = router;