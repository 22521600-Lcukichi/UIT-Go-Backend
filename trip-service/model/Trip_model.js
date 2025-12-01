const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema ({
    customer_id: { type: String, required: true },
    pickup_district:{type: String, required: true },
    pickup_city:{type: String, required: true },
    destination_city:{type: String, required: true },
    destination_district:{type: String, required: true },
    status_trip: {type: String, required: true},
    driver_id: {type: String, required: false },
    bill: {type: String, required: false }
,})

const Trip = mongoose.model('Trip', TripSchema);

module.exports =Trip