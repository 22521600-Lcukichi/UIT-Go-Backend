const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    driver_id: { type: String, required: true, unique: true },

    // Lưu thông tin vị trí theo GeoJSON
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },

    district: { type: String, required: true },
    city: { type: String, required: true },

    updated_at: { type: Date, default: Date.now }
});

// Index cho phép truy vấn $near
DriverSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Driver", DriverSchema);
