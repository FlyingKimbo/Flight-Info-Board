const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const supabase = require('./supabase'); // Import the Supabase client

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'Image' directory
app.use('/Image', express.static(path.join(__dirname, 'public/Image')));

// Serve static files from the 'data' directory
app.use('/data', express.static(path.join(__dirname, 'public/data')));

// API Routes
const updateFlight = require('./api/update-flight');
// const flightProgress = require('./api/flight-progress');
app.use('/api/update-flight', updateFlight);
// app.use('/api', flightProgress); // Combine both save-flight-state and saved-flight-state in one router

// Example Supabase API Route: Fetch all users
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Example Supabase API Route: Add a new user with hashed password
app.post('/api/users', async (req, res) => {
    const { username, email, password } = req.body; // Extract user data from the request body
    try {
        // Hash the password before storing it
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

        // Insert the new user into the database
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, email, password_hash: hashedPassword }]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(201).json({ message: 'User created successfully!', user: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Example Supabase API Route: Login and verify user credentials
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; // Extract user data from the request body
    try {
        // Fetch user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single(); // Ensure we only get one user

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare input password with the hashed password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful!', user: { username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
