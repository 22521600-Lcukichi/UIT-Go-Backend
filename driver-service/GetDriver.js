const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const router = express.Router();
const Driver = require(path.join(__dirname, 'model', 'Driver_model.js'));

dotenv.config({ path: path.resolve(__dirname, '.env') });



// ------------------------------------------------------------
// POST /charge
// Lưu hoặc cập nhật vị trí tài xế bằng GeoJSON + 2dsphere index
// ------------------------------------------------------------
router.post('/charge', async (req, res) => {
    try {
        const { driver_id, latitude, longitude, district, city } = req.body;
        console.log('📌 Received driver location:', req.body);

        if (!driver_id || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                error: 'driver_id, latitude, longitude are required'
            });
        }

        // 👉 Lưu vị trí theo GeoJSON
        const updatedDriver = await Driver.findOneAndUpdate(
            { driver_id: driver_id },
            {
                driver_id,
                district,
                city,
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
            message: "Driver location updated via GeoJSON",
            driver: updatedDriver
        });

    } catch (err) {
        console.error("❌ Error in /charge:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
