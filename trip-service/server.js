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

const PORT = 3004;
app.listen(PORT, () => {
  console.log('Driver service is running on port', PORT);
});
