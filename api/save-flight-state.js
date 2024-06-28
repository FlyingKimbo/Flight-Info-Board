// /api/save-flight-state.js

const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

app.use(express.json());

const flightStateFilePath = path.join(__dirname, 'flight-state.json');

app.post('/api/save-flight-state', (req, res) => {
    const flightData = req.body.flightData;

    fs.writeFile(flightStateFilePath, JSON.stringify(flightData), err => {
        if (err) {
            console.error('Error saving flight state:', err);
            return res.status(500).send('Failed to save flight state');
        }
        res.send('Flight state saved successfully');
    });
});

module.exports = app;
