const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const express = require('express');
const axios = require('axios');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || 'http://localhost:3003';
const TRIP_SERVICE_URL   = process.env.TRIP_SERVICE_URL   || 'http://localhost:3004';

// POST /api/get-data-location-customer
app.post('/api/get-data-location-customer', async (req, res) => {
  const {
    customer_id,
    pickup_lat,
    pickup_lng,
    pickup_district,
    pickup_city,
    destination_city,
    destination_district,
    destination_lat,
    destination_lng,
    status_trip
  } = req.body;

  // Validate input
  if (!customer_id || !pickup_lat || !pickup_lng || !pickup_district || !pickup_city || !destination_city || !destination_district) {
    return res.status(400).json({ error: 'Missing required fields (customer_id, pickup_lat, pickup_lng, pickup_district, pickup_city, destination_city, destination_district)' });
  }
  

  try {
    // 1️⃣ Tạo Trip mới trước -> lấy trip_id
    const createTrip = await axios.post(`${TRIP_SERVICE_URL}/add_trip_data`, {
      customer_id,
      pickup_district,
      pickup_city,
      destination_city,
      destination_district,
      status_trip: status_trip || 'searching' 
    });

    const trip_id = createTrip.data.trip_id;
    console.log("trip_id:", trip_id);
    // Gửi request tới Driver-service
const driverResp = await axios.post(`${DRIVER_SERVICE_URL}/find-driver`, {
  customer_id, 
  pickup_lat, 
  pickup_lng, 
  pickup_district, 
  pickup_city,
  destination_lat,
  destination_lng
});

// driverResp.data chứa JSON trả về từ Driver-service trả về các thông tin như khoảng cách, phí và thông tin tài xế.
const driver_id = driverResp.data.driver.driver_id;
const fare_estimate = driverResp.data.fare_estimate;
const distance_km = driverResp.data.distance_km;
console.log("driver_id:", driver_id);
console.log("fare_estimate:", fare_estimate);
console.log("distance_km:", distance_km);


    // 3️⃣ Cập nhật thông tin driver_id và trạng thái match vào Trip
    await axios.patch(`${TRIP_SERVICE_URL}/update_driver`, {
      trip_id,
      driver_id
    });


    // 4️⃣ Trả về FE
    return res.status(200).json({
      message: "Trip created successfully",
      trip_id,
      driver_id,
      fare_estimate,
      distance_km
    });

  } catch (error) {
    console.error("❌ Error in /api/get-data-location-customer:", error.message);

    return res.status(500).json({
      error: "Service unavailable",
      details: error.message
    });
  }
});

module.exports = app;
