const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Import các module con (route handlers)
const GetDriver = require('./GetDriver.js');
const FindDriver = require('./FindDriver.js');
const SendLocation = require('./SendLocation.js');
const UpdateDriverStatus = require('./UpdateDriverStatus.js');
const connectDB = require('./config/db.js');
// Load biến môi trường
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

connectDB()
  .then(() => console.log('Connected to the database successfully'))
  .catch((error) => console.error('Database connection error:', error));

// Middleware
app.use(cors());
app.use(express.json());

// Gắn router con
app.use(GetDriver);
app.use(FindDriver);
app.use(SendLocation);
app.use(UpdateDriverStatus);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'driver-service',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Driver service is running on port', PORT);
});
