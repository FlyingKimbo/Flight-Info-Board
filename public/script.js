document.addEventListener("DOMContentLoaded", function () {
    let initialETE = -1;
    let cloudOpacityInterval;
    let GreenbarPercentage = 0;
    let latestFlightData = null;

    function CreateNewRow(flightData) {
        const table = document.getElementById("flightTable");
        const newRow = document.createElement('tr');

        const aircraftCell = document.createElement('td');
        const flightNumberCell = document.createElement('td');
        const departureCell = document.createElement('td');
        const flightStatusCell = document.createElement('td');
        const destinationCell = document.createElement('td');

        aircraftCell.style.textAlign = 'center';
        const img = document.createElement('img');
        img.src = flightData.image || '';  // Ensure there's a fallback if image URL is missing
        img.alt = 'Aircraft Image';
        img.style.width = '100px';
        img.style.height = 'auto';
        aircraftCell.appendChild(img);
        aircraftCell.appendChild(document.createTextNode(` ${flightData.aircraft || 'N/A'}`));

        flightNumberCell.textContent = flightData.flightNumber || 'N/A';
        departureCell.textContent = flightData.departure || 'N/A';
        flightStatusCell.textContent = flightData.flightStatus || 'N/A';
        destinationCell.textContent = flightData.destination || 'N/A';

        newRow.appendChild(aircraftCell);
        newRow.appendChild(flightNumberCell);
        newRow.appendChild(departureCell);
        newRow.appendChild(flightStatusCell);
        newRow.appendChild(destinationCell);

        const blinkingClass = getBlinkingClass(flightData.flightStatus);
        if (blinkingClass) {
            setBlinkingClass(newRow, blinkingClass);
        }

        table.querySelector('tbody').appendChild(newRow);
    }

    async function fetchFlightData() {
        try {
            const response = await fetch('/data/flight-state.json');  // Ensure correct path to JSON file
            if (response.ok) {
                latestFlightData = await response.json();
                console.log('Fetched data:', latestFlightData);
                return latestFlightData;
            } else {
                console.error('Error fetching data:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }

    function updateTableFromJSON(data) {
        const tableBody = document.getElementById('flight-rows');
        tableBody.innerHTML = ''; // Clear existing rows
        data.forEach(flightData => {
            CreateNewRow(flightData);
        });
    }

    function updateETEbars(currentFlightKey, aircraftType) {
        if (initialETE === -1 || !latestFlightData) return;

        const flightData = latestFlightData[currentFlightKey];
        const eteBar = document.getElementById('ete-bar');
        const aircraftImage = document.getElementById('aircraft-image');
        const eteText = document.getElementById('ete-bar-text');
        const jetStreamImage = document.getElementById('jetstream-image');
        const cloudImage = document.getElementById('cloud-image');
        const precipImage = document.getElementById('precip-image');

        if (eteBar && flightData.DistToDestination !== undefined) {
            const etePercentage = Math.min((flightData.DistToDestination / initialETE) * 100, 100);
            GreenbarPercentage = etePercentage;
            eteBar.style.width = etePercentage + '%';
            eteBar.style.opacity = 1;

            const distanceText = flightData.DistToDestination + " KM";
            const combinedText = `${flightData.ETE_SRGS.trim()} | ${distanceText}`;
            eteText.textContent = combinedText;

            handleWeatherAnimations(cloudImage, precipImage, flightData.AmbientPRECIPSTATE, flightData.AirplaneInCloud);
        }
    }

    function handleWeatherAnimations(cloudImage, precipImage, precipState, airplaneInCloud) {
        cloudImage.style.opacity = airplaneInCloud === 1 ? 1 : 0;
        precipImage.style.opacity = (precipState === 4 || precipState === 8) ? 1 : 0;
        
        if (airplaneInCloud === 1 && !cloudOpacityInterval) {
            startCloudOpacityCycling(cloudImage);
        } else if (airplaneInCloud !== 1 && cloudOpacityInterval) {
            clearInterval(cloudOpacityInterval);
            cloudOpacityInterval = null;
        }
        
        precipImage.src = precipState === 4 ? '/Image/Precip/rain1.gif' : precipState === 8 ? '/Image/Precip/snow1.gif' : '';
    }

    function startCloudOpacityCycling(cloudImage) {
        let opacity = 0.3;
        let direction = 1;
        const increment = 0.01;
        const intervalTime = 30;

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
        }, intervalTime);
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

    function setBlinkingClass(row, blinkingClass) {
        for (let cell of row.cells) {
            cell.classList.add(blinkingClass);
        }
    }

    function getBlinkingClass(flightStatus) {
        switch (flightStatus) {
            case 'Boarding': return 'blinking-boarding';
            case 'Departed': return 'blinking-departed';
            case 'Enroute': return 'blinking-enroute';
            case 'Delayed': return 'blinking-delayed';
            case 'Landed': return 'blinking-landed';
            case 'Deboarding': return 'blinking-deboarding';
            default: return '';
        }
    }

    async function initialize() {
        // Fetch initial flight data and ETE
        const data = await fetchFlightData();
        if (data) {
            updateTableFromJSON(data);
            const currentFlightKey = Object.keys(data)[0];
            initialETE = data[currentFlightKey]?.StartDistance || -1;
            updateETEbars(currentFlightKey, data[currentFlightKey].CurrentFlight.split(' ')[0]);
        }

        // Sort the table by Flight Status on first load
        sortTable(3, 'asc');
        
        // Set intervals for data fetching and animations
        setInterval(async () => {
            const updatedData = await fetchFlightData();
            if (updatedData) {
                updateTableFromJSON(updatedData);
                const currentFlightKey = Object.keys(updatedData)[0];
                updateETEbars(currentFlightKey, updatedData[currentFlightKey].CurrentFlight.split(' ')[0]);
            }
        }, 5000);

        startJetStreamCycling();
    }

    function sortTable(columnIndex, dir = 'asc') {
        const table = document.getElementById("flightTable");
        const rows = Array.from(table.rows).slice(2); // Skip header and green bar rows
        const headers = table.getElementsByTagName("th");

        for (let header of headers) header.classList.remove("sort-asc", "sort-desc");

        rows.sort((a, b) => {
            const x = a.cells[columnIndex].textContent.trim().toLowerCase();
            const y = b.cells[columnIndex].textContent.trim().toLowerCase();
            if (x < y) return dir === 'asc' ? -1 : 1;
            if (x > y) return dir === 'asc' ? 1 : -1;
            return 0;
        });

        rows.forEach(row => table.querySelector('tbody').appendChild(row));
        headers[columnIndex].classList.add(dir === 'asc' ? "sort-asc" : "sort-desc");
    }

    initialize();
});
