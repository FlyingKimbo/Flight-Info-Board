

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const flightStateFilePath = path.join(__dirname, 'flight-state.json');

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



