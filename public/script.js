// Import Supabase at the top of your file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//import { createClient } from 'https://esm.sh/@supabase/supabase-js@1.35.7';
// Initialize Supabase
const supabaseUrl = 'https://jwwaxqfckxmppsncvfbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo'
const supabase = createClient(supabaseUrl, supabaseKey)


// ###################################################################### Sub to supabase realtime data







// ###################################################################### Sub to supabase realtime data

// SUPABASE INTEGRATION - Fetching from flights_static  $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

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
fetch_flight_static();
// Start polling
//let pollingInterval = setInterval(fetch_flight_static, 5000);

// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& WIP WIP WIP WIP %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

// Update helper with null checks
//function updateFlightCells(flightId, status, arrival) {
//    if (flightId) document.getElementById('flight-id').textContent = flightId;
//    if (status) document.getElementById('flight-status').textContent = status;
//    if (arrival) document.getElementById('arrival-display').textContent = arrival;
//}

function fetchAirplaneInCloud(flightData) {
    try {
        // Use data already fetched from fetchAllFlights()
        if (!flightData || !flightData.airplane_in_cloud) {
            console.warn('No cloud status data available');
            return null;
        }

        const airplaneInCloud = flightData.airplane_in_cloud;
        console.log('Airplane In Cloud:', airplaneInCloud);
        return airplaneInCloud;

    } catch (error) {
        console.error('Error processing cloud status:', error);
        return null;
    }
}

function fetchAmbientPrecipState() {
    return fetch('/api/update-flight')
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            const currentFlightKey = Object.keys(data)[0];
            const precipState = data[currentFlightKey].AmbientPRECIPSTATE;
            console.log('AmbientPRECIPSTATE:', precipState);
            return precipState;
        })
        .catch(error => {
            console.error('Error fetching AirplaneInCloud status data:', error);
            return null;
        });
}

async function fetchFlight_State() {
    try {
        // Fetch the single flight record (no ID filtering)
        const { data, error } = await supabase
            .from('flights_realtime')
            .select('flight_state')
            .single(); // Ensures only 1 record is returned

        if (error) throw error;
        if (!data) throw new Error("No flight data found");

        return data.flight_state;

    } catch (error) {
        console.error("Error fetching flight state:", error.message);
        return null; // Fallback if error
    }
}




function startJetStreamCycling() {
    let imageIndex = 1;
    setInterval(() => {
        const jetStreamImage = document.getElementById('jetstream-image');
        if (jetStreamImage) {
            jetStreamImage.src = `/Image/JetStream/JetStream${imageIndex}.png`;
            imageIndex = (imageIndex % 5) + 1; // Cycle through 1 to 5
        }
    }, 20); // Change image every 20ms
}



// Helper to clear UI elements



// Cloud opacity manager (now with better state control)
let cloudOpacityState = {
    interval: null,
    currentOpacity: 0.3,
    direction: 1,
    baseOpacity: 0.3,
    peakOpacity: 1.0,
    increment: 0.01,
    speed: 30 // ms
};



// New function to safely stop cycling
function stopCloudOpacityCycling() {
    if (cloudOpacityState.interval) {
        clearInterval(cloudOpacityState.interval);
        cloudOpacityState.interval = null;
    }
}


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

    //aircraftImage.style.opacity = 1; // Make sure the image is visible
}

function sortTable(columnIndex, dir = 'asc') {
    var table = document.getElementById("flightTable");
    var rows = table.rows;
    var switching = true;
    var shouldSwitch, i;
    var switchcount = 0;

    // Clear existing sort indicators
    var headers = table.getElementsByTagName("th");
    for (i = 0; i < headers.length; i++) {
        headers[i].classList.remove("sort-asc", "sort-desc");
    }

    while (switching) {
        switching = false;
        var rowsArray = Array.prototype.slice.call(rows, 2); // Skip the header row and the green bar row

        for (i = 0; i < rowsArray.length - 1; i++) {
            shouldSwitch = false;
            var x = rowsArray[i].getElementsByTagName("TD")[columnIndex];
            var y = rowsArray[i + 1].getElementsByTagName("TD")[columnIndex];

            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
        }

        if (shouldSwitch) {
            rowsArray[i].parentNode.insertBefore(rowsArray[i + 1], rowsArray[i]);
            switching = true;
            switchcount++;
        } else {
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }

    // Add sort indicator to the sorted column header
    if (dir == "asc") {
        headers[columnIndex].classList.add("sort-asc");
    } else {
        headers[columnIndex].classList.add("sort-desc");
    }

    // Save sort state
    localStorage.setItem('sortColumnIndex', columnIndex);
    localStorage.setItem('sortDirection', dir);
}

function initialize() {
    // Supabase change - Replaced fetchFlightStateJSON() with Supabase version
    updateFlightTable(); // Now handles both realtime and static flights from Supabase



    // Set image paths
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://flight-info-board.vercel.app';
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = baseUrl + img.getAttribute('data-src');
        console.log('Setting image src:', img.src); // Debugging line
    });

    // Restore sort state
    var sortColumnIndex = localStorage.getItem('sortColumnIndex');
    var sortDirection = localStorage.getItem('sortDirection');
    if (sortColumnIndex !== null && sortDirection !== null) {
        sortTable(parseInt(sortColumnIndex), sortDirection);
    } else {
        // Default sort by Flight Status on first load
        sortTable(3, 'asc');
    }

    // Supabase change - Replaced fetchFlightData()
    checkFlightStatus(); // Now uses Supabase instead of API endpoint



    // Fetch initial ETE value
    //fetchInitialETE();

    // Automatically sort by Flight Status every 20000 milliseconds
    setInterval(function () {
        sortTable(3, localStorage.getItem('sortDirection') || 'asc'); // Sort by Flight Status (column index 3)
    }, 20000);



    // Start jet stream cycling
    startJetStreamCycling();
}

function setBlinking(currentFlight, flightStatus) {
    const rows = document.getElementById("flightTable").rows;
    for (let i = 2; i < rows.length; i++) { // Skip header and green bar rows
        const cells = rows[i].cells;
        const aircraft = cells[0].textContent.trim();
        const flightNumber = cells[1].textContent.trim();
        if (`${aircraft} ${flightNumber}` === currentFlight) {
            removeBlinkingClasses(cells); // Remove any existing blinking classes
            const blinkingClass = getBlinkingClass(flightStatus);
            cells[0].classList.add(blinkingClass);
            cells[1].classList.add(blinkingClass);
            cells[2].classList.add(blinkingClass);
            cells[3].classList.add(blinkingClass);
            cells[4].classList.add(blinkingClass);
        } else {
            removeBlinkingClasses(cells);
        }
    }
}

function removeBlinking(currentFlight) {
    const rows = document.getElementById("flightTable").rows;
    for (let i = 2; i < rows.length; i++) { // Skip header and green bar rows
        const cells = rows[i].cells;
        const aircraft = cells[0].textContent.trim();
        const flightNumber = cells[1].textContent.trim();
        if (`${aircraft} ${flightNumber}` === currentFlight) {
            removeBlinkingClasses(cells);
        }
    }
}

function removeBlinkingClasses(cells) {
    const classes = [
        'blinking-boarding', 'blinking-departed', 'blinking-enroute',
        'blinking-delayed', 'blinking-landed', 'blinking-deboarding'
    ];
    cells[0].classList.remove(...classes);
    cells[1].classList.remove(...classes);
    cells[2].classList.remove(...classes);
    cells[3].classList.remove(...classes);
    cells[4].classList.remove(...classes);
}

function getBlinkingClass(flightStatus) {
    switch (flightStatus) {
        case 'Boarding':
            return 'blinking-boarding';
        case 'Departed':
            return 'blinking-departed';
        case 'Enroute':
            return 'blinking-enroute';
        case 'Delayed':
            return 'blinking-delayed';
        case 'Landed':
            return 'blinking-landed';
        case 'Deboarding':
            return 'blinking-deboarding';
        default:
            return '';
    }
}

function updateFlightCells(currentFlight, flightStatus, destination, departure = '') {
    const rows = document.getElementById("flightTable").rows;
    let matchFound = false;
    for (let i = 2; i < rows.length; i++) { // Skip header and green bar rows
        const cells = rows[i].cells;
        const aircraft = cells[0].textContent.trim();
        const flightNumber = cells[1].textContent.trim();
        if (`${aircraft} ${flightNumber}` === currentFlight) {
            cells[3].textContent = flightStatus;
            cells[4].textContent = destination;
            if (departure) {
                cells[2].textContent = departure;
            }
            matchFound = true;
            break;
        }
    }
    return matchFound;
}

//       ##################### ETE and Distance bar update ################################################
function resetETEVisuals() {
    const elements = [
        'ete-bar', 'aircraft-image', 'ete-bar-text',
        'jetstream-image', 'cloud-image', 'precip-image'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.opacity = 0;
            if (id === 'ete-bar') {
                el.style.width = '0%';  // ← Explicitly reset width
            }
        }
    });
    clearInterval(cloudOpacityInterval);
    cloudOpacityInterval = null;
}


// Modified to accept direct flight data
function Update_ETE_Dist2Arr_Bar() {
    // Subscribe to flight updates
    const unsubscribe = flightStore.subscribe((flightData) => {
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

        for (const field of requiredFields) {
            if (flightData[field] === undefined) {
                console.error(`Missing required field: ${field}`);
                return;
            }
        }

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

        // Update ETE bar width
        const etePercentage = Math.min((flightData.dist_to_destination / flightData.start_distance) * 100, 100);
        elements.eteBar.style.width = `${etePercentage}%`;
        elements.eteBar.style.opacity = '1';

        // Update aircraft image
        const aircraftType = flightData.current_flight.split(' ')[0];
        elements.aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
        elements.aircraftImage.style.opacity = '1';

        // Update cloud effects
        if (flightData.airplane_in_cloud === 1) {
            elements.cloudImage.style.opacity = '1';
            if (!cloudOpacityState.interval) {
                startCloudOpacityCycling(elements.cloudImage);
            }
        } else {
            elements.cloudImage.style.opacity = '0';
            stopCloudOpacityCycling();
        }

        // Update ETE text
        elements.eteText.textContent = `${flightData.ete_srgs.trim()} | ${flightData.dist_to_destination} KM`;
        elements.eteText.style.opacity = '1';

        // Update jetstream visibility
        updatePositions();
        elements.jetStreamImage.style.opacity =
            flightData.flight_state.includes('Airborne') ? '1' : '0';

        // Update precipitation
        elements.precipImage.src =
            flightData.ambient_precipstate === 4 ? '/Image/Precip/rain1.gif' :
                flightData.ambient_precipstate === 8 ? '/Image/Precip/snow1.gif' : '';
        elements.precipImage.style.opacity =
            [4, 8].includes(flightData.ambient_precipstate) ? '1' : '0';
    });

    // Return cleanup function
    return unsubscribe;
}

//       ##################### END      OF      ETE and Distance bar update ################################################

////  #################### INITIAISE flightStore the realtime sub to supabase $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$




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



// 4. Status Checking System -----------------------------------------------
async function checkFlightStatus() {
    try {
        // 1. Fetch realtime data
        const { data: realtimeData } = await supabase
            .from('flights_realtime')
            .select('current_flight, flight_status, arr_display')
            .maybeSingle();

        // 2. Define valid statuses
        const validStatuses = new Set([
            "Boarding",
            "Departed",
            "Delayed",
            "Enroute",
            "Landed",
            "Deboarding Completed"
        ]);

        // 3. Check if we should update
        const shouldUpdate =
            realtimeData?.flight_status &&
            !["-", ""].includes(realtimeData.flight_status) &&
            validStatuses.has(realtimeData.flight_status);

        if (shouldUpdate) {
            const fullFlightId = `${realtimeData.current_flight} ${realtimeData.current_flight.split(' ').pop()}`;

            updateFlightCells(
                fullFlightId,
                realtimeData.flight_status,
                realtimeData.arr_display
            );
            return;
        }

        // 4. No update needed - log reason
        console.log(
            !realtimeData ? "No realtime data" :
                !realtimeData.flight_status ? "Empty flight status" :
                    ["-", ""].includes(realtimeData.flight_status) ? "Status is '-' or blank" :
                        `Status '${realtimeData.flight_status}' not in allowed values`
        );

    } catch (error) {
        console.error('Flight status check error:', error);
    }
}


async function getFlightDataWithPolling() {
    // Store interval ID so we can clear it later if needed
    let pollingInterval;

    // Define the fetch and print logic
    const fetchAndPrint = async () => {
        try {
            const { data, error } = await supabase
                .from('flights_realtime')
                .select(`
          ete_srgs,
          dist_to_destination,
          start_distance,
          current_flight,
          flight_state,
          airplane_in_cloud,
          ambient_precipstate
        `)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;

            if (data) {
                console.log('\n--- Flight Data ---');
                console.log(`Timestamp: ${new Date().toISOString()}`);
                console.log(`ETE SRGS: ${data.ete_srgs}`);
                console.log(`Distance to Destination: ${data.dist_to_destination}`);
                console.log(`Start Distance: ${data.start_distance}`);
                console.log(`Current Flight: ${data.current_flight}`);
                console.log(`Flight State: ${data.flight_state}`);
                console.log(`Airplane in Cloud: ${data.airplane_in_cloud}`);
                console.log(`Ambient Precip State: ${data.ambient_precipstate}`);
                console.log('-------------------');
                return data;
            } else {
                console.log('No flight data available');
                return null;
            }
        } catch (error) {
            console.error('Error fetching flight data:', error.message);
            return null;
        }
    };

    // Initial immediate fetch
    await fetchAndPrint();

    // Set up 5-second polling
    pollingInterval = setInterval(fetchAndPrint, 5000);

    // Return a cleanup function to stop polling
    return () => {
        clearInterval(pollingInterval);
        console.log('Polling stopped');
    };
}

// Usage:
// Start polling
const stopPolling = await getFlightDataWithPolling();

// When you want to stop polling:
// stopPolling();


// 3. Initialize with proper sequence
document.addEventListener("DOMContentLoaded", async () => {

    getFlightDataWithPolling();

    // Start ETE updates
    Update_ETE_Dist2Arr_Bar();

    
    //fetch_flight_static();
    

        

    
       
    
});


