let flightData = {};  // In-memory storage for flight data

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { playerId, lat, lon } = req.body;

        // Check if data is received
        console.log('Received data:', req.body);

        // Update the flight data
        if (playerId && lat && lon) {
            flightData[playerId] = { lat, lon, timestamp: new Date().toISOString() };
            console.log('Updated flight data:', flightData);
            res.status(200).json({ message: 'Flight data updated successfully' });
        } else {
            res.status(400).json({ message: 'Invalid data' });
        }
    } else if (req.method === 'GET') {
        console.log('Sending flight data:', flightData);
        // Retrieve the flight data
        res.status(200).json(flightData);
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
