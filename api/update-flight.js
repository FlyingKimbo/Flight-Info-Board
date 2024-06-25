let flightData = {};  // In-memory storage for flight data

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { playerId, lat, lon } = req.body;

        // Update the flight data
        flightData[playerId] = { lat, lon, timestamp: new Date().toISOString() };

        res.status(200).json({ message: 'Flight data updated successfully' });
    } else if (req.method === 'GET') {
        // Retrieve the flight data
        res.status(200).json(flightData);
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}

