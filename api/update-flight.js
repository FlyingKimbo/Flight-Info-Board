let flightData = {};  // In-memory storage for flight data

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { value } = req.body;

        // Check if data is received
        console.log('Received data:', req.body);

        // Update the flight data
        if (value !== undefined) {
            flightData['test'] = { value, timestamp: new Date().toISOString() };
            console.log('Updated flight data:', flightData);
            res.status(200).json({ message: 'Flight data updated successfully' });
        } else {
            console.log('Invalid data received:', req.body);
            res.status(400).json({ message: 'Invalid data' });
        }
    } else if (req.method === 'GET') {
        console.log('Sending flight data:', flightData);
        // Retrieve the flight data
        res.status(200).json(flightData);
    } else {
        console.log('Invalid method:', req.method);
        res.status(405).json({ message: 'Method not allowed' });
    }
}
