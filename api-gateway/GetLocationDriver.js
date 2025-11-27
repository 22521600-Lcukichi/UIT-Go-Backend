const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const router = express.Router();

const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || 'http://localhost:3003';
const TRIP_SERVICE_URL   = process.env.TRIP_SERVICE_URL   || 'http://localhost:3004';

/**
 * =====================================================================
 *  TÀI XẾ GỬI VỊ TRÍ HIỆN TẠI → DRIVER-SERVICE
 *  SAU ĐÓ API GATEWAY LẤY TRIP MATCH TỪ TRIP-SERVICE
 * =====================================================================
 */
router.post('/api/get-data-location', async (req, res) => {
  const { driver_id, latitude, longitude, district, city } = req.body;

  console.log("📌 Received location data:", req.body);

  // Validate input
  if (!driver_id || latitude == null || longitude == null || !district || !city) {
    return res.status(400).json({
      error: 'Missing required fields (driver_id, latitude, longitude, district, city)'
    });
  }

  try {
    // 1️⃣ Forward location to DriverService
    const driverResp = await axios.post(`${DRIVER_SERVICE_URL}/charge`, {
      driver_id,
      latitude,
      longitude,
      district,
      city
    });

    // 2️⃣ Check if there is a matched trip
    const tripResp = await axios
      .post(`${TRIP_SERVICE_URL}/getTripData`, { driver_id })
      .catch(() => ({ data: null }));

    const trip = tripResp?.data || null;
    const trip_id = trip ? trip._id : null;

    if (trip) console.log("Matched trip data:", trip);

    // 3️⃣ Get status trip (EX: searching, accepted, pickup, moving...)


 if (!trip_id) {
    console.log("⛔ Chuyến đi không tồn tại hoặc đã bị hủy !!!.");

    return res.status(200).json({
      success: false,
      status_trip: "cancelled",
      message: "Trip has been cancelled. Stop sending location."
    });
  }



    // 4️⃣ Return response about driver + matched trip
    return res.status(200).json({
      success: true,
      driver_status: driverResp.data,
      status_trip: status_trip,
      matched_trip: trip
        ? {
            trip_id: trip._id,
            customer_id: trip.customer_id,
            pickup_district: trip.pickup_district,
            pickup_city: trip.pickup_city,
            destination_city: trip.destination_city,
            destination_district: trip.destination_district
          }
        : null
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({
      error: "Service unavailable",
      details: error.message
    });
  }
});


/**
 * =====================================================================
 *  TÀI XẾ NHẤN "ACCEPT" TRIP
 * =====================================================================
 */
router.post('/api/DriverAcceptTrip', async (req, res) => {
  const { driver_id, trip_id } = req.body;

  if (!driver_id || !trip_id)
    return res.status(400).json({ error: "Missing driver_id or trip_id" });

  try {
    // Notify trip-service
    const response = await axios.patch(`${TRIP_SERVICE_URL}/assign-driver`, {
      driver_id,
      trip_id
    });

    return res.status(200).json({
      success: true,
      message: "Trip accepted successfully",
      trip: response.data
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
