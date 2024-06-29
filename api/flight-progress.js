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

        // If the file is empty, respond with an empty array
        if (data.trim() === '') {
            return res.json([]);
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            console.error('Error parsing saved flight state:', parseError);
            res.status(500).send('Failed to parse saved flight state');
        }
    });
});

module.exports = app;
