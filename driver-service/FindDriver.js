// routes/FindDriver.js
const express = require('express');
const router = express.Router();
const path = require('path');
const dotenv = require('dotenv');
const Driver = require('./model/Driver_model.js');
const axios = require("axios");
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || 'http://localhost:3004';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:8001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'uit-go-internal-service-token-change-in-production';

/**
 * Hàm tính khoảng cách (Haversine Formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const toRad = (value) => value * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // khoảng cách theo km
}

/**
 * Hàm tính giá cước tạm tính
 */
function calculateFare(distance_km) {
    const baseFare = 20000; // giá mở cửa
    const first2km = Math.min(distance_km, 2) * 8000;
    const remaining = distance_km > 2 ? (distance_km - 2) * 12000 : 0;

    const price = baseFare + first2km + remaining;

    return Math.round(price / 1000) * 1000; // làm tròn nghìn
}

/**
 * POST /find-driver
 * Tìm tài xế gần vị trí khách hàng bằng MongoDB Geo Index + Tính giá cước
 */
router.post('/find-driver', async (req, res) => {
    try {
        const { 
            customer_id, 
            pickup_lat, 
            pickup_lng, 
            pickup_district, 
            pickup_city,
            destination_lat,
            destination_lng
        } = req.body;

        console.log("📌 Received find-driver request:", req.body);

        // Validate input
        if (
            !customer_id || 
            pickup_lat === undefined || 
            pickup_lng === undefined ||
            destination_lat === undefined ||
            destination_lng === undefined
        ) {
            return res.status(400).json({
                error: 'customer_id, pickup_lat, pickup_lng, destination_lat, destination_lng are required'
            });
        }

        // Tìm tài xế gần nhất trong cùng district + city
        const driver = await Driver.findOne({
            district: pickup_district,
            city: pickup_city,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [pickup_lng, pickup_lat] // LƯU Ý: lng, lat
                    },
                    $maxDistance: 10000
                }
            }
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "No nearby driver found in the same district/city"
            });
        }

        // ============================
        // 👉 TÍNH GIÁ CƯỚC TẠM TÍNH
        // ============================
        const distance_km = calculateDistance(
            pickup_lat,
            pickup_lng,
            destination_lat,
            destination_lng
        );

        const fare_estimate = calculateFare(distance_km);

        // ============================
        // 👉 GỌI USER-SERVICE ĐỂ LẤY THÔNG TIN CHI TIẾT DRIVER
        // ============================
        let driverProfile = null;
        try {
            const userServiceResp = await axios.get(
                `${USER_SERVICE_URL}/api/drivers/${driver.driver_id}/profile/`,
                {
                    headers: {
                        'X-Internal-Service-Token': INTERNAL_SERVICE_TOKEN
                    },
                    timeout: 5000
                }
            );
            driverProfile = userServiceResp.data.data?.driver_profile;
        } catch (error) {
            console.warn("⚠️ User-service unavailable, returning location only:", error.message);
        }

        // ============================
        // 👉 TRẢ VỀ KẾT QUẢ CHO FE
        // ============================
        return res.status(200).json({
            success: true,
            message: "Driver found successfully",
            driver: {
                driver_id: driver.driver_id,
                location: driver.location,
                district: driver.district,
                city: driver.city,
                // Thông tin từ user-service (nếu có)
                ...(driverProfile && {
                    full_name: driverProfile.user?.full_name,
                    phone: driverProfile.user?.phone,
                    vehicle_type: driverProfile.vehicle_type,
                    vehicle_brand: driverProfile.vehicle_brand,
                    vehicle_model: driverProfile.vehicle_model,
                    license_plate: driverProfile.license_plate,
                    approval_status: driverProfile.approval_status,
                    is_online: driverProfile.is_online
                })
            },
            distance_km: parseFloat(distance_km.toFixed(2)),
            fare_estimate
        });

    } catch (err) {
        console.error("❌ Error in /find-driver:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Thực hiện tính toán khoảng cách và chi phí chuyến đi rồi gửi về cho Trip-Service.
router.patch("/complete-trip", async (req, res) => {
    try {
        const { trip_id, pickup_latitude, pickup_longitude, destination_latitude, destination_longitude } = req.body;

        if (!trip_id || !pickup_latitude || !pickup_longitude || !destination_latitude || !destination_longitude) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const distance_km = calculateDistance(
            pickup_latitude, pickup_longitude,
            destination_latitude, destination_longitude
        );

        const bill = calculateFare(distance_km);

        const response = await axios.patch(`${TRIP_SERVICE_URL}/update/completeTrip`, {
            trip_id,
            bill
        });

        return res.status(200).json({
            success: true,
            message: "Trip completed & billed successfully",
            bill,
            distance_km,
            trip: response.data.trip
        });

    } catch (err) {
        console.error("❌ Error in FindDriver /complete-trip:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
module.exports = router;
