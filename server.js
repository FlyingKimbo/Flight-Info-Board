const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'Image' directory
app.use('/Image', express.static(path.join(__dirname, 'Image')));

// Serve static files from the 'data' directory
app.use('/data', express.static(path.join(__dirname, 'data')));

// Path to the file where flight state will be saved
const flightStateFilePath = path.join(__dirname, 'api', 'flight-state.json');

// Include the update-flight routes
const updateFlightRouter = require('./api/update-flight');
app.use('/api', updateFlightRouter);

// Endpoint to save flight state
app.post('/api/save-flight-state', (req, res) => {
    const flightData = req.body.flightData;

    fs.writeFile(flightStateFilePath, JSON.stringify(flightData), (err) => {
        if (err) {
            console.error('Error saving flight state:', err);
            return res.status(500).send('Failed to save flight state');
        }
        res.send('Flight state saved successfully');
    });
});

// Endpoint to retrieve saved flight state
app.get('/api/saved-flight-state', (req, res) => {
    fs.readFile(flightStateFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error fetching saved flight state:', err);
            return res.status(500).send('Failed to fetch saved flight state');
        }
        res.json(JSON.parse(data));
    });
});

// Define a route to serve your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
