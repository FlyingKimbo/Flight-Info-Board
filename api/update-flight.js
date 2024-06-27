const express = require('express');
const bodyParser = require('body-parser');

const app = express();
let flightData = {};  // In-memory storage for flight data

app.use(bodyParser.json());

app.post('/api/update-flight', (req, res) => {
    const data = req.body;

    // Check if any data is received
    console.log('Received data:', data);

    // Validate received data, assuming CurrentFlight is critical and must be present
    if (data.CurrentFlight) {
        // Create or update the flight data entry
        flightData[data.CurrentFlight] = {
            ...flightData[data.CurrentFlight], // This spreads existing data if any
            ...data, // This overwrites and adds new data
            timestamp: new Date().toISOString()  // Update the timestamp with each change
        };
        console.log('Updated flight data:', flightData);
        res.status(200).json({message: 'Json Flight data updated successfully' });
    } else {
        console.log('Invalid data received:', data);
        res.status(400).json({ message: 'Invalid data' });
    }
});

app.get('/api/update-flight', (req, res) => {
    console.log('Sending flight data:', flightData);
    res.status(200).json(flightData);
});

module.exports = app;

