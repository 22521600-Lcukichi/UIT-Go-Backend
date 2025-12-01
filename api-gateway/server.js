const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Import các module con (route handlers)
const GetLocationDriver = require('./GetLocationDriver.js');
const GetLocationCustomer = require('./GetLocationCustomer.js');
const GetLocation = require('./GetDriverLocation.js');
const CancelTrip = require('./CancelTrip.js');
const CompleteTrip = require('./Complete-Trip.js');
// Load biến môi trường
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import User Service routes
const authRoutes = require('./routes/authRoutes.js');
const driverRoutes = require('./routes/driverRoutes.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// Trip & Driver Service Routes (Existing)
// ==========================================
app.use(GetLocationDriver);    // /api/get-data-location (tài xế)
app.use(GetLocationCustomer);  // /api/get-data-location-customer (khách hàng)
app.use(GetLocation);
app.use(CancelTrip);
app.use(CompleteTrip);

// ==========================================
// User Service Routes (New)
// ==========================================
app.use(authRoutes);      // /api/auth/*
app.use(driverRoutes);    // /api/drivers/*

// ==========================================
// Health Check
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// Error Handling
// ==========================================
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Lỗi nội bộ của API Gateway'
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 User Service routes: /api/auth/*, /api/drivers/*`);
});
