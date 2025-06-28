// Import Supabase at the top of your file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//import { createClient } from 'https://esm.sh/@supabase/supabase-js@1.35.7';
// Initialize Supabase
const supabaseUrl = 'https://jwwaxqfckxmppsncvfbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo'
const supabase = createClient(supabaseUrl, supabaseKey)





// DOM elements from your HTML
const elements = {
    aircraftImage: document.querySelector('.flight-image'),
    aircraftName: document.querySelector('.flight-aircraft span'),
    flightNumber: document.querySelector('.flight-number'),
    departure: document.querySelector('.flight-departure'),
    status: document.querySelector('.flight-status'),
    destination: document.querySelector('.flight-destination'),
    eteBar: document.getElementById('ete-bar'),
    eteBarText: document.getElementById('ete-bar-text'),
    aircraftIcon: document.getElementById('aircraft-image'),
    jetstreamImage: document.getElementById('jetstream-image'),
    cloudImage: document.getElementById('cloud-image'),
    precipImage: document.getElementById('precip-image')
};

function CreateNewRow(flightData, isStatic = false) {
    const table = document.getElementById("flightTable");
    const tbody = table.querySelector('tbody');
    const newRow = document.createElement('tr');

    // Create cells (preserving your exact structure)
    const aircraftCell = document.createElement('td');
    const flightNumberCell = document.createElement('td');
    const departureCell = document.createElement('td');
    const flightStatusCell = document.createElement('td');
    const destinationCell = document.createElement('td');

    // Set cell content (unchanged from your original)
    aircraftCell.style.textAlign = 'center';
    const img = document.createElement('img');
    img.src = flightData.image;
    img.alt = 'Aircraft Image';
    img.style.width = '100px';
    img.style.height = 'auto';
    img.onerror = function () { this.src = '/default-aircraft.png'; }; // Added fallback
    aircraftCell.appendChild(img);
    aircraftCell.appendChild(document.createTextNode(` ${flightData.aircraft}`));

    flightNumberCell.textContent = flightData.flightNumber;
    departureCell.textContent = flightData.departure;
    flightStatusCell.textContent = flightData.flightStatus;
    destinationCell.textContent = flightData.destination;

    // Append cells (unchanged)
    newRow.appendChild(aircraftCell);
    newRow.appendChild(flightNumberCell);
    newRow.appendChild(departureCell);
    newRow.appendChild(flightStatusCell);
    newRow.appendChild(destinationCell);

    // MODIFIED: Conditional blinking based on isStatic
    if (!isStatic) {
        const blinkingClass = getBlinkingClass(flightData.flightStatus);
        if (blinkingClass) {
            flightStatusCell.classList.add(blinkingClass); // Only blink status cell
        }
    }

    // NEW: Add static flight class if needed
    if (isStatic) {
        newRow.classList.add('static-flight');
    }

    tbody.appendChild(newRow);
    return newRow; // Return the row for potential chaining
}


async function updateFlightTable(staticData) {
    const tbody = document.getElementById("flight-rows");

    // Clear existing rows
    tbody.innerHTML = '';

    // Check if staticData is an array (forEach won't work on single object)
    const flightsArray = Array.isArray(staticData) ? staticData : [staticData];

    flightsArray.forEach(flight => {
        // Ensure field names match exactly with your Supabase columns
        CreateNewRow({
            image: flight.image || '',              // Add fallback empty string
            aircraft: flight.aircraft || 'Unknown',
            flightNumber: flight.flightnumber || '',
            departure: flight.departure || '',
            flightStatus: flight.flightstatus || '',
            destination: flight.destination || ''
        });
    });
}


async function offfetch_flight_static() {
    try {
        // Corrected: the destructured property should be 'data' not 'staticData'
        const { data, error } = await supabase
            .from('flights_static')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)  // Changed to get multiple records (more typical for a table)
        // Removed .single() since we want multiple rows

        if (error) throw error;

        if (data && data.length > 0) {
            updateFlightTable(data);
            return data;
        } else {
            console.log('No data found');
            return null;
        }

    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}


// Helper function to extract aircraft type and flight number
const parseFlightData = (currentFlight) => {
    if (!currentFlight) return { aircraftType: '', flightNumber: '' };

    const parts = currentFlight.split(' ');
    return {
        aircraftType: parts[0] || '',
        flightNumber: parts.slice(1).join(' ') || '' // Handles cases with spaces in flight number
    };
};

// Update aircraft images
const updateAircraftImages = (data) => {
    const { aircraftType, flightNumber } = parseFlightData(data.current_flight);

    // Update main aircraft image
    if (aircraftType) {
        elements.aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
        elements.aircraftImage.alt = aircraftType;
    }

    // Update small aircraft icon in progress bar
    elements.aircraftIcon.src = `/Image/Aircraft_Type/${aircraftType}.png`;
    elements.aircraftIcon.alt = aircraftType;
};

// Update progress bar
const updateProgressBar = (data) => {
    if (!data.dist_to_destination || !data.start_distance) return;

    const percentage = Math.min(100,
        ((data.start_distance - data.dist_to_destination) / data.start_distance) * 100
    );

    elements.eteBar.style.width = `${percentage}%`;
    elements.eteBarText.textContent = `${data.ete_srgs} | ${data.dist_to_destination}nm`;
    elements.aircraftIcon.style.left = `${percentage}%`;
};

// Handle status cell updates with animation
const updateStatusCell = (status) => {
    const statusCell = elements.status;

    // Remove all blinking classes
    statusCell.className = 'flight-status';

    if (status) {
        statusCell.textContent = status;
        const statusClass = getStatusClass(status);
        if (statusClass) statusCell.classList.add(statusClass);
    }
};



// Map status to CSS class
const getBlinkingClass = (status) => {
    const statusMap = {
        'Boarding': 'blinking-boarding',
        'Departed': 'blinking-departed',
        'Enroute': 'blinking-enroute',
        'Delayed': 'blinking-delayed',
        'Landed': 'blinking-landed',
        'Deboarding': 'blinking-deboarding'
    };
    return statusMap[status] || '';
};

// Update weather effects
const updateWeatherEffects = (data) => {
    // Cloud visibility
    elements.cloudImage.style.display = data.airplane_in_cloud ? 'block' : 'none';

    // Precipitation effects
    if (data.ambient_precipstate) {
        elements.precipImage.style.display = 'block';
        elements.precipImage.src = getPrecipImage(data.ambient_precipstate);
    } else {
        elements.precipImage.style.display = 'none';
    }
};

// Helper function for precipitation images
const getPrecipImage = (precipState) => {
    const precipImages = {
        'Rain': '/Image/Weather/rain.gif',
        'Snow': '/Image/Weather/snow.gif',
        'Thunderstorm': '/Image/Weather/lightning.gif'
    };
    return precipImages[precipState] || '';
};

// Update all UI elements
const updateFlightUI = (data) => {
    //const { aircraftType, flightNumber } = parseFlightData(data.current_flight);

    // Update basic flight info
    //elements.aircraftName.textContent = parseFlightData(data.current_flight).aircraftType || 'N/A';
   // elements.flightNumber.textContent = flightNumber || 'N/A';
    //elements.departure.textContent = data.departure_location || 'N/A';
    //elements.destination.textContent = data.destination || 'N/A';

    // Update aircraft images
    //updateAircraftImages(data);

    // Update status with animation class
    //updateStatusCell(data.flight_status);

    // Update progress bar
    updateProgressBar(data);

    // Update weather effects
    updateWeatherEffects(data);
};

// Set up realtime subscription
const setupRealtimeUpdates = () => {
    return supabase
        .channel('flight-updates')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'flights_realtime'
        }, (payload) => {
            updateFlightUI(payload.new);
        })
        .subscribe();
};

// Set up realtime subscription
const fetch_flight_static = () => {
    return supabase
        .channel('flight-updates-static')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'flights_static'
        }, (payload) => {
            updateFlightTable(payload.new);
        })
        .subscribe();
};



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    supabase
        .from('flights_static')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
            if (data) updateFlightTable(data);
        });



    fetch_flight_static();

    // First load initial data
    supabase
        .from('flights_realtime')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
            if (data) updateFlightUI(data);
        });

    // Then set up realtime updates
    setupRealtimeUpdates();
});