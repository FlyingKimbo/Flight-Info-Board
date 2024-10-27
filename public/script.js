document.addEventListener("DOMContentLoaded", function () {
    let initialETE = -1;
    let cloudOpacityInterval;
    let GreenbarPercentage = 0;

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

    function updateETEbars(currentFlightKey, aircraftType) {
        if (initialETE === -1) return;

        fetch('/api/update-flight')
            .then(response => response.json())
            .then(data => {
                const flightData = data[currentFlightKey];
                if (!flightData) return;

                const eteBar = document.getElementById('ete-bar');
                const aircraftImage = document.getElementById('aircraft-image');
                const eteText = document.getElementById('ete-bar-text');
                const jetStreamImage = document.getElementById('jetstream-image');
                const cloudImage = document.getElementById('cloud-image');
                const precipImage = document.getElementById('precip-image');

                const etePercentage = Math.min((flightData.DistToDestination / initialETE) * 100, 100);
                eteBar.style.width = etePercentage + '%';
                eteBar.style.opacity = 1;

                const distanceText = flightData.DistToDestination + " KM";
                eteText.textContent = `${flightData.ETE_SRGS.trim()} | ${distanceText}`;
                eteText.style.opacity = 1;

                aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
                aircraftImage.style.opacity = 1;
                aircraftImage.style.left = `calc(${etePercentage}% - 20px)`;

                jetStreamImage.style.opacity = flightData.FlightStatus === 'Airborne' ? 1 : 0;

                cloudImage.style.opacity = flightData.AirplaneInCloud === 1 ? 1 : 0;
                precipImage.style.opacity = flightData.AmbientPRECIPSTATE === 4 || flightData.AmbientPRECIPSTATE === 8 ? 1 : 0;

                if (flightData.AmbientPRECIPSTATE === 4) {
                    precipImage.src = '/Image/Precip/rain1.gif';
                } else if (flightData.AmbientPRECIPSTATE === 8) {
                    precipImage.src = '/Image/Precip/snow1.gif';
                }
            })
            .catch(error => console.error('Error updating ETE bar:', error));
    }

    function fetchFlightStateJSON() {
        fetch('/data/flight-state.json')
            .then(response => response.json())
            .then(data => updateTableFromJSON(data))
            .catch(error => console.error('Error fetching flight state JSON:', error));
    }

    function updateTableFromJSON(data) {
        const tableBody = document.getElementById('flight-rows');
        tableBody.innerHTML = ''; // Clear existing rows
        data.forEach(flightData => CreateNewRow(flightData));
    }

    // Retain other original functions like `checkFlightStatus`, `fetchCurrentFlight`, etc.

    function initialize() {
        fetchFlightStateJSON();
        setInterval(() => {
            fetchFlightStateJSON();
            fetchCurrentFlight().then(currentFlightKey => updateETEbars(currentFlightKey, currentFlightKey.split(' ')[0]));
        }, 5000);
    }

    initialize();
});
