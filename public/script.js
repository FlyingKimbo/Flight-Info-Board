// Import Supabase at the top of your file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase
const supabaseUrl = 'https://jwwaxqfckxmppsncvfbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo'
const supabase = createClient(supabaseUrl, supabaseKey)

// Verify connection
supabase.from('flights_realtime').select('*').limit(1)
    .then(({ data, error }) => {
        if (error) {
            console.error('Connection failed:', error)
            showErrorToUser()
        } else {
            console.log('Connection successful:', data)
            initializeApp()
        }
    })

function initializeApp() {
    // Your existing application code
    let initialETE = -1
    let cloudOpacityInterval
    let GreenbarPercentage = 0

    // Rest of your original code...
}

function showErrorToUser() {
    // Display user-friendly error message
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff4444;
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 1000;
  `
    errorDiv.textContent = 'Connection to flight data failed. Please refresh the page.'
    document.body.prepend(errorDiv)
}

document.addEventListener("DOMContentLoaded", function () {
    // Initialize Supabase client
    //const supabaseUrl = 'https://jwwaxqfckxmppsncvfbo.supabase.co';
    //const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo';

    // Check if Supabase is loaded
    if (typeof createClient === 'undefined') {
        console.error('Supabase library not loaded! Check script loading order.');
        return;
    }

   

    // Now use supabase in your code
    let initialETE = -1;
    let cloudOpacityInterval;
    let GreenbarPercentage = 0;

    

    // SUPABASE INTEGRATION - Fetching from flights_static & flights_realtime $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    const VALID_REALTIME_STATUSES = ['Boarding', 'Departed', 'Delayed', 'Enroute', 'Landed', 'Deboarding Completed'];

    async function fetchAllFlights() {
        try {
            // First verify connection
            const { data: authData, error: authError } = await supabase.auth.getSession();
            if (authError) throw authError;

            // Make queries with better error handling
            const realtimeResult = await supabase
                .from('flights_realtime')
                .select(`
                current_flight,
                flight_status,
                start_distance,
                airplane_in_cloud,
                dist_to_destination,
                ete_srgs,
                ambient_precipstate,
                ambient_visibility,
                dep_display,
                arr_display,
                flight_state,
                created_at
            `)
                .in('flight_status', VALID_REALTIME_STATUSES)
                .order('created_at', { ascending: false })
                .limit(1);  // Only get the most recent flight

            if (realtimeResult.error) throw realtimeResult.error;

            // Validate we have complete data
            const flightData = realtimeResult.data?.[0];
            if (!flightData || flightData.dist_to_destination === undefined) {
                throw new Error('Incomplete flight data received');
            }

            return flightData;

        } catch (error) {
            console.error('Flight data fetch error:', {
                message: error.message,
                details: error.details,
                code: error.code
            });
            return null;
        }
    }
    
    
    
    async function updateFlightTable() {
        const { active, completed } = await fetchAllFlights();
        const tbody = document.getElementById("flight-rows"); // Target ONLY the tbody

        // Clear existing rows (preserves headers)
        tbody.innerHTML = '';

      
        // Process static flights
        completed.forEach(flight => {
            CreateNewRow({
                image: flight.image, // the "image"" must match exactly in flights_static
                aircraft: flight.aircraft,
                flightNumber: flight.flightnumber,
                departure: flight.departure,
                flightStatus: flight.flightstatus,
                destination: flight.destination
            });
        });
    }


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

    async function fetchInitialETE() {
        try {
            // Get data exclusively from fetchAllFlights()
            const { active } = await fetchAllFlights();

            if (!active || active.length === 0) {
                console.log('No flights with valid status - skipping ETE calculation');
                initialETE = -1; // Explicitly set invalid state
                return;
            }

            // Use the most recent active flight (pre-filtered and ordered)
            const flightData = active[0];
            const startDistance = flightData.start_distance;

            console.log('Processing ETE for:', {
                flight: flightData.current_flight,
                distance: startDistance
            });

            if (isNaN(startDistance) || startDistance <= 0) {
                console.error('Invalid ETE value');
                initialETE = -1;
            } else {
                initialETE = startDistance;
                updateETEbars(
                    flightData.current_flight,
                    flightData.current_flight.split(' ')[0] // aircraft type
                );
            }
        } catch (error) {
            console.error('ETE processing failed:', error);
            initialETE = -1; // Ensure known state on failure
        }
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
                realtimeData?.flightStatus &&
                !["-", ""].includes(realtimeData.flightStatus) &&
                validStatuses.has(realtimeData.flightStatus);

            if (shouldUpdate) {
                const fullFlightId = `${realtimeData.current_flight} ${realtimeData.current_flight.split(' ').pop()}`;

                updateFlightCells(
                    fullFlightId,
                    realtimeData.flightStatus,
                    realtimeData.obsArrDisplay
                );
                return;
            }

            // 4. No update needed - log reason
            console.log(
                !realtimeData ? "No realtime data" :
                    !realtimeData.flightStatus ? "Empty flight status" :
                        ["-", ""].includes(realtimeData.flightStatus) ? "Status is '-' or blank" :
                            `Status '${realtimeData.flightStatus}' not in allowed values`
            );

        } catch (error) {
            console.error('Flight status check error:', error);
        }
    }

    // Update helper with null checks
    function updateFlightCells(flightId, status, arrival) {
        if (flightId) document.getElementById('flight-id').textContent = flightId;
        if (status) document.getElementById('flight-status').textContent = status;
        if (arrival) document.getElementById('arrival-display').textContent = arrival;
    }
    
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

    function fetchFlight_State(flightData) {
        try {
            // Use data already fetched from Supabase
            if (!flightData || !flightData.flight_state) {
                console.warn('No flight state data available');
                return null;
            }

            const flightState = flightData.flight_state;
            console.log('Flight State:', flightState);
            return flightState;

        } catch (error) {
            console.error('Error processing flight state:', error);
            return null;
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

    async function fetchInitialETE() {
        try {
            const { active } = await fetchAllFlights();

            if (!active || active.length === 0) {
                console.log('No active flights with valid status - skipping ETE');
                resetETEVisuals(); // Clear UI elements
                initialETE = -1;
                return;
            }

            const flightData = active[0]; // Most recent flight
            const startDistance = flightData.start_distance;

            console.log('Processing ETE for flight:', {
                flight: flightData.current_flight,
                distance: startDistance
            });

            if (isNaN(startDistance) || startDistance <= 0) {
                console.error('Invalid ETE value');
                initialETE = -1;
                resetETEVisuals();
            } else {
                initialETE = startDistance;
                // Call updateETEbars with additional required data
                updateETEbars(
                    flightData.current_flight,
                    flightData.current_flight.split(' ')[0], // aircraftType
                    {
                        DistToDestination: flightData.dist_to_destination,
                        ETE_SRGS: flightData.ete_srgs,
                        AmbientPRECIPSTATE: flightData.ambient_precipstate
                    }
                );
            }
        } catch (error) {
            console.error('ETE processing failed:', error);
            initialETE = -1;
            resetETEVisuals();
        }
    }

    // Helper to clear UI elements
    function resetETEVisuals() {
        const elements = [
            'ete-bar', 'aircraft-image', 'ete-bar-text',
            'jetstream-image', 'cloud-image', 'precip-image'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.opacity = 0;
        });
        clearInterval(cloudOpacityInterval);
        cloudOpacityInterval = null;
    }

    // Modified to accept direct flight data
    function updateETEbars(flightData) {
        // Reset visuals if no valid data
        resetETEVisuals();

        if (!flightData) {
            console.warn('No flight data provided');
            return;
        }

        // Validate required fields
        const requiredFields = [
            'dist_to_destination',
            'ete_srgs',
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

        // Validate all elements exist
        for (const [name, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`Missing DOM element: ${name}`);
                return;
            }
        }

        // Calculate ETE percentage
        const etePercentage = Math.min((flightData.dist_to_destination / initialETE) * 100, 100);

        // Update ETE bar
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

        // Update text display
        const distanceText = `${flightData.dist_to_destination} KM`;
        elements.eteText.textContent = `${flightData.ete_srgs.trim()} | ${distanceText}`;
        elements.eteText.style.opacity = '1';

        // Update flight state visuals
        updatePositions();
        elements.jetStreamImage.style.opacity =
            flightData.flight_state.includes('Airborne') ? '1' : '0';

        // Update precipitation
        elements.precipImage.src =
            flightData.ambient_precipstate === 4 ? '/Image/Precip/rain1.gif' :
                flightData.ambient_precipstate === 8 ? '/Image/Precip/snow1.gif' : '';
        elements.precipImage.style.opacity =
            [4, 8].includes(flightData.ambient_precipstate) ? '1' : '0';
    }
    /*
    function updateETEbars(currentFlightKey, aircraftType) {
        if (initialETE === -1) {
            return;
        }

        fetch('/api/update-flight')
            .then(response => response.json())
            .then(data => {
                const flightData = data[currentFlightKey];
                console.log('Flight data for update:', flightData);

                if (!flightData) {
                    console.error('Current flight data is missing.');
                    return;
                }

                const eteData = flightData.DistToDestination;
                const eteBar = document.getElementById('ete-bar');
                const aircraftImage = document.getElementById('aircraft-image');
                const eteText = document.getElementById('ete-bar-text'); // ETE text element
                const jetStreamImage = document.getElementById('jetstream-image');
                const cloudImage = document.getElementById('cloud-image');
                const precipImage = document.getElementById('precip-image'); // New precipitation image element

                if (eteBar && eteData !== undefined) {
                    const ete = eteData;
                    const etePercentage = Math.min((ete / initialETE) * 100, 100);
                    GreenbarPercentage = etePercentage;
                    console.log('ETE Percentage:', etePercentage);
                    eteBar.style.width = etePercentage + '%';
                    eteBar.style.opacity = 1; // Ensure the green bar is always visible

                    fetchAirplaneInCloud().then(airplaneInCloud => {
                        if (airplaneInCloud === 1) { // Check if airplaneInCloud is exactly 1
                            if (!cloudOpacityInterval) {
                                startCloudOpacityCycling(cloudImage);
                                cloudImage.style.opacity = 1;
                            }
                        } else {
                            clearInterval(cloudOpacityInterval);
                            cloudOpacityInterval = null;
                            cloudImage.style.opacity = 0;
                        }
                    });

                    switch (true) {
                        case (etePercentage > 0 && etePercentage <= 100):
                            eteText.style.opacity = 1;
                            aircraftImage.style.opacity = 1;
                            updatePositions();

                            fetchFlight_State().then(flightState => {
                                if (flightState) {
                                    if (flightState.includes('Landed')) {
                                        jetStreamImage.style.opacity = 0;
                                    } else if (flightState.includes('Airborne')) {
                                        updatePositions();
                                        jetStreamImage.style.opacity = 1;
                                    }
                                }
                            });
                            break;
                        case (etePercentage == 0):
                            eteText.style.opacity = 1;
                            aircraftImage.style.opacity = 1;
                            updatePositions();
                            jetStreamImage.style.opacity = 0;

                            break;
                        case (etePercentage < 0):
                            eteText.style.opacity = 0;
                            aircraftImage.style.opacity = 0;
                            updatePositions();
                            jetStreamImage.style.opacity = 0;
                            break;
                        default:
                            // Handle default case if needed
                            break;
                    }

                    aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`; // Set the appropriate aircraft image
                    cloudImage.src = `/Image/Cloud/Cloud1.png`;

                    const distanceText = flightData.DistToDestination + " KM";
                    const combinedText = `${flightData.ETE_SRGS.trim()} | ${distanceText}`;
                    eteText.textContent = combinedText; // Update text content with combined ETE and Distance

                    const precipState = flightData.AmbientPRECIPSTATE;
                    if (precipState === 4) {
                        precipImage.src = '/Image/Precip/rain1.gif';
                        precipImage.style.opacity = 1;
                    } else if (precipState === 8) {
                        precipImage.src = '/Image/Precip/snow1.gif';
                        precipImage.style.opacity = 1;
                    } else {
                        precipImage.style.opacity = 0;
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching ETE data:', error);
                const eteBar = document.getElementById('ete-bar');
                const aircraftImage = document.getElementById('aircraft-image');
                const eteText = document.getElementById('ete-bar-text'); // ETE text element
                eteBar.style.width = '0%';
                eteBar.style.opacity = 0;
                aircraftImage.style.opacity = 0;
                eteText.style.opacity = 0;
            });
    }
    */

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

    function startCloudOpacityCycling(cloudImage) {
        // Clear any existing interval
        if (cloudOpacityState.interval) {
            clearInterval(cloudOpacityState.interval);
        }

        // Initialize state
        cloudImage.style.opacity = cloudOpacityState.currentOpacity;

        // Start new cycle
        cloudOpacityState.interval = setInterval(() => {
            cloudOpacityState.currentOpacity += cloudOpacityState.direction * cloudOpacityState.increment;

            // Boundary checks
            if (cloudOpacityState.currentOpacity >= cloudOpacityState.peakOpacity) {
                cloudOpacityState.currentOpacity = cloudOpacityState.peakOpacity;
                cloudOpacityState.direction = -1;
            } else if (cloudOpacityState.currentOpacity <= cloudOpacityState.baseOpacity) {
                cloudOpacityState.currentOpacity = cloudOpacityState.baseOpacity;
                cloudOpacityState.direction = 1;
            }

            // Apply to DOM
            cloudImage.style.opacity = cloudOpacityState.currentOpacity;

        }, cloudOpacityState.speed);
    }

    // New function to safely stop cycling
    function stopCloudOpacityCycling() {
        if (cloudOpacityState.interval) {
            clearInterval(cloudOpacityState.interval);
            cloudOpacityState.interval = null;
        }
    }

    // Modified clear call in updateETEbars would now use:
    // stopCloudOpacityCycling() instead of clearInterval(cloudOpacityInterval)

    /*
    function startCloudOpacityCycling(cloudImage) {
        let opacity = 0.3;
        let direction = 1; // 1 for increasing, -1 for decreasing
        const increment = 0.01; // Smaller increment for smoother transition
        const intervalTime = 30; // Smaller interval for more frequent updates

        cloudOpacityInterval = setInterval(() => {
            opacity += direction * increment;
            if (opacity >= 1.0) {
                opacity = 1.0;
                direction = -1;
            } else if (opacity <= 0.3) {
                opacity = 0.3;
                direction = 1;
            }
            cloudImage.style.opacity = opacity;
        }, intervalTime); // Adjust the interval as needed
    }
    */
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
        fetchInitialETE();

        // Automatically sort by Flight Status every 20000 milliseconds
        setInterval(function () {
            sortTable(3, localStorage.getItem('sortDirection') || 'asc'); // Sort by Flight Status (column index 3)
        }, 20000);

        setInterval(function () {
            // Supabase change - Updated to use current_flight from Supabase
            supabase.from('flights_realtime')
                .select('current_flight')
                .then(({ data }) => {
                    if (data?.length > 0) {
                        updateETEbars(data[0]);  // Pass the entire flight object
                    }
                });
        }, 2000);

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

    initialize();
});
