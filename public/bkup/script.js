document.addEventListener("DOMContentLoaded", function () {
    let initialETE = -1;
    let aircraftStopped = false; // To track if the aircraft image should stop
    let lastImagePosition = null; // To store the last position of the aircraft image
    let previousFlightStatus = null;
    let pageReloaded = false;

    function fetchInitialETE() {
        fetch('/data/StartDistance.txt')
            .then(response => response.text())
            .then(initialData => {
                initialETE = parseInt(initialData.trim());
                console.log('Initial ETE:', initialETE);
                if (initialETE === -1) {
                    console.log('ETE evaluation disabled.');
                } else if (isNaN(initialETE) || initialETE <= 0) {
                    console.error('Invalid initial ETE value.');
                    initialETE = -1; // Ensure we don't use invalid initial values
                } else {
                    fetchCurrentFlight().then(aircraftType => {
                        updateETEbars(aircraftType);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching initial ETE data:', error);
            });
    }

    function fetchCurrentFlight() {
        return fetch('/data/CurrentFlight.txt')
            .then(response => response.text())
            .then(data => {
                // Assuming the file contains the aircraft type and flight number separated by a space
                const [aircraftType, flightNumber] = data.trim().split(' ');
                return aircraftType;
            })
            .catch(error => {
                console.error('Error fetching current flight data:', error);
                return null;
            });
    }

    function fetchFlightStatus() {
        return fetch('/data/FlightStatus.txt')
            .then(response => response.text())
            .then(data => {
                // Assuming the file contains a single word representing the flight status
                const flightStatus = data.trim();
                return flightStatus;
            })
            .catch(error => {
                console.error('Error fetching Flight Status data:', error);
                return null;
            });
    }


    function checkFlightStatus() {
        fetchFlightStatus().then(currentFlightStatus => {
            if (currentFlightStatus !== null && currentFlightStatus !== previousFlightStatus && !pageReloaded) {
                pageReloaded = true; // Set the flag to true to prevent further reloads
                location.reload();   // Reload the page
            } else {
                previousFlightStatus = currentFlightStatus; // Update the previous flight status
            }
        });
    }

    setInterval(checkFlightStatus, 1000); // This sets the interval to check the flight status every 20 seconds
    /*
    function startJetStreamCycling() {
        let imageIndex = 1;
        setInterval(() => {
            const jetStreamImage = document.getElementById('jetstream-image');
            jetStreamImage.src = `/Image/JetStream/JetStream${imageIndex}.png`;
            imageIndex = (imageIndex % 3) + 1; // Cycle through 1 to 3
        }, 500); // Change image every 500ms
    }
    */
    function updateETEbars(aircraftType) {
        
        if (initialETE === -1) {
            return;
        }
        fetch('/data/DistToDestination.txt')
            .then(response => response.text())
            .then(data => {
                const eteData = data.split('\n').map(line => parseInt(line.trim())).filter(line => !isNaN(line));
                const eteBar = document.getElementById('ete-bar');
                const aircraftImage = document.getElementById('aircraft-image');
                const eteText = document.getElementById('ete-bar-text'); // ETE text element
                const aircraftImageDummy = document.getElementById('aircraft-image-dummy');
                const eteTextDummy = document.getElementById('ete-bar-text-dummy'); // ETE text element
                const jetstreamimage = document.getElementById('jetstream-image');

                if (eteBar && eteData.length > 0) {
                    const ete = eteData[0];
                    const etePercentage = Math.min((ete / initialETE) * 100, 100);
                    eteBar.style.width = etePercentage + '%';
                    eteBar.style.opacity = 1; // Ensure the green bar is always visible

                    // Determine properties based on etePercentage using a switch statement
                    switch (true) {
                        

                        case (etePercentage >= 97 && etePercentage <= 100):
                            eteText.style.opacity = 1;
                            aircraftImage.style.opacity = 1;
                            updatePositions();
                            eteTextDummy.style.opacity = 0;
                            aircraftImageDummy.style.opacity = 0;
                            break;

                        case (etePercentage >= 16 && etePercentage < 97):
                            eteText.style.opacity = 1;
                            aircraftImage.style.opacity = 1;
                            updatePositions();
                            eteTextDummy.style.opacity = 0;
                            aircraftImageDummy.style.opacity = 0;
                            break;

                        case (etePercentage > 0 && etePercentage <= 16):
                            eteText.style.opacity = 0;
                            aircraftImage.style.opacity = 0;
                            eteTextDummy.style.opacity = 1;
                            aircraftImageDummy.style.opacity = 1;
                            break;

                        case (etePercentage <= 0):
                            eteText.style.opacity = 0;
                            aircraftImage.style.opacity = 0;
                            eteTextDummy.style.opacity = 1;
                            aircraftImageDummy.style.opacity = 1;
                            break;
                    }

                    aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`; // Set the appropriate aircraft image
                    aircraftImageDummy.src = `/Image/Aircraft_Type/${aircraftType}.png`; // Set the appropriate aircraft image
                    // Fetch ETE.txt for the text to display on the bar
                    Promise.all([
                        fetch('/data/DistToDestination.txt').then(response => response.text()),
                        fetch('/data/ETE.txt').then(response => response.text())
                    ])
                        .then(([distText, eteTextA]) => {
                            const distanceText = distText.trim() + " KM";
                            const combinedText = `${eteTextA.trim()} | ${distanceText}`;
                            eteText.textContent = combinedText; // Update text content with combined ETE and Distance
                            eteTextDummy.textContent = combinedText; // Update text content with combined ETE and Distance
                        })
                        .catch(error => console.error('Error fetching data:', error));

                }
            })
            .catch(error => {
                console.error('Error fetching ETE data:', error);
                eteBar.style.width = '0%';
                eteBar.style.opacity = 0;
                aircraftImage.style.opacity = 0;
                eteText.style.opacity = 0;
            });
    }

    function updatePositions() {
        const eteBar = document.getElementById('ete-bar');
        const aircraftImage = document.getElementById('aircraft-image');
        const eteText = document.getElementById('ete-bar-text'); // ETE text element
        const barWidth = eteBar.getBoundingClientRect().width;
        const containerRight = eteBar.parentElement.getBoundingClientRect().right;
        const barRight = containerRight - barWidth;
        const imagePosition = barRight - (aircraftImage.offsetWidth / 1000) + 130;
        const textPosition = barRight - (eteText.offsetWidth / 1000) - 10;
        const jetstream_imagePosition = barRight - (jetstream.offsetWidth / 1000) + 130;
        aircraftImage.style.left = `${imagePosition}px`;
        eteText.style.left = `${textPosition}px`;
        jetstream.style.left = `${jetstream_imagePosition}px`;
        aircraftImage.style.opacity = 1; // Make sure the image is visible

        // Update ETE text positioning 
        //const textPosition = imagePosition + (aircraftImage.offsetWidth / 1.5) - (eteText.offsetWidth / -122);
        //eteText.style.left = `${textPosition}px`;
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

        // Fetch initial ETE value
        fetchInitialETE();

        // Automatically sort by Flight Status every 20000 milliseconds
        setInterval(function () {
            sortTable(3, localStorage.getItem('sortDirection') || 'asc'); // Sort by Flight Status (column index 3)
        }, 20000);

        // Refresh the Greenbar function every 1000 milliseconds
        setInterval(function () {
            fetchCurrentFlight().then(aircraftType => {
                updateETEbars(aircraftType);
            });
        }, 2000);
        
    }

    initialize();
});
