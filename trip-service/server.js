const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Import các module con (route handlers)
const connectDB = require('./config/db.js')
const PostDataTrip = require('./TripData.js')
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
app.use(PostDataTrip);

const PORT = process.env.PORT || 3004;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'trip-service',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Trip service is running on port', PORT);
});
