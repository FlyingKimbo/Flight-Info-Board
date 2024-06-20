document.addEventListener("DOMContentLoaded", function () {
    let initialETE = -1;

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
                    updateETEbars();
                }
            })
            .catch(error => {
                console.error('Error fetching initial ETE data:', error);
            });
    }

    function updateETEbars() {
        if (initialETE === -1) {
            return;
        }
        fetch('/data/ETE_seconds.txt')
            .then(response => response.text())
            .then(data => {
                const eteData = data.split('\n').map(line => parseInt(line.trim())).filter(line => !isNaN(line));
                const eteBar = document.getElementById('ete-bar');
                if (eteBar && eteData.length > 0) {
                    const ete = eteData[0]; // Assuming the first line corresponds to the ETE value
                    console.log('Current ETE:', ete);

                    if (ete === -1) {
                        eteBar.style.width = '100%';
                        eteBar.style.opacity = 0;
                    } else if (ete > 0) {
                        const etePercentage = Math.min((ete / initialETE) * 100, 100);
                        console.log('ETE Percentage:', etePercentage);
                        eteBar.style.width = etePercentage + '%';
                        eteBar.style.opacity = 1;
                    } else {
                        eteBar.style.width = '0%';
                        eteBar.style.opacity = 0;
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching ETE data:', error);
                // Set opacity to 0 if fetching data fails
                const eteBar = document.getElementById('ete-bar');
                if (eteBar) {
                    eteBar.style.width = '0%';
                    eteBar.style.opacity = 0;
                }
            });
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
            updateETEbars();
        }, 100);

        // Refresh the entire page every 20000 milliseconds
        setInterval(function () {
            location.reload();
        }, 20000);
    }

    initialize();
});
