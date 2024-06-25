export default async function handler(req, res) {
    if (req.method === 'POST') {
        const flightData = req.body;

        // Process the flight data (e.g., store it in a database, update a file, etc.)
        // Here you might add your logic to handle the incoming data

        res.status(200).json({ message: 'Flight data updated successfully' });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
