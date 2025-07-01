// Import Supabase at the top of your file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//import { createClient } from 'https://esm.sh/@supabase/supabase-js@1.35.7';
// Initialize Supabase
const supabaseUrl = 'https://jwwaxqfckxmppsncvfbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2F4cWZja3htcHBzbmN2ZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY2MzUsImV4cCI6MjA2NTk5MjYzNX0.6fdsBgcAmjG9uwVbkyKhLW3sc7uCa1rwGj8aWBFgkFo'
const supabase = createClient(supabaseUrl, supabaseKey)


let GreenbarPercentage = 100


// DOM elements from your HTML
const elements = {
    aircraftImage: document.querySelector('.flight-image'),
    aircraftName: document.querySelector('.flight-aircraft span'),
    flightNumber: document.querySelector('.flight-number'),
    departure: document.querySelector('.flight-departure'),
    status: document.querySelector('.flight-status'),
    destination: document.querySelector('.flight-destination'),
    eteBar: document.getElementById('ete-bar'),
    eteBarText: document.getElementById('ete-bar-text'),
    aircraftIcon: document.getElementById('aircraft-image'),
    jetstreamImage: document.getElementById('jetstream-image'),
    cloudImage: document.getElementById('cloud-image'),
    precipImage: document.getElementById('precip-image')
};



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
    /*
    // MODIFIED: Conditional blinking based on isStatic
    if (!isStatic) {
        const blinkingClass = getBlinkingClass(flightData.flightStatus);
        if (blinkingClass) {
            aircraftCell.classList.add(blinkingClass);
            flightNumberCell.classList.add(blinkingClass); // Only blink status cell
            departureCell.classList.add(blinkingClass); // Only blink status cell
            flightStatusCell.classList.add(blinkingClass); // Only blink status cell
            destinationCell.classList.add(blinkingClass); // Only blink status cell
        }
    }
    */
    const blinkingClass = getBlinkingClass(flightData.flightStatus);
    if (blinkingClass) {
        aircraftCell.classList.add(blinkingClass);
        flightNumberCell.classList.add(blinkingClass); // Only blink status cell
        departureCell.classList.add(blinkingClass); // Only blink status cell
        flightStatusCell.classList.add(blinkingClass); // Only blink status cell
        destinationCell.classList.add(blinkingClass); // Only blink status cell
    }

    // NEW: Add static flight class if needed
    if (isStatic) {
        newRow.classList.add('static-flight');
    }

    


    tbody.appendChild(newRow);
    return newRow; // Return the row for potential chaining

    

}



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







function updatePositions() {
    let Xoffset = 0;
    let XoffsetFix = 240;


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
    const imagePosition = barRight - (aircraftImage.offsetWidth / 1000) - 115 + (Xoffset * XoffsetFix);
    const textPosition = barRight - (eteText.offsetWidth / 1000) - 245 + (Xoffset * XoffsetFix);
    const jetstream_imagePosition = barRight - (jetstream.offsetWidth / 1000) - 250 + (Xoffset * XoffsetFix);
    const cloud_imagePosition = barRight - (cloud.offsetWidth / 1000) - 150 + (Xoffset * XoffsetFix);
    const precip_imagePosition = barRight - (precipImage.offsetWidth / 1000) - 110 + (Xoffset * XoffsetFix); // Position the precipitation image the same as cloud

    aircraftImage.style.left = `${imagePosition}px`;
    eteText.style.left = `${textPosition}px`;
    jetstream.style.left = `${jetstream_imagePosition}px`;
    cloud.style.left = `${cloud_imagePosition}px`;
    precipImage.style.left = `${precip_imagePosition}px`;

    //aircraftImage.style.opacity = 1; // Make sure the image is visible %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
}

const AnimationManager = {
    jetStreamInterval: null,
    cloudInterval: null,

    // Jet stream animation (still uses flight_state)
    startJetStreamCycling(flightState) {
        if (this.jetStreamInterval) clearInterval(this.jetStreamInterval);

        if (flightState === "Airborne") {
            let imageIndex = 1;
            this.jetStreamInterval = setInterval(() => {
                const img = document.getElementById('jetstream-image');
                if (img) {
                    img.src = `/Image/JetStream/JetStream${imageIndex}.png`;
                    img.style.opacity = '1';
                    imageIndex = (imageIndex % 5) + 1;
                }
            }, 20);
        } else {
            const img = document.getElementById('jetstream-image');
            if (img) img.style.opacity = '0';
        }
    },

    startCloudOpacityCycle(inCloud) {
        const cloud = document.getElementById('cloud-image');
        if (!cloud) return;

        // Set image source if not already set
        if (!cloud.src) {
            cloud.src = '/Image/Cloud/Cloud1.png'; // Ensure this path is correct
        }

        // Direct opacity control - no class toggle needed
        cloud.style.opacity = String(inCloud) === "1" ? '1' : '0';
    },


    // Update both animations
    updateAnimations(flightState, inCloud) {
        this.startJetStreamCycling(flightState);
       this.startCloudOpacityCycle(inCloud);
    },

    cleanup() {
        if (this.jetStreamInterval) clearInterval(this.jetStreamInterval);
       //if (this.cloudInterval) clearInterval(this.cloudInterval);
    }
};



function updateEteDist2ArrBar(flightData) {
    //console.log('Cloud element exists:', !!document.getElementById('cloud-image'));

    if (!flightData || !flightData.flight_state) {
        AnimationManager.cleanup();
        return;
    }
    try {
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
        console.log(`dist_to_destination at Update_ETE_Dist2Arr_Bar : ${flightData.dist_to_destination}`);
        console.log(`flight_state at Update_ETE_Dist2Arr_Bar : ${flightData.flight_state}`);
        console.log(`airplane_in_cloud at Update_ETE_Dist2Arr_Bar : ${flightData.airplane_in_cloud}`);
        

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

        // Inside updateEteDist2ArrBar, right after validating elements exist:
        const cloud = document.getElementById('cloud-image');
        if (cloud && !cloud.src) {
            cloud.src = '/Image/Cloud/Cloud1.png'; // Initialize if not set
        }

        // Single call handles both animations
        AnimationManager.updateAnimations(
            flightData.flight_state,      // For jet stream
            flightData.airplane_in_cloud  // For cloud (1 or 0)
        );

        for (const field of requiredFields) {
            if (flightData[field] === undefined) {
                console.error(`Missing required field: ${field}`);
                return;
            }
        }

        // Update ETE bar width
        const etePercentage = Math.min((flightData.dist_to_destination / flightData.start_distance) * 100, 100);
        GreenbarPercentage = etePercentage; // Update the global variable
        elements.eteBar.style.width = `${etePercentage}%`;
        updatePositions();
        elements.eteBar.style.opacity = '1';

        // Update aircraft image
        //const aircraftType = flightData.current_flight.split(' ')[0];
        //elements.aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
        //elements.aircraftImage.style.opacity = '1';

        // Handle aircraft image - MODIFIED SECTION
        const aircraftType = flightData.current_flight?.split(' ')[0] || '';
        if (flightData.flight_status === "Deboarding Completed") {
            
            // Special case for deboarding completed
            elements.aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
            elements.aircraftImage.style.opacity = '0';
            elements.eteText.textContent = `${flightData.ete_srgs.trim()} | ${flightData.dist_to_destination} KM`;
            elements.eteText.style.opacity = '0';
        } else if (aircraftType) {
            // Normal operation for other statuses
            elements.aircraftImage.src = `/Image/Aircraft_Type/${aircraftType}.png`;
            elements.aircraftImage.style.opacity = '1';
            // Update ETE text
            elements.eteText.textContent = `${flightData.ete_srgs.trim()} | ${flightData.dist_to_destination} KM`;
            elements.eteText.style.opacity = '1';
        }

        


        



        // Update precipitation
        elements.precipImage.src =
            flightData.ambient_precipstate === 4 ? '/Image/Precip/rain1.gif' :
                flightData.ambient_precipstate === 8 ? '/Image/Precip/snow1.gif' : '';
        elements.precipImage.style.opacity =
            [4, 8].includes(flightData.ambient_precipstate) ? '1' : '0';
       
    } catch (error) {
        console.error('Error updating ETE display:', error);
    }


    

  
}







// Map status to CSS class
const getBlinkingClass = (status) => {
    const statusMap = {
        'Boarding': 'blinking-boarding',
        'Departed': 'blinking-departed',
        'Enroute': 'blinking-enroute',
        'Delayed': 'blinking-delayed',
        'Landed': 'blinking-landed',
        'Deboarding': 'blinking-deboarding'
    };
    return statusMap[status] || '';
};





// Set up realtime subscription
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



let realtime_aircraft = null;
let realtime_flightnumber = null;
let realtime_departure = null;
let realtime_flightstatus = null;

const setupRealtimeUpdates = () => {
    return supabase
        .channel('flight-updates')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'flights_realtime'
        }, (payload) => {
            // Safely update ETE (if payload.new exists)
            if (payload.new) updateEteDist2ArrBar(payload.new);

            // Safely split flight number (fallback to [null, null])
            [realtime_aircraft, realtime_flightnumber] =
                payload.current_flight?.split(' ') || [];

            // Explicitly set departure (fallback to null)
            realtime_departure = payload.arr_display ?? null;
            realtime_flightstatus = payload.flight_status ?? null;
            
        })
        .subscribe();
};

let hasRows = false; // Track if we had rows initially
const setupStaticRealtimeUpdates = () => {
    return supabase
        .channel('flight-updates-static')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'flights_static'
        }, (payload) => {

            // Check table count after each change
            supabase
                .from('flights_static')
                .select('*', { count: 'exact', head: true })
                .then(({ count }) => {
                    const nowHasRows = count > 0;

                    // If we previously had rows but now don't
                    if (hasRows && !nowHasRows) {
                        // Visual feedback before refresh
                        document.body.style.opacity = '0.7';
                        document.body.style.transition = 'opacity 0.5s';

                        // Refresh after delay
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }

                    // Update our tracking
                    hasRows = nowHasRows;
                });
            // Original logic (preserved exactly)
            if (payload.eventType === 'INSERT') {

                supabase
                    .from('flights_static')
                    .select('*', { count: 'exact', head: true })
                    .then(({ count }) => {
                        if (count === 1) {  // Was empty, now has 1 row
                            // Optional: Add visual feedback
                            document.body.classList.add('page-refreshing');

                            // Refresh after delay
                            setTimeout(() => {
                                window.location.reload();
                            }, 100);
                        }
                    });



                CreateNewRow({
                    aircraft: payload.new.aircraft,
                    flightNumber: payload.new.flightnumber,
                    departure: payload.new.departure,
                    flightStatus: payload.new.flightstatus,
                    destination: payload.new.destination,
                    image: `/Image/Aircraft_Type/${payload.new.aircraft}.png` // Original path
                }, true);

                // NEW: Remove default image when first row arrives (non-intrusive)
                const defaultImg = document.querySelector('#flight-image-container .flight-image[src*="default.png"]');
                if (defaultImg) defaultImg.remove();
            } else {

                // NEW: Special handling for Deboarding Completed -> - transition
                if (payload.old?.flightstatus === "Deboarding Completed" &&
                    payload.new.flightstatus === "-") {
                    const row = findMatchingFlightRow(payload.new.aircraft, payload.new.flightnumber);
                    if (row) {
                        // Clone and replace row to reset DOM state
                        const newRow = row.cloneNode(true);
                        row.parentNode.replaceChild(newRow, row);
                        void newRow.offsetWidth; // Force reflow
                    }
                }



                Update_cells_values(payload.new); // Original update logic
            }
        })
        .subscribe();
};

function Update_cells_values(staticData) {
    if (!staticData) return;

    // Convert data names to match your CreateNewRow expectations
    const flightPayload = {
        aircraft: staticData.aircraft,
        flightNumber: staticData.flightnumber,
        departure: staticData.departure, 
        flightStatus: staticData.flightstatus,
        destination: staticData.destination,
        image: `/Image/Aircraft_Type/${staticData.aircraft || 'default'}.png`
    };
    
    const existingRow = findMatchingFlightRow(flightPayload.aircraft, flightPayload.flightNumber);
    
    if (existingRow) {
        updateFlightRow(existingRow, flightPayload);
    } else {
        flightPayload.departure = flightPayload.destination;
        // Add slight delay to allow DOM to settle
        setTimeout(() => {
            CreateNewRow(flightPayload, true);
            console.log('Created new row for:', flightPayload.flightNumber);
        }, 2000);
    }
}

// Helper function to find matching row
function findMatchingFlightRow(aircraft, flightNumber) {
    const rows = document.querySelectorAll('#flightTable tbody tr');
    for (const row of rows) {
        const rowAircraft = row.cells[0]?.textContent.trim().replace(/^[^\w]*/, '');
        const rowFlightNumber = row.cells[1]?.textContent.trim();
        

        if (rowAircraft === aircraft &&
            rowFlightNumber === flightNumber) {
            // Safely update if flightData exists
            
            return row;
        }
    }
    return null;
}

// Helper function to update row cells

function refreshRowAfterDeboarding(row) {
    // 1. Clone the row to reset DOM state
    const newRow = row.cloneNode(true);
    row.parentNode.replaceChild(newRow, row);

    // 2. Force reflow to ensure animations restart
    void newRow.offsetWidth;

    return newRow; // Return the fresh row
}

function updateFlightRow(row, flightData) {
    console.log('🟢 DEBUG updateFlightRow:', flightData.flightStatus);
    
    // First check if status is changing
    const statusCell = row.cells[3];
    const isStatusChanging = statusCell && statusCell.textContent !== flightData.flightStatus;

    

    // Check for non-blink statuses
    const shouldRemoveBlinking =
        flightData.flightStatus === null ||
        flightData.flightStatus === "-" ||
        flightData.flightStatus === "Deboarding Completed";

   

    // 1. FORCE REMOVE BLINKING FIRST if needed
    if (shouldRemoveBlinking) {
        console.log('🛑 Removing blinking for status:', flightData.flightStatus);

        // Add delay before removal
        setTimeout(() => {
            // Nuclear class removal
            [row, ...row.cells].forEach(element => {
                element.className = element.className
                    .split(' ')
                    .filter(cls => !cls.startsWith('blink-'))
                    .join(' ');

                // Force stop animations
                element.style.animation = 'none';
                void element.offsetWidth; // Trigger reflow
            });

            console.log('Blinking removed after delay');
        }, 3000); // 300ms delay to allow ongoing animation to complete
        
        // Refresh after delay
        //setTimeout(() => {
         //   window.location.reload();
        //}, 1000);

        updateCellsAfterBlinking(row, flightData);
        return;
    }
    
    // 1. Aircraft Cell (cell[0])
    const aircraftCell = row.cells[0];
    if (aircraftCell) {
        // Find the existing image and text elements
        const img = aircraftCell.querySelector('img');
        let textSpan = aircraftCell.querySelector('span');

        // If span doesn't exist, create it
        if (!textSpan && img && img.parentNode === aircraftCell.querySelector('.cell-content')) {
            textSpan = document.createElement('span');
            img.parentNode.appendChild(textSpan);
        }

        // Update only if text changed
        if (textSpan && textSpan.textContent.trim() !== flightData.aircraft) {
            textSpan.textContent = ` ${flightData.aircraft}`;
        }
    }

    // 2. Flight Number (cell[1])
    const flightNumberCell = row.cells[1];
    if (flightNumberCell && flightNumberCell.textContent !== flightData.flightNumber) {
        flightNumberCell.textContent = flightData.flightNumber;
    }

    // 3. Departure (cell[2])
    const departureCell = row.cells[2];
    if (departureCell && departureCell.textContent !== flightData.departure) {
        departureCell.textContent = flightData.departure;
    }

    // 4. Status (cell[3]) - Main trigger
    if (statusCell && statusCell.textContent !== flightData.flightStatus) {
        statusCell.textContent = flightData.flightStatus;
    }

    // 5. Destination (cell[4])
    const destinationCell = row.cells[4];
    if (destinationCell && destinationCell.textContent !== flightData.destination) {
        destinationCell.textContent = flightData.destination;
    }

    // Apply blinking to all cells if status changed AND not in non-blink statuses
    if (isStatusChanging &&
        !shouldRemoveBlinking &&
        flightData.flightStatus &&
        flightData.flightStatus !== "-") {

        const blinkingClass = getBlinkingClass(flightData.flightStatus);
        if (blinkingClass) {
            // Blink all cells in the row
            for (let i = 0; i < row.cells.length; i++) {
                row.cells[i].className = '';
                row.cells[i].classList.add(blinkingClass);

                // Keep image visible in aircraft cell
                if (i === 0) {
                    const img = row.cells[i].querySelector('img');
                    if (img) img.style.display = 'inline';
                }
            }
        }
    }
    //updateCellsAfterBlinking(row, flightData);
    //row.classList.add('row-updated');
    //setTimeout(() => row.classList.remove('row-updated'), 1000);
}

function updateCellsAfterBlinking(row, flightData) {
    // 1. Handle aircraft cell (cell 0) separately to prevent duplication
    const aircraftCell = row.cells[0];
    if (aircraftCell) {
        // Clear existing content but preserve the image
        const existingImg = aircraftCell.querySelector('img');
        aircraftCell.innerHTML = ''; // Clear all content

        // Re-add the image if it exists
        if (existingImg) {
            aircraftCell.appendChild(existingImg);
        } else {
            // Create new image if missing
            const img = document.createElement('img');
            img.src = flightData.image || '/default-aircraft.png';
            img.alt = 'Aircraft';
            img.style.cssText = 'width:100px;height:auto;display:inline-block;';
            aircraftCell.appendChild(img);
        }

        // Add aircraft name text (only once)
        const aircraftText = document.createTextNode(` ${flightData.aircraft || ''}`);
        aircraftCell.appendChild(aircraftText);
    }

    // 2. Update other cells (1-4)
    const cellsToUpdate = {
        1: flightData.flightNumber,
        2: flightData.departure,
        3: flightData.flightStatus,
        4: flightData.destination
    };

    Object.entries(cellsToUpdate).forEach(([index, value]) => {
        const cellIndex = parseInt(index);
        if (row.cells[cellIndex] && value !== undefined) {
            row.cells[cellIndex].textContent = value;
        }
    });

    // 3. Remove any residual blinking classes from all cells
    Array.from(row.cells).forEach(cell => {
        cell.className = cell.className
            .split(' ')
            .filter(cls => !cls.startsWith('blink-'))
            .join(' ');
        cell.style.animation = 'none';
    });

     //4. Visual feedback
    row.classList.add('blink-updated');
    setTimeout(() => row.classList.remove('blink-updated'), 500);
}




// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Check if flights table is empty
        const { data } = await supabase
            .from('flights_static')
            .select('*')
            .limit(1);

        // 2. Only proceed if table is empty AND image element exists
        const flightImage = document.querySelector('.cell-content .flight-image');
        if (data?.length === 0 && flightImage) {
            // 3. Set the image source (use full path if needed)
            flightImage.src = "/Image/Aircraft_Type/default.png";
            flightImage.alt = "Default Aircraft";

            // 4. Optional: Update the status text
            const statusText = document.querySelector('.cell-content span');
            if (statusText) {
                statusText.textContent = "Waiting for Happiness";
            }
        }
    } catch (error) {
        console.error("Error checking flights:", error);
    }



    fetch_flight_static();
    
    // First load initial data
    supabase
        .from('flights_realtime')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
     

    // Then set up realtime updates
    
    
    supabase
        .from('flights_static')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    
        
    setupRealtimeUpdates();
    setupStaticRealtimeUpdates(); // Cell-level updates
});