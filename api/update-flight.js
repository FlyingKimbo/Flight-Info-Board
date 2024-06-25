const express = require('express');
const bodyParser = require('body-parser');

const app = express();
let flightData = {};  // In-memory storage for flight data

app.use(bodyParser.json());

app.post('/api/update-flight', (req, res) => {
    const { value } = req.body;

    // Check if data is received
    console.log('Received data:', req.body);

    if (value !== undefined) {
        flightData['test'] = { value, timestamp: new Date().toISOString() };
        console.log('Updated flight data:', flightData);
        res.status(200).json({ message: 'Flight data updated successfully' });
    } else {
        console.log('Invalid data received:', req.body);
        res.status(400).json({ message: 'Invalid data' });
    }
});

app.get('/api/update-flight', (req, res) => {
    console.log('Sending flight data:', flightData);
    res.status(200).json(flightData);
});

module.exports = app;
