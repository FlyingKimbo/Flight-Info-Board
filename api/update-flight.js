import { json } from 'micro';
import { send } from 'micro';

let flightData = {};  // In-memory storage for flight data

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const body = await json(req); // Parse JSON body
            console.log('Received data:', body);

            const { value } = body;

            // Check if data is received
            if (value !== undefined) {
                flightData['test'] = { value, timestamp: new Date().toISOString() };
                console.log('Updated flight data:', flightData);
                send(res, 200, { message: 'Flight data updated successfully' });
            } else {
                console.log('Invalid data received:', body);
                send(res, 400, { message: 'Invalid data' });
            }
        } catch (err) {
            console.error('Error parsing JSON:', err);
            send(res, 400, { message: 'Invalid JSON' });
        }
    } else if (req.method === 'GET') {
        console.log('Sending flight data:', flightData);
        send(res, 200, flightData);
    } else {
        console.log('Invalid method:', req.method);
        send(res, 405, { message: 'Method not allowed' });
    }
}
