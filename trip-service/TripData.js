const express = require('express');
const router = express.Router();
const path = require('path');
const dotenv = require('dotenv');
const Trip = require('./model/Trip_model.js');
const { validateCustomerId, validateDriverId } = require('./utils/validation.js');

dotenv.config({ path: path.resolve(__dirname, '../.env') });


/* ---------------------------------------------------
 * POST /add_trip_data
 * Tạo chuyến đi mới
 * --------------------------------------------------- */
router.post("/add_trip_data", async (req, res) => {
  try {
    const { 
      customer_id, 
      pickup_district, 
      pickup_city, 
      destination_city, 
      destination_district, 
      status_trip ,
      driver_id
    } = req.body;

    console.log('📌 Received trip data:', req.body);

    if (!customer_id || !pickup_district || !pickup_city || 
        !destination_city || !destination_district || !status_trip) 
    {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields'
        }
      });
    }

    // Validate customer_id với user-service
    const isValidCustomer = await validateCustomerId(customer_id);
    if (!isValidCustomer) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CUSTOMER',
          message: 'Customer ID không tồn tại trong hệ thống'
        }
      });
    }

    const newTrip = new Trip({
      customer_id,
      pickup_district,
      pickup_city,
      destination_city,
      destination_district,
      status_trip
    });

    const savedTrip = await newTrip.save();

    return res.status(201).json({
      success: true,
      message: "Trip data added successfully",
      trip_id: savedTrip._id,
      trip: savedTrip
    });

  } catch (err) {
    console.error('❌ Error in /add_trip_data:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});



/* ---------------------------------------------------
 * PATCH /cancel_trip/:trip_id
 * Hủy chuyến
 * --------------------------------------------------- */
router.patch("/cancel_trip", async (req, res) => {
  try {
    const { trip_id } = req.body;

    if (!trip_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields (trip_id)'
        }
      });
    }

    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: trip_id },
      { status_trip: "cancelled" },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(200).json({
      success: true,
      message: "Trip canceled successfully",
      trip: updatedTrip
    });

  } catch (err) {
    console.error('❌ Error in /cancel_trip:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});




/* ---------------------------------------------------
 * PATCH /update_driver
 * Tài xế được gán vào chuyến đi
 * --------------------------------------------------- */
router.patch("/update_driver", async (req, res) => {
  try {
    const { trip_id, driver_id } = req.body;

    if (!trip_id || !driver_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields (trip_id, driver_id)'
        }
      });
    }

    // Validate driver_id với user-service
    const isValidDriver = await validateDriverId(driver_id);
    if (!isValidDriver) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DRIVER',
          message: 'Driver ID không tồn tại trong hệ thống'
        }
      });
    }

    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: trip_id },
      { 
        driver_id: driver_id,
        status_trip: "matched"
      },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      trip: updatedTrip
    });

  } catch (err) {
    console.error('❌ Error in /update_driver:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});



/* ---------------------------------------------------
 * GET /getTripData
 * Lấy chuyến đi đã match theo driver_id
 * --------------------------------------------------- */
router.post("/getTripData", async (req, res) => {
  try {
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required field (driver_id)'
        }
      });
    }

    const trip = await Trip.findOne({
      driver_id: driver_id,
      status_trip: "matched"
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No matched trip found for this driver'
        }
      });
    }

    return res.status(200).json({
  success: true,
  message: "Matched trip data retrieved successfully",
  trip_id: trip._id,
  customer_id: trip.customer_id,
  pickup_district: trip.pickup_district,
  pickup_city: trip.pickup_city,
  destination_city: trip.destination_city,
  destination_district: trip.destination_district
});

  } catch (err) {
    console.error('❌ Error in /getTripData:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

/* ---------------------------------------------------
 * PATCH /assign-driver
 * Tài xế accept trip → cập nhật driver_id và status_trip
 * --------------------------------------------------- */
router.patch("/assign-driver", async (req, res) => {
  try {
    const { trip_id, driver_id } = req.body;
    if (!trip_id || !driver_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields'
        }
      });
    }

    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: trip_id },
      { driver_id, status_trip: "ACCEPTED" },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver assigned and trip accepted",
      trip: updatedTrip
    });

  } catch (err) {
    console.error('❌ Error in /assign-driver:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// API dùng để kiểm tra status trip
router.get("/trips/driver", async (req, res) => {
  try {
    const { driver_id, trip_id } = req.query;

    if (!driver_id || !trip_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields'
        }
      });
    }

   
    const confirmedTrip = await Trip.findOne({
      _id: trip_id,
      driver_id: driver_id,
    });

    if (!confirmedTrip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trip not found or not accepted yet'
        }
      });
    }

    // Chỉ trả về status_trip
    return res.status(200).json({
      success: true,
      status_trip: confirmedTrip.status_trip
    });

  } catch (err) {
    console.error('❌ Error in /trips/driver:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Cập nhật trạng thái hoàn thành chuyến đi và chi phí.
router.patch("/update/completeTrip", async (req, res) => {
    try {
        const { trip_id, bill } = req.body;

        if (!trip_id || !bill) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing trip_id or bill'
                }
            });
        }

        const updatedTrip = await Trip.findByIdAndUpdate(
            trip_id,
            {
                bill: bill,
                status_trip: "completed"
            },
            { new: true }
        );

        if (!updatedTrip) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Trip not found'
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Trip completed successfully",
            trip: updatedTrip
        });

    } catch (err) {
        console.error("❌ Error in TripService /completeTrip:", err);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});


module.exports = router;
