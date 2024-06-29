const express = require('express');

const app = express();

const path = require('path');


// Serve static files from the 'public' directory

app.use(express.static(path.join(__dirname, 'public')));


// Serve static files from the 'Image' directory

app.use('/public/data', express.static(path.join(__dirname, 'Image')));


// Serve static files from the 'data' directory

app.use('/public/data', express.static(path.join(__dirname, 'data')));


// Serve static files from the 'api' directory


// API Routes
const updateFlight = require('./api/update-flight');
const flightState = require('./api/flight-state');
app.use('/api/update-flight', updateFlight);
app.use('/api/flight-state', flightState);

// Define a route to serve your HTML file

app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'index.html'));

});


const port = process.env.PORT || 8080;

app.listen(port, () => {

    console.log(`Server is running on port ${port}`);

});