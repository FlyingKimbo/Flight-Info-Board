const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

const flightStateFilePath = path.join(__dirname, 'flight-state.json');

// Endpoint to save flight state
app.post('/api/save-flight-state', (req, res) => {
    const flightData = req.body.flightData;

    fs.writeFile(flightStateFilePath, JSON.stringify(flightData, null, 2), err => {
        if (err) {
            console.error('Error saving flight state:', err);
            return res.status(500).send('Failed to save flight state');
        }
        res.send('Flight state saved successfully');
    });
});

// Endpoint to get saved flight state
app.get('/api/saved-flight-state', (req, res) => {
    fs.readFile(flightStateFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error fetching saved flight state:', err);
            return res.status(500).send('Failed to fetch saved flight state');
        }
        res.json(JSON.parse(data));
    });
});

module.exports = app;
