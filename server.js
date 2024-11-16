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
    console.log('GET /api/users - Fetching all users');
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            console.error('Supabase Error:', error.message);
            return res.status(500).json({ error: error.message });
        }
        console.log('Users fetched successfully:', data);
        res.status(200).json(data);
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Example Supabase API Route: Add a new user with hashed password
app.post('/api/users', async (req, res) => {
    console.log('POST /api/users - Adding a new user');
    console.log('Request Body:', req.body);

    const { username, email, password } = req.body; // Extract user data from the request body
    try {
        // Hash the password before storing it
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password
        console.log('Password hashed successfully.');

        // Insert the new user into the database
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, email, password_hash: hashedPassword }]);

        if (error) {
            console.error('Supabase Insert Error:', error.message);
            return res.status(500).json({ error: error.message });
        }
        console.log('User added successfully:', data);
        res.status(201).json({ message: 'User created successfully!', user: data });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Example Supabase API Route: Login and verify user credentials
app.post('/api/login', async (req, res) => {
    console.log('POST /api/login - Attempting to log in');
    console.log('Request Body:', req.body);

    const { email, password } = req.body; // Extract user data from the request body
    try {
        // Fetch user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single(); // Ensure we only get one user

        if (error || !user) {
            console.error('User Not Found or Supabase Error:', error ? error.message : 'No user found');
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('User found:', user);

        // Compare input password with the hashed password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.error('Invalid credentials provided.');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Login successful for user:', user.username);
        res.status(200).json({ message: 'Login successful!', user: { username: user.username, email: user.email } });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Define a route to serve your HTML file
app.get('/', (req, res) => {
    console.log('GET / - Serving index.html');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
