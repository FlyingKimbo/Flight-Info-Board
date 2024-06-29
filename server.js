const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'Image' directory
app.use('/Image', express.static(path.join(__dirname, 'public/Image')));

// Serve static files from the 'data' directory
app.use('/data', express.static(path.join(__dirname, 'public/data')));

// API Routes
const updateFlight = require('./api/update-flight');
const flightProgress = require('./api/flight-progress');
app.use('/api/update-flight', updateFlight);
app.use('/api', flightProgress); // Combine both save-flight-state and saved-flight-state in one router

// Define a route to serve your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
