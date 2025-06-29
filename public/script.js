// Import Supabase at the top of your file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//import { createClient } from 'https://esm.sh/@supabase/supabase-js@1.35.7';
// Initialize Supabase
const supabaseUrl = 'https://jwwaxqfckxmppsncvfbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo'
const supabase = createClient(supabaseUrl, supabaseKey)


let GreenbarPercentage = 100


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
function updatePositions() {
    let Xoffset = 0;
    let XoffsetFix = 250;


    if (GreenbarPercentage >= 50) {
        Xoffset = 1;
    }
    const eteBar = document.getElementById('ete-bar');
    const aircraftImage = document.getElementById('aircraft-image');
    const eteText = document.getElementById('ete-bar-text'); // ETE text element
    const jetstream = document.getElementById('jetstream-image');
    const cloud = document.getElementById('cloud-image');
    const precipImage = document.getElementById('precip-image'); // New precipitation image element

    const barWidth = eteBar.getBoundingClientRect().width;
    const containerRight = eteBar.parentElement.getBoundingClientRect().right;
    const barRight = containerRight - barWidth;
    const imagePosition = barRight - (aircraftImage.offsetWidth / 1000) - 105 + (Xoffset * XoffsetFix);
    const textPosition = barRight - (eteText.offsetWidth / 1000) - 245 + (Xoffset * XoffsetFix);
    const jetstream_imagePosition = barRight - (jetstream.offsetWidth / 1000) - 245 + (Xoffset * XoffsetFix);
    const cloud_imagePosition = barRight - (cloud.offsetWidth / 1000) - 150 + (Xoffset * XoffsetFix);
    const precip_imagePosition = barRight - (precipImage.offsetWidth / 1000) - 110 + (Xoffset * XoffsetFix); // Position the precipitation image the same as cloud

    aircraftImage.style.left = `${imagePosition}px`;
    eteText.style.left = `${textPosition}px`;
    jetstream.style.left = `${jetstream_imagePosition}px`;
    cloud.style.left = `${cloud_imagePosition}px`;
    precipImage.style.left = `${precip_imagePosition}px`;

    //aircraftImage.style.opacity = 1; // Make sure the image is visible %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
}

const AnimationManager = {
    jetStreamInterval: null,
    cloudInterval: null,

    // Jet stream animation (still uses flight_state)
    startJetStreamCycling(flightState) {
        if (this.jetStreamInterval) clearInterval(this.jetStreamInterval);

        if (flightState === "Airborne") {
            let imageIndex = 1;
            this.jetStreamInterval = setInterval(() => {
                const img = document.getElementById('jetstream-image');
                if (img) {
                    img.src = `/Image/JetStream/JetStream${imageIndex}.png`;
                    img.style.opacity = '1';
                    imageIndex = (imageIndex % 5) + 1;
                }
            }, 20);
        } else {
            const img = document.getElementById('jetstream-image');
            if (img) img.style.opacity = '0';
        }
    },

    // Cloud animation (uses airplane_in_cloud)
    startCloudOpacityCycle(inCloud) {
        // Clear existing interval
        if (this.cloudInterval) clearInterval(this.cloudInterval);

        // Get and verify cloud element
        const cloud = document.getElementById('cloud-image');
        if (!cloud) {
            console.error("Cloud element missing!");
            return;
        }

        // DEBUG: Keep these styles but remove opacity
        cloud.style.cssText = `
        z-index: 9999 !important;
        border: 2px solid red !important;
        position: absolute !important;
        width: 100px !important;
        height: 100px !important;
        top: 50px !important;
        left: 50px !important;
    `;

        // Only control opacity through animation logic
        if (inCloud === 1) {
            console.log('[DEBUG] Starting cloud animation');
            let increasing = true;
            let currentOpacity = 0.2;

            this.cloudInterval = setInterval(() => {
                currentOpacity += increasing ? 0.01 : -0.01;
                if (currentOpacity >= 0.7) increasing = false;
                if (currentOpacity <= 0.2) increasing = true;

                cloud.style.opacity = currentOpacity;
                console.log('[DEBUG] Current opacity:', currentOpacity); // Add this line
            }, 50);
        } else {
            console.log('[DEBUG] Cloud hidden (normal state)');
            // Don't force hide if we're debugging
            // cloud.style.opacity = '0'; // Comment this out temporarily
        }
    },

    // Update both animations
    updateAnimations(flightState, inCloud) {
        this.startJetStreamCycling(flightState);
        this.startCloudOpacityCycle(inCloud);
    },

    cleanup() {
        if (this.jetStreamInterval) clearInterval(this.jetStreamInterval);
        if (this.cloudInterval) clearInterval(this.cloudInterval);
    }
};

function Update_ETE_Dist2Arr_Bar(flightData) {
    console.log('Cloud element exists:', !!document.getElementById('cloud-image'));

    if (!flightData || !flightData.flight_state) {
        AnimationManager.cleanup();
        return;
    }



    try {



        if (!flightData) {
            resetETEVisuals();
            return;
        }

        // Validate required fields
        const requiredFields = [
            'ete_srgs',
            'dist_to_destination',
            'start_distance',
            'current_flight',
            'flight_state',
            'airplane_in_cloud',
            'ambient_precipstate'
        ];
        console.log(`dist_to_destination at Update_ETE_Dist2Arr_Bar : ${flightData.dist_to_destination}`);
        console.log(`flight_state at Update_ETE_Dist2Arr_Bar : ${flightData.flight_state}`);
        console.log(`airplane_in_cloud at Update_ETE_Dist2Arr_Bar : ${flightData.airplane_in_cloud}`);


        // Get DOM elements
        const elements = {
            eteBar: document.getElementById('ete-bar'),
            aircraftImage: document.getElementById('aircraft-image'),
            eteText: document.getElementById('ete-bar-text'),
            jetStreamImage: document.getElementById('jetstream-image'),
            cloudImage: document.getElementById('cloud-image'),
            precipImage: document.getElementById('precip-image')
        };

        // Validate elements exist
        for (const [name, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`Missing DOM element: ${name}`);
                return;
            }
        }

        // Single call handles both animations
        AnimationManager.updateAnimations(
            flightData.flight_state,      // For jet stream
            flightData.airplane_in_cloud  // For cloud (1 or 0)
        );

        for (const field of requiredFields) {
            if (flightData[field] === undefined) {
                console.error(`Missing required field: ${field}`);
                return;
            }
        }

        // Update ETE bar width
        const etePercentage = Math.min((flightData.dist_to_destination / flightData.start_distance) * 100, 100);
        elements.eteBar.style.width = `${etePercentage}%`;
        elements.eteBar.style.opacity = '1';

        // Update aircraft image
        const aircraftType = flightData.current_flight.split(' ')[0];
        elements.aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
        elements.aircraftImage.style.opacity = '1';


        // Update ETE text
        elements.eteText.textContent = `${flightData.ete_srgs.trim()} | ${flightData.dist_to_destination} KM`;
        elements.eteText.style.opacity = '1';



        // Update precipitation
        elements.precipImage.src =
            flightData.ambient_precipstate === 4 ? '/Image/Precip/rain1.gif' :
                flightData.ambient_precipstate === 8 ? '/Image/Precip/snow1.gif' : '';
        elements.precipImage.style.opacity =
            [4, 8].includes(flightData.ambient_precipstate) ? '1' : '0';

    } catch (error) {
        console.error('Error updating ETE display:', error);
    }


    updatePositions();

  
}



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
    //updateProgressBar(data);

    // Update weather effects
    //updateWeatherEffects(data);
};

// Set up realtime subscription

let lastFlightStatus = null;

const setupRealtimeUpdates = () => {
    return supabase
        .channel('flight-updates')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'flights_realtime'
        }, (payload) => {
            // This will call your function with realtime data
            Update_ETE_Dist2Arr_Bar(payload.new);

            

        })
        .subscribe();
};

async function fetch_flight_static() {
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

// 2. Realtime Updates for All Fields


// Modified realtime subscription
function setupStaticRealtimeUpdates() {
    return supabase
        .channel('flight_board_updates')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'flights_static'
        }, (payload) => {
            const flightNumber = payload.new?.flightnumber || payload.old?.flightnumber;

            // 1. Find existing row by flight number (matching CreateNewRow's structure)
            const existingRow = Array.from(document.querySelectorAll('.flight-number'))
                .find(el => el.textContent.trim() === flightNumber)
                ?.closest('tr');

            // 2. Handle INSERT (new flight)
            if (payload.eventType === 'INSERT' && !existingRow) {
                const tbody = document.getElementById('flight-rows');
                const newRow = document.createElement('tr');
                newRow.className = 'flight-row';

                // Aircraft Cell (identical to CreateNewRow)
                const aircraftCell = document.createElement('td');
                aircraftCell.className = 'flight-aircraft';
                aircraftCell.style.textAlign = 'center';

                const img = document.createElement('img');
                img.className = 'flight-image';
                img.src = payload.new.image || '';
                img.alt = 'Aircraft Image';
                img.style.width = '100px';
                img.style.height = 'auto';
                img.style.boxShadow = '4px 4px 10px rgba(0, 0, 0, 1)';
                img.onerror = function () { this.src = '/default-aircraft.png'; };

                aircraftCell.appendChild(img);
                aircraftCell.appendChild(document.createTextNode(` ${payload.new.aircraft || ''}`));

                // Other cells (identical structure)
                const cells = [
                    { class: 'flight-number', text: payload.new.flightnumber },
                    { class: 'flight-departure', text: payload.new.departure },
                    { class: 'flight-status', text: payload.new.flightstatus },
                    { class: 'flight-destination', text: payload.new.destination }
                ].map(cell => {
                    const td = document.createElement('td');
                    td.className = cell.class;
                    td.textContent = cell.text || '';
                    return td;
                });

                // Build row
                newRow.appendChild(aircraftCell);
                cells.forEach(cell => newRow.appendChild(cell));
                tbody.prepend(newRow);
                return;
            }

            // 3. Handle UPDATE (same element targeting as CreateNewRow)
            if (payload.eventType === 'UPDATE' && existingRow) {
                existingRow.querySelector('.flight-aircraft span').textContent = ` ${payload.new.aircraft || ''}`;
                existingRow.querySelector('.flight-number').textContent = payload.new.flightnumber || '';
                existingRow.querySelector('.flight-departure').textContent = payload.new.departure || '';
                existingRow.querySelector('.flight-status').textContent = payload.new.flightstatus || '';
                existingRow.querySelector('.flight-destination').textContent = payload.new.destination || '';

                const img = existingRow.querySelector('.flight-image');
                if (img) {
                    img.src = payload.new.image || '';
                    // Maintain identical image styling
                    img.style.width = '100px';
                    img.style.height = 'auto';
                }
                return;
            }

            // 4. Handle DELETE (find by flight number)
            if (payload.eventType === 'DELETE' && existingRow) {
                existingRow.remove();
            }
        })
        .subscribe();
}

function offsetupStaticRealtimeUpdates() {
    return supabase
        .channel('flight_board_updates')
        .on('postgres_changes', {
            event: '*', // Listen to ALL events (INSERT/UPDATE/DELETE)
            schema: 'public',
            table: 'flights_static'
        }, (payload) => {
            const flightId = payload.new?.id || payload.old?.id;

            // 1. Handle INSERT (new flight)
            if (payload.eventType === 'INSERT') {
                if (!document.querySelector(`[data-flight-id="${flightId}"]`)) {
                    const newRow = document.createElement('tr');
                    newRow.dataset.flightId = flightId;
                    newRow.className = 'flight-row';
                    newRow.innerHTML = `
                        <td class="flight-aircraft">
                            <div class="cell-content">
                                <img class="flight-image" src="${payload.new.image || ''}">
                                <span>${payload.new.aircraft || ''}</span>
                            </div>
                        </td>
                        <td class="flight-number">${payload.new.flightnumber || ''}</td>
                        <td class="flight-departure">${payload.new.departure || ''}</td>
                        <td class="flight-status">${payload.new.flightstatus || ''}</td>
                        <td class="flight-destination">${payload.new.destination || ''}</td>
                    `;
                    document.getElementById('flight-rows').prepend(newRow);
                }
                return;
            }

            // 2. Handle UPDATE (status change)
            if (payload.eventType === 'UPDATE') {
                const row = document.querySelector(`[data-flight-id="${flightId}"]`);
                if (row) {
                    row.querySelector('.flight-number').textContent = payload.new.flightnumber || '';
                    row.querySelector('.flight-departure').textContent = payload.new.departure || '';
                    row.querySelector('.flight-status').textContent = payload.new.flightstatus || '';
                    row.querySelector('.flight-destination').textContent = payload.new.destination || '';
                    // Update other fields as needed...
                }
                return;
            }

            // 3. Handle DELETE (remove row from DOM)
            if (payload.eventType === 'DELETE') {
                const row = document.querySelector(`[data-flight-id="${flightId}"]`);
                if (row) {
                    row.remove();
                    console.log(`Removed flight ${flightId} from display`);
                }
                return;
            }
        })
        .subscribe();
}


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetch_flight_static();

    

    setupStaticRealtimeUpdates(); // Cell-level updates
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