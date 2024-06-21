document.addEventListener("DOMContentLoaded", function () {
    let initialETE = -1;
    let aircraftStopped = false; // To track if the aircraft image should stop
    let lastImagePosition = null; // To store the last position of the aircraft image
    
    function fetchInitialETE() {
        fetch('/data/ETE_seconds_initial.txt')
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

   

    function updateETEbars(aircraftType) {
        
        if (initialETE === -1) {
            return;
        }
        fetch('/data/ETE_seconds.txt')
            .then(response => response.text())
            .then(data => {
                const eteData = data.split('\n').map(line => parseInt(line.trim())).filter(line => !isNaN(line));
                const eteBar = document.getElementById('ete-bar');
                const aircraftImage = document.getElementById('aircraft-image');
                const eteText = document.getElementById('ete-bar-text'); // ETE text element
                const aircraftImageDummy = document.getElementById('aircraft-image-dummy');
                const eteTextDummy = document.getElementById('ete-bar-text-dummy'); // ETE text element

                if (eteBar && eteData.length > 0) {
                    const ete = eteData[0];
                    const etePercentage = Math.min((ete / initialETE) * 100, 100);
                    eteBar.style.width = etePercentage + '%';
                    eteBar.style.opacity = 1; // Ensure the green bar is always visible

                    // Determine properties based on etePercentage using a switch statement
                    switch (true) {
                        

                        case (etePercentage >= 96 && etePercentage <= 100):
                            eteText.style.opacity = 0;
                            aircraftImage.style.opacity = 1;
                            updatePositions();
                            eteTextDummy.style.opacity = 0;
                            aircraftImageDummy.style.opacity = 0;
                            break;

                        case (etePercentage >= 5 && etePercentage < 96):
                            eteText.style.opacity = 1;
                            aircraftImage.style.opacity = 1;
                            updatePositions();
                            eteTextDummy.style.opacity = 0;
                            aircraftImageDummy.style.opacity = 0;
                            break;

                        case (etePercentage > 0 && etePercentage <= 5):
                            eteText.style.opacity = 0;
                            aircraftImage.style.opacity = 0;
                            eteTextDummy.style.opacity = 1;
                            aircraftImageDummy.style.opacity = 1;
                            break;

                        case (etePercentage <= 0):
                            eteText.style.opacity = 0;
                            aircraftImage.style.opacity = 0;
                            eteTextDummy.style.opacity = 0;
                            aircraftImageDummy.style.opacity = 0;
                            break;
                    }

                    aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`; // Set the appropriate aircraft image
                    aircraftImageDummy.src = `/Image/Aircraft_Type/${aircraftType}.png`; // Set the appropriate aircraft image
                    // Fetch ETE.txt for the text to display on the bar
                    fetch('/data/ETE.txt')
                        .then(response => response.text())
                        .then(text => {
                            eteText.textContent = text.trim(); // Update text content from ETE.txt
                            eteTextDummy.textContent = text.trim(); // Update text content from ETE.txt
                        })
                        .catch(error => console.error('Error fetching ETE text:', error));
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
        const imagePosition = barRight - (aircraftImage.offsetWidth / 4);
        aircraftImage.style.left = `${imagePosition}px`;
        aircraftImage.style.opacity = 1; // Make sure the image is visible

        // Update ETE text positioning 
        const textPosition = imagePosition + (aircraftImage.offsetWidth / -3) - (eteText.offsetWidth / 2);
        eteText.style.left = `${textPosition}px`;
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

        // Refresh the Greenbar function every 100 milliseconds
        setInterval(function () {
            fetchCurrentFlight().then(aircraftType => {
                updateETEbars(aircraftType);
            });
        }, 100);

        // Refresh the entire page every 20000 milliseconds
        setInterval(function () {
            location.reload();
        }, 20000);
    }

    initialize();
});
