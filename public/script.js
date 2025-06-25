// Import Supabase at the top of your file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase
const supabaseUrl = 'https://jwwaxqfckxmppsncvfbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo'
const supabase = createClient(supabaseUrl, supabaseKey)

// ###################################################################### Sub to supabase realtime data
const flightStore = {
    currentFlight: null, // Holds the latest flight data
    subscribers: new Set(), // Functions to notify on updates

    // Initialize realtime subscription
    init() {
        const subscription = supabase
            .channel('flight-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'flights_realtime',
                    fields: [
                        'start_distance',
                        'dist_to_destination',
                        'ete_srgs',
                        'current_flight',
                        'flight_state',
                        'airplane_in_cloud',
                        'ambient_precipstate'
                    ]
                },
                (payload) => {
                    this.currentFlight = payload.new; // Update stored data
                    this.notifySubscribers(); // Alert all listeners
                }
            )
            .subscribe();

        return () => supabase.removeChannel(subscription); // Cleanup function
    },

    // Register functions to be called on updates
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback); // Unsubscribe function
    },

    // Notify all subscribed functions
    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.currentFlight));
    }
};

// ###################################################################### Sub to supabase realtime data

// SUPABASE INTEGRATION - Fetching from flights_static  $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


async function fetch_flight_static() {
    // Default configuration (can be extended later)
    const config = {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 8000
    };

    let retryCount = 0;
    let timeoutId;

    try {
        // 1. Verify authentication (with timeout)
        const authCheck = Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) =>
                timeoutId = setTimeout(() => reject(new Error('Auth timeout')), config.timeout)
            )
        ]);
        const { error: authError } = await authCheck;
        if (authError) throw authError;

        // 2. Execute the query (with retry logic)
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('flights_static')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                return data || [];
            } catch (err) {
                if (retryCount++ < config.maxRetries) {
                    await new Promise(resolve =>
                        setTimeout(resolve, config.retryDelay * retryCount)
                    );
                    return fetchData();
                }
                throw err;
            }
        };

        // 3. Return final result
        return {
            success: true,
            data: await fetchData(),
            error: null
        };

    } catch (error) {
        console.error('Fetch failed:', {
            name: error.name,
            message: error.message,
            ...(error.details && { details: error.details })
        });

        return {
            success: false,
            data: null,
            error: error.message
        };
    } finally {
        clearTimeout(timeoutId);
    }
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
    // Subscribe to flightStore updates
    const unsubscribe = flightStore.subscribe((flightData) => {
        // Reset visuals if no data
        resetETEVisuals();

        if (!flightData) {
            console.warn('No flight data received from flightStore');
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
flightStore.init();



document.addEventListener("DOMContentLoaded", async function () {

    try {
        // 1. Verify Supabase
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase not initialized');
        }

        // 2. Load static flights
        const { success, data, error } = await fetch_flight_static();
        if (!success) throw new Error(error);

        if (data && data.length > 0) {
            // 3. Initialize realtime updates
            const cleanupETEUpdates = Update_ETE_Dist2Arr_Bar();

            // 4. Set up cleanup
            window.addEventListener('beforeunload', () => {
                cleanupETEUpdates();
                if (cloudOpacityState.interval) {
                    clearInterval(cloudOpacityState.interval);
                }
            });
        }

    } catch (error) {
        console.error('Initialization failed:', error);
        // Show user-friendly error message
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.textContent = `Error: ${error.message}`;
            errorContainer.style.display = 'block';
        }
    }


    // Now use supabase in your code
    let initialETE = -1;
    let cloudOpacityInterval;
    let GreenbarPercentage = 0;
    
    

    







    async function updateFlightTable() {
        const { active, completed } = await fetch_flight_static();
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

    initialize();

});