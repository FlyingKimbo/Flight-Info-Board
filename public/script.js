document.addEventListener("DOMContentLoaded", function () {
    let initialETE = -1;
    let cloudOpacityInterval;
    let GreenbarPercentage = 0;
    let flightChannel = null;
    let isInitialized = false;

    // ======================= SUPABASE INTEGRATION =======================
    const SUPABASE_URL = 'https://jwwaxqfckxmppsncvfbo.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo';

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Enhanced processing function for C++ broadcast compatibility
    function processFlightData(payload, source) {
        try {
            console.group('[Realtime Debug] Source:', source);

            // Handle C++ broadcast format specifically
            const receivedData = source === 'broadcast' ?
                (typeof payload.payload === 'string' ? JSON.parse(payload.payload) : payload.payload) :
                payload.new || payload;

            // Normalize field names (C++ might use different casing)
            const flightData = {
                CurrentFlight: receivedData.CurrentFlight || receivedData.current_flight,
                FlightStatus: receivedData.FlightStatus || receivedData.flight_status,
                OBSArrDisplay: receivedData.OBSArrDisplay || receivedData.obs_arr_display,
                OBSDepDisplay: receivedData.OBSDepDisplay || receivedData.obs_dep_display,
                DistToDestination: receivedData.DistToDestination || receivedData.dist_to_destination,
                ETE_SRGS: receivedData.ETE_SRGS || receivedData.ete_srgs,
                StartDistance: receivedData.StartDistance || receivedData.start_distance,
                AirplaneInCloud: receivedData.AirplaneInCloud || receivedData.airplane_in_cloud,
                AmbientPRECIPSTATE: receivedData.AmbientPRECIPSTATE || receivedData.ambient_precip_state,
                AmbientVISIBILITY: receivedData.AmbientVISIBILITY || receivedData.ambient_visibility,
                Flight_State: receivedData.Flight_State || receivedData.flight_state
            };

            console.log('Processed flight data:', flightData);
            console.groupEnd();

            // Update debug output
            const debugDiv = document.getElementById('debug-output') || createDebugOutput();
            debugDiv.innerHTML = `<pre>Last received: ${new Date().toISOString()}\nSource: ${source}\n${JSON.stringify(flightData, null, 2)}</pre>`;

            // Update UI elements
            if (flightData.CurrentFlight) {
                const [aircraftType, flightNumber] = flightData.CurrentFlight.split(' ');

                // Update table if it's a database change
                if (source === 'database') {
                    CreateNewRow({
                        aircraft: aircraftType,
                        flightNumber: flightNumber,
                        departure: flightData.OBSDepDisplay,
                        destination: flightData.OBSArrDisplay,
                        flightStatus: flightData.FlightStatus,
                        image: `/Image/Aircraft_Type/${aircraftType}.png`
                    });
                }

                updateFlightCells(
                    flightData.CurrentFlight,
                    flightData.FlightStatus,
                    flightData.OBSArrDisplay,
                    flightData.OBSDepDisplay
                );

                // Initialize ETE if not set
                if (initialETE === -1 && flightData.StartDistance > 0) {
                    initialETE = flightData.StartDistance;
                }

                updateETEbars(flightData);

                // Handle blinking status
                if (flightData.FlightStatus === "Deboarding Completed") {
                    removeBlinking(flightData.CurrentFlight);
                } else if (flightData.FlightStatus) {
                    setBlinking(flightData.CurrentFlight, flightData.FlightStatus);
                }
            }

            return flightData;

        } catch (error) {
            console.error('Error processing flight data:', error, payload);
            throw error;
        }
    }

    // Realtime setup optimized for C++ broadcasts
    function setupRealtimeUpdates() {
        if (flightChannel) return;

        try {
            flightChannel = supabase.channel('flight_updates')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'flights'
                }, (payload) => processFlightData(payload, 'database'))
                .on('broadcast', { event: 'flight_update' }, (payload) => {
                    console.log('C++ Broadcast received:', payload);
                    // Special handling for C++ broadcast format
                    try {
                        // Parse if payload is stringified
                        const processedPayload = typeof payload.payload === 'string' ?
                            JSON.parse(payload.payload) :
                            payload.payload;
                        processFlightData({ payload: processedPayload }, 'broadcast');
                    } catch (e) {
                        console.error('Error processing broadcast payload:', e);
                    }
                })
                .subscribe((status, err) => {
                    if (err) {
                        console.error('Subscription error:', err);
                        setTimeout(setupRealtimeUpdates, 5000);
                    } else if (status === 'SUBSCRIBED') {
                        console.log('Realtime connected!');
                        fetchInitialETE();
                    }
                });

            // WebSocket connection monitoring
            supabase.realtime.onOpen(() => console.log('WebSocket connected'));
            supabase.realtime.onClose(() => {
                console.log('WebSocket disconnected - reconnecting');
                flightChannel = null;
                setTimeout(setupRealtimeUpdates, 1000);
            });
            supabase.realtime.onError((err) => console.error('WebSocket error:', err));

        } catch (error) {
            console.error('Realtime setup error:', error);
            setTimeout(setupRealtimeUpdates, 5000);
        }
    }

    // ======================= UI FUNCTIONS =======================
    function CreateNewRow(flightData) {
        const table = document.getElementById("flightTable");
        const newRow = document.createElement('tr');

        const cells = [
            document.createElement('td'), // Aircraft
            document.createElement('td'), // Flight Number
            document.createElement('td'), // Departure
            document.createElement('td'), // Status
            document.createElement('td')  // Destination
        ];

        // Aircraft cell with image
        cells[0].style.textAlign = 'center';
        const img = document.createElement('img');
        img.src = flightData.image;
        img.alt = 'Aircraft Image';
        img.style.width = '100px';
        img.style.height = 'auto';
        cells[0].appendChild(img);
        cells[0].appendChild(document.createTextNode(` ${flightData.aircraft}`));

        // Other cells
        cells[1].textContent = flightData.flightNumber;
        cells[2].textContent = flightData.departure;
        cells[3].textContent = flightData.flightStatus;
        cells[4].textContent = flightData.destination;

        // Add all cells to row
        cells.forEach(cell => newRow.appendChild(cell));

        // Add blinking class if needed
        const blinkingClass = getBlinkingClass(flightData.flightStatus);
        if (blinkingClass) {
            newRow.classList.add(blinkingClass);
        }

        table.querySelector('tbody').appendChild(newRow);
    }

    function updateETEbars(flightData) {
        if (!flightData || initialETE === -1) return;

        const eteBar = document.getElementById('ete-bar');
        const aircraftImage = document.getElementById('aircraft-image');
        const eteText = document.getElementById('ete-bar-text');
        const jetStreamImage = document.getElementById('jetstream-image');
        const cloudImage = document.getElementById('cloud-image');
        const precipImage = document.getElementById('precip-image');

        if (!eteBar || !flightData.DistToDestination) return;

        const etePercentage = Math.min((flightData.DistToDestination / initialETE) * 100, 100);
        GreenbarPercentage = etePercentage;
        eteBar.style.width = etePercentage + '%';
        eteBar.style.opacity = 1;

        // Cloud handling
        if (flightData.AirplaneInCloud === 1) {
            if (!cloudOpacityInterval) {
                startCloudOpacityCycling(cloudImage);
                cloudImage.style.opacity = 1;
            }
        } else {
            clearInterval(cloudOpacityInterval);
            cloudOpacityInterval = null;
            cloudImage.style.opacity = 0;
        }

        // Visibility states
        if (etePercentage > 0 && etePercentage <= 100) {
            eteText.style.opacity = 1;
            aircraftImage.style.opacity = 1;

            if (flightData.Flight_State) {
                jetStreamImage.style.opacity = flightData.Flight_State.includes('Airborne') ? 1 : 0;
            }
            updatePositions();
        } else if (etePercentage === 0) {
            eteText.style.opacity = 1;
            aircraftImage.style.opacity = 1;
            jetStreamImage.style.opacity = 0;
            updatePositions();
        } else {
            eteText.style.opacity = 0;
            aircraftImage.style.opacity = 0;
            jetStreamImage.style.opacity = 0;
            updatePositions();
        }

        // Update images and text
        const [aircraftType] = flightData.CurrentFlight.split(' ');
        aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
        cloudImage.src = `/Image/Cloud/Cloud1.png`;

        const distanceText = flightData.DistToDestination + " KM";
        eteText.textContent = `${flightData.ETE_SRGS.trim()} | ${distanceText}`;

        // Precipitation handling
        if (flightData.AmbientPRECIPSTATE === 4) {
            precipImage.src = '/Image/Precip/rain1.gif';
            precipImage.style.opacity = 1;
        } else if (flightData.AmbientPRECIPSTATE === 8) {
            precipImage.src = '/Image/Precip/snow1.gif';
            precipImage.style.opacity = 1;
        } else {
            precipImage.style.opacity = 0;
        }
    }

    // ======================= HELPER FUNCTIONS =======================
    function createDebugOutput() {
        const div = document.createElement('div');
        div.id = 'debug-output';
        div.style = 'position:fixed; bottom:0; right:0; background:#fff; padding:10px; z-index:9999; border:1px solid red; max-height:200px; overflow:auto;';
        document.body.appendChild(div);
        return div;
    }

    function startCloudOpacityCycling(cloudImage) {
        let opacity = 0.3;
        let direction = 1;
        cloudOpacityInterval = setInterval(() => {
            opacity += direction * 0.01;
            if (opacity >= 1.0 || opacity <= 0.3) direction *= -1;
            cloudImage.style.opacity = Math.max(0.3, Math.min(1.0, opacity));
        }, 30);
    }

    function updatePositions() {
        const Xoffset = GreenbarPercentage >= 50 ? 1 : 0;
        const XoffsetFix = 250;

        const elements = {
            aircraft: document.getElementById('aircraft-image'),
            text: document.getElementById('ete-bar-text'),
            jetstream: document.getElementById('jetstream-image'),
            cloud: document.getElementById('cloud-image'),
            precip: document.getElementById('precip-image')
        };

        const eteBar = document.getElementById('ete-bar');
        const barWidth = eteBar.getBoundingClientRect().width;
        const containerRight = eteBar.parentElement.getBoundingClientRect().right;
        const barRight = containerRight - barWidth;

        // Position all elements
        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (!element) return;

            const offsetMap = {
                aircraft: 105,
                text: 245,
                jetstream: 245,
                cloud: 150,
                precip: 110
            };

            const position = barRight - (element.offsetWidth / 1000) - offsetMap[key] + (Xoffset * XoffsetFix);
            element.style.left = `${position}px`;
        });
    }

    // ======================= INITIALIZATION =======================
    function initialize() {
        if (isInitialized) return;
        isInitialized = true;

        setupRealtimeUpdates();
        startJetStreamCycling();

        // Load initial data
        fetchFlightStateJSON();

        // Set base URL for images
        const baseUrl = window.location.hostname === 'localhost' ?
            'http://localhost:8080' : 'https://flight-info-board.vercel.app';

        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = baseUrl + img.getAttribute('data-src');
        });
    }

    function startJetStreamCycling() {
        let imageIndex = 1;
        setInterval(() => {
            const jetStreamImage = document.getElementById('jetstream-image');
            if (jetStreamImage) {
                jetStreamImage.src = `/Image/JetStream/JetStream${imageIndex}.png`;
                imageIndex = (imageIndex % 5) + 1;
            }
        }, 20);
    }

    // Start the application
    initialize();
});