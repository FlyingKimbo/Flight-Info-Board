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

// Update all UI elements
const updateFlightUI = (data) => {
    // Update basic flight info
    elements.aircraftName.textContent = data.current_flight || 'N/A';
    elements.flightNumber.textContent = data.flight_number || 'N/A';
    elements.departure.textContent = data.departure_location || 'N/A';
    elements.destination.textContent = data.destination || 'N/A';

    // Update status with animation class
    updateStatusCell(data.flight_status);

    // Update progress bar
    updateProgressBar(data);

    // Update aircraft image if available
    if (data.aircraft_image_url) {
        elements.aircraftImage.src = data.aircraft_image_url;
    }

    // Update weather effects
    updateWeatherEffects(data);
};

// Handle status cell updates with animation
const updateStatusCell = (status) => {
    const statusCell = elements.status;

    // Remove all blinking classes
    statusCell.classList.remove(
        'blinking-boarding',
        'blinking-departed',
        'blinking-enroute',
        'blinking-delayed',
        'blinking-landed',
        'blinking-deboarding'
    );

    // Add appropriate blinking class based on status
    if (status) {
        statusCell.textContent = status;
        const statusClass = getStatusClass(status);
        if (statusClass) statusCell.classList.add(statusClass);
    }
};

// Map status to CSS class
const getStatusClass = (status) => {
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

// Update progress bar and aircraft position
const updateProgressBar = (data) => {
    if (!data.dist_to_destination || !data.start_distance) return;

    const percentage = Math.min(100,
        ((data.start_distance - data.dist_to_destination) / data.start_distance) * 100
    );

    elements.eteBar.style.width = `${percentage}%`;
    elements.eteBarText.textContent = `${data.ete_srgs} | ${data.dist_to_destination}nm`;

    // Position aircraft icon along the progress bar
    elements.aircraftIcon.style.left = `${percentage}%`;
    elements.aircraftIcon.src = 'aircraft-icon.png'; // Set your aircraft icon path
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

    // Jetstream effect (example implementation)
    elements.jetstreamImage.style.display = data.has_jetstream ? 'block' : 'none';
};

// Helper function for precipitation images
const getPrecipImage = (precipState) => {
    const precipImages = {
        'Rain': 'rain.gif',
        'Snow': 'snow.gif',
        'Thunderstorm': 'lightning.gif'
    };
    return precipImages[precipState] || '';
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
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
