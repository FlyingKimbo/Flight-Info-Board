const express = require('express');
const app = express();
const path = require('path');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'Image' directory
app.use('/Image', express.static(path.join(__dirname, 'Image')));

// Serve static files from the 'data' directory
app.use('/data', express.static(path.join(__dirname, 'data')));

// Serve static files from the 'api' directory
app.use('/data', express.static(path.join(__dirname, 'data')));

// Define a route to serve your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
