document.addEventListener("DOMContentLoaded", function () {
    let initialETE = -1;
    let cloudOpacityInterval;
    let GreenbarPercentage = 0;
    let flightChannel = null; // Store channel reference globally
    let isInitialized = false;

    // ======================= SUPABASE INTEGRATION START =======================
    const SUPABASE_URL = 'https://jwwaxqfckxmppsncvfbo.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo';

    // Initialize client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Unified processing function
    function processFlightData(payload, source) {
        try {
            console.log('Processing:', source, payload);

            // Convert payload to consistent format
            const flightData = {
                CurrentFlight: payload.new?.current_flight || payload.new?.CurrentFlight || payload.CurrentFlight,
                FlightStatus: payload.new?.flight_status || payload.new?.FlightStatus || payload.FlightStatus,
                OBSArrDisplay: payload.new?.obs_arr_display || payload.new?.OBSArrDisplay || payload.OBSArrDisplay,
                OBSDepDisplay: payload.new?.obs_dep_display || payload.new?.OBSDepDisplay || payload.OBSDepDisplay,
                DistToDestination: payload.new?.dist_to_destination || payload.new?.DistToDestination || payload.DistToDestination,
                ETE_SRGS: payload.new?.ete_srgs || payload.new?.ETE_SRGS || payload.ETE_SRGS,
                StartDistance: payload.new?.start_distance || payload.new?.StartDistance || payload.StartDistance,
                AirplaneInCloud: payload.new?.airplane_in_cloud || payload.new?.AirplaneInCloud || payload.AirplaneInCloud,
                AmbientPRECIPSTATE: payload.new?.ambient_precip_state || payload.new?.AmbientPRECIPSTATE || payload.AmbientPRECIPSTATE,
                AmbientVISIBILITY: payload.new?.ambient_visibility || payload.new?.AmbientVISIBILITY || payload.AmbientVISIBILITY,
                Flight_State: payload.new?.flight_state || payload.new?.Flight_State || payload.Flight_State
            };

            // Original processing logic
            if (source === 'database') {
                CreateNewRow({
                    aircraft: flightData.CurrentFlight.split(' ')[0],
                    flightNumber: flightData.CurrentFlight.split(' ')[1],
                    departure: flightData.OBSDepDisplay,
                    destination: flightData.OBSArrDisplay,
                    flightStatus: flightData.FlightStatus,
                    image: `/Image/Aircraft_Type/${flightData.CurrentFlight.split(' ')[0]}.png`
                });
            }

            updateFlightCells(
                flightData.CurrentFlight,
                flightData.FlightStatus,
                flightData.OBSArrDisplay,
                flightData.OBSDepDisplay
            );

            if (initialETE === -1 && flightData.StartDistance > 0) {
                initialETE = flightData.StartDistance;
            }

            if (flightData.CurrentFlight) {
                updateETEbars(flightData.CurrentFlight.split(' ')[1], flightData.CurrentFlight.split(' ')[0]);
            }

            if (flightData.FlightStatus === "Deboarding Completed") {
                removeBlinking(flightData.CurrentFlight);
            } else if (flightData.FlightStatus) {
                setBlinking(flightData.CurrentFlight, flightData.FlightStatus);
            }
        } catch (error) {
            console.error('Error processing flight data:', error);
        }
    }

    // Initialize realtime
    function setupRealtimeUpdates() {
        if (flightChannel) return;

        try {
            // Single channel for both database changes and broadcasts
            flightChannel = supabase.channel('flight_updates')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'flights'
                    },
                    (payload) => {
                        processFlightData(payload, 'database');
                    }
                )
                .on(
                    'broadcast',
                    { event: 'flight_update' },
                    (payload) => {
                        processFlightData(payload, 'broadcast');
                    }
                )
                .subscribe((status, err) => {
                    if (err) {
                        console.error('Realtime subscription error:', err);
                        flightChannel = null;
                    }
                    if (status === 'SUBSCRIBED') {
                        console.log('Realtime connected!');
                    }
                    if (status === 'CLOSED') {
                        console.log('Realtime disconnected');
                        flightChannel = null;
                    }
                });
        } catch (error) {
            console.error('Error setting up realtime:', error);
            flightChannel = null;
        }
    }

    // ======================= SUPABASE INTEGRATION END =======================

    function CreateNewRow(flightData) {
        const table = document.getElementById("flightTable");
        const newRow = document.createElement('tr');

        const aircraftCell = document.createElement('td');
        const flightNumberCell = document.createElement('td');
        const departureCell = document.createElement('td');
        const flightStatusCell = document.createElement('td');
        const destinationCell = document.createElement('td');

        // Add content to the new cells
        aircraftCell.style.textAlign = 'center';
        const img = document.createElement('img');
        img.src = flightData.image;
        img.alt = 'Aircraft Image';
        img.style.width = '100px';
        img.style.height = 'auto';
        aircraftCell.appendChild(img);
        aircraftCell.appendChild(document.createTextNode(` ${flightData.aircraft}`));

        flightNumberCell.textContent = flightData.flightNumber;
        departureCell.textContent = flightData.departure;
        flightStatusCell.textContent = flightData.flightStatus;
        destinationCell.textContent = flightData.destination;

        newRow.appendChild(aircraftCell);
        newRow.appendChild(flightNumberCell);
        newRow.appendChild(departureCell);
        newRow.appendChild(flightStatusCell);
        newRow.appendChild(destinationCell);

        const blinkingClass = getBlinkingClass(flightData.flightStatus);
        if (blinkingClass) {
            newRow.classList.add(blinkingClass);
        }

        table.querySelector('tbody').appendChild(newRow);
    }

    function fetchFlightStateJSON() {
        fetch('/data/flight-state.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched data:', data); // Log the fetched data
                updateTableFromJSON(data);
            })
            .catch(error => {
                console.error('Error fetching flight state JSON:', error);
            });
    }

    function updateTableFromJSON(data) {
        const tableBody = document.getElementById('flight-rows');
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(flightData => {
            CreateNewRow(flightData);
        });
    }
    /*
    function checkFlightStatus() {
        fetch('/api/update-flight')
            .then(response => response.json())
            .then(data => {
                const currentFlightKey = Object.keys(data)[0];
                const flightData = data[currentFlightKey];
                const currentFlightStatus = flightData.FlightStatus;
                const currentFlight = flightData.CurrentFlight;

                let matchFound = updateFlightCells(currentFlight, flightData.FlightStatus, flightData.OBSArrDisplay);
                if (!matchFound) {
                    //CreateNewRow(flightData);
                    window.location.reload();
                   

                }

                if (currentFlightStatus === "Deboarding Completed") {
                    removeBlinking(currentFlight);
                    updateFlightCells(currentFlight, "-", "-", flightData.OBSArrDisplay);
                } else {
                    setBlinking(currentFlight, currentFlightStatus);
                    updateFlightCells(currentFlight, flightData.FlightStatus, flightData.OBSArrDisplay);
                }
            })
            .catch(error => {
                console.error('Error checking flight status:', error);
            });
    }

    setInterval(checkFlightStatus, 5000); // This sets the interval to check the flight status every 5 seconds
    */
    // Modified to use already-processed flight data
    function fetchInitialETE() {
        // Listen for the first realtime update that contains StartDistance
        const initialETESubscription = supabase.channel('initial-ete-fetch')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'flights'
            }, (payload) => {
                const flightData = processFlightData(payload, 'initialLoad');

                if (flightData.StartDistance > 0) {
                    initialETE = flightData.StartDistance;
                    console.log('Initial ETE set from realtime update:', initialETE);
                    initialETESubscription.unsubscribe(); // Stop listening after we get our value

                    // Trigger first ETE update
                    const [aircraftType, flightNumber] = flightData.CurrentFlight.split(' ');
                    updateETEbars(flightNumber, aircraftType);
                }
            })
            .subscribe();

        // Fallback: Query if no realtime update comes quickly
        setTimeout(() => {
            if (initialETE === -1) { // If we still haven't gotten a value
                supabase
                    .from('flights')
                    .select('CurrentFlight, StartDistance')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()
                    .then(({ data }) => {
                        if (data?.StartDistance > 0) {
                            initialETE = data.StartDistance;
                            console.log('Initial ETE set from direct query:', initialETE);
                        }
                    })
                    .finally(() => initialETESubscription.unsubscribe());
            }
        }, 2000); // Wait 2 seconds before fallback
    }

    function fetchCurrentFlight() {
        return fetch('/api/update-flight')
            .then(response => response.json()) // Assuming the response is JSON
            .then(data => {
                const currentFlightKey = Object.keys(data)[0];
                const currentFlight = data[currentFlightKey].CurrentFlight;
                console.log('Fetched Current Flight:', currentFlight);
                return currentFlight;
            })
            .catch(error => {
                console.error('Error fetching current flight data:', error);
                return null;
            });
    }

    function fetchFlightData() {
        const displayElement = document.getElementById('flight-data');
        if (!displayElement) return;

        fetch('/api/update-flight')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                displayElement.textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => {
                displayElement.textContent = 'Error: ' + error.message;
            });
    }


    // Fetch data every 5 seconds
    setInterval(fetchFlightData, 5000);

    function fetchAirplaneInCloud() {
        return fetch('/api/update-flight')
            .then(response => response.json()) // Parse the response as JSON
            .then(data => {
                const currentFlightKey = Object.keys(data)[0];
                const airplaneInCloud = data[currentFlightKey].AirplaneInCloud;
                console.log('Airplane In Cloud:', airplaneInCloud);
                return airplaneInCloud;
            })
            .catch(error => {
                console.error('Error fetching AirplaneInCloud status data:', error);
                return null;
            });
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

    function fetchFlight_State() {
        return fetch('/api/update-flight')
            .then(response => response.json()) // Parse the response as JSON
            .then(data => {
                const currentFlightKey = Object.keys(data)[0];
                const flightState = data[currentFlightKey].Flight_State;
                console.log('Flight State:', flightState);
                return flightState;
            })
            .catch(error => {
                console.error('Error fetching Flight_State data:', error);
                return null;
            });
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

    function updateETEbars(flightData) {
        if (initialETE === -1) {
            return;
        }

        // No API fetch needed - flightData comes directly from Supabase
        console.log('Flight data for update:', flightData);

        if (!flightData) {
            console.error('Current flight data is missing.');
            return;
        }

        const eteData = flightData.DistToDestination;
        const eteBar = document.getElementById('ete-bar');
        const aircraftImage = document.getElementById('aircraft-image');
        const eteText = document.getElementById('ete-bar-text');
        const jetStreamImage = document.getElementById('jetstream-image');
        const cloudImage = document.getElementById('cloud-image');
        const precipImage = document.getElementById('precip-image');

        if (eteBar && eteData !== undefined) {
            const ete = eteData;
            const etePercentage = Math.min((ete / initialETE) * 100, 100);
            GreenbarPercentage = etePercentage;
            console.log('ETE Percentage:', etePercentage);
            eteBar.style.width = etePercentage + '%';
            eteBar.style.opacity = 1;

            // Directly use flightData instead of fetchAirplaneInCloud()
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

            switch (true) {
                case (etePercentage > 0 && etePercentage <= 100):
                    eteText.style.opacity = 1;
                    aircraftImage.style.opacity = 1;
                    updatePositions();

                    // Directly use flightData instead of fetchFlight_State()
                    if (flightData.Flight_State) {
                        if (flightData.Flight_State.includes('Landed')) {
                            jetStreamImage.style.opacity = 0;
                        } else if (flightData.Flight_State.includes('Airborne')) {
                            updatePositions();
                            jetStreamImage.style.opacity = 1;
                        }
                    }
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
                    break;
            }

            const [aircraftType] = flightData.CurrentFlight.split(' ');
            aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
            cloudImage.src = `/Image/Cloud/Cloud1.png`;

            const distanceText = flightData.DistToDestination + " KM";
            const combinedText = `${flightData.ETE_SRGS.trim()} | ${distanceText}`;
            eteText.textContent = combinedText;

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
    }

    // Error handling now happens in the calling function

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

    function initialize() {
        if (isInitialized) return;
        isInitialized = true;

        setupRealtimeUpdates();
        fetchFlightStateJSON();

        const baseUrl = window.location.hostname === 'localhost' ?
            'http://localhost:8080' : 'https://flight-info-board.vercel.app';

        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = baseUrl + img.getAttribute('data-src');
        });

        startJetStreamCycling();

        // Start periodic checks
        //setInterval(checkFlightStatus, 5000);
        setInterval(fetchFlightData, 5000);
    }

    initialize();
});
