// API data - will be populated from fetch
let apiData = null;

// State management
let state = {
    selectedVessels: [],
    selectedCharterTypes: [],
    selectedCharterers: [],
    expandedVoyages: [],
    filteredVoyages: [],
    currentView: 'dashboard', // 'dashboard' or 'voyage-details'
    currentVoyageId: null,
    isLoading: true
};

// Initialize DOM elements after the page is loaded
let dashboardElements = {};
let voyageDetailsElements = {};

// Fetch data from API with fallback to dummy data
async function fetchVoyageData() {
    try {
        console.log("Fetching data from API...");
        state.isLoading = true;
        
        const response = await fetch('/api/voyage/');
        
        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        // Parse the JSON response
        const apiResponse = await response.json();
        console.log("API data loaded successfully:", apiResponse);
        
        // Transform API data to match the expected format
        const transformedData = {
            vessels: apiResponse.vessels ? apiResponse.vessels.map(vessel => ({
                id: vessel.id,
                name: vessel.vesselname || vessel.name, // Map vesselname to name, fallback to name if exists
                active: vessel.active !== undefined ? vessel.active : true // Default to true if not provided
            })) : dummyAPI.vessels,
            // Keep other data as is or use dummy data as fallback
            charterTypes: apiResponse.charterTypes || dummyAPI.charterTypes,
            charterers: apiResponse.charterers || dummyAPI.charterers,
            voyages: apiResponse.voyages || dummyAPI.voyages
        };
        
        // Return the transformed data
        state.isLoading = false;
        return transformedData;
    } catch (error) {
        // Log the error and fall back to dummy data
        console.warn("Failed to fetch data from API, using dummy data instead:", error);
        console.log("Using dummy data:", dummyAPI);
        
        state.isLoading = false;
        return dummyAPI;
    }
}

// Initialize the application
async function initApp() {
    console.log("Initializing app...");
    
    // Get DOM elements
    dashboardElements = {
        totalVessels: document.getElementById('svt-total-vessels'),
        activeVoyages: document.getElementById('svt-active-voyages'),
        atPort: document.getElementById('svt-at-port'),
        atSea: document.getElementById('svt-at-sea'),
        vesselFilters: document.getElementById('svt-vessel-filters'),
        charterTypeFilters: document.getElementById('svt-charter-type-filters'),
        chartererFilters: document.getElementById('svt-charterer-filters'),
        voyagesList: document.getElementById('svt-voyages-list')
    };

    voyageDetailsElements = {
        container: document.getElementById('svt-voyage-details'),
        title: document.getElementById('svt-voyage-details-title'),
        backButton: document.getElementById('svt-back-button'),
        infoGrid: document.getElementById('svt-voyage-info-grid'),
        routeList: document.getElementById('svt-route-list'),
        progressContainer: document.getElementById('svt-progress-container')
    };
    
    // Check if elements exist
    console.log("Dashboard elements:", dashboardElements);
    console.log("Voyage details elements:", voyageDetailsElements);
    
    // Fetch data from API (or use dummy data if API fails)
    apiData = await fetchVoyageData();
    
    // Initialize filters with all active vessels selected
    state.selectedVessels = apiData.vessels.filter(v => v.active).map(v => v.id);
    state.selectedCharterTypes = apiData.charterTypes.map(ct => ct.id);
    state.selectedCharterers = apiData.charterers.map(c => c.id);
    
    // Render the UI
    renderFilters();
    updateFilteredVoyages();
    renderScoreCards();
    renderVoyagesList();
    
    // Set up event listeners
    if (voyageDetailsElements.backButton) {
        voyageDetailsElements.backButton.addEventListener('click', navigateToDashboard);
    }
}

// Filter functions
function updateFilteredVoyages() {
    if (!apiData) return;
    
    state.filteredVoyages = apiData.voyages.filter(
        voyage => 
            state.selectedVessels.includes(voyage.vesselId) &&
            state.selectedCharterTypes.includes(voyage.charterTypeId) &&
            state.selectedCharterers.includes(voyage.chartererId)
    );
}

function toggleVesselFilter(id) {
    if (state.selectedVessels.includes(id)) {
        state.selectedVessels = state.selectedVessels.filter(vesselId => vesselId !== id);
    } else {
        state.selectedVessels.push(id);
    }
    updateFilteredVoyages();
    renderScoreCards();
    renderVoyagesList();
    renderFilters();
}

function toggleCharterTypeFilter(id) {
    if (state.selectedCharterTypes.includes(id)) {
        state.selectedCharterTypes = state.selectedCharterTypes.filter(charterTypeId => charterTypeId !== id);
    } else {
        state.selectedCharterTypes.push(id);
    }
    updateFilteredVoyages();
    renderVoyagesList();
    renderFilters();
}

function toggleChartererFilter(id) {
    if (state.selectedCharterers.includes(id)) {
        state.selectedCharterers = state.selectedCharterers.filter(chartererId => chartererId !== id);
    } else {
        state.selectedCharterers.push(id);
    }
    updateFilteredVoyages();
    renderVoyagesList();
    renderFilters();
}

// Voyage functions
function toggleVoyage(id) {
    if (state.expandedVoyages.includes(id)) {
        state.expandedVoyages = state.expandedVoyages.filter(voyageId => voyageId !== id);
    } else {
        state.expandedVoyages.push(id);
    }
    renderVoyagesList();
}

// Updated function to redirect to Django URL
function navigateToVoyageDetails(voyageId) {
    if (!apiData) {
        console.error('API data not loaded. Cannot navigate to voyage details.');
        return;
    }

    // Find the voyage to get its vessel ID
    const voyage = apiData.voyages.find(v => v.id === voyageId);
    
    if (voyage) {
        // Construct the URL with query parameters
        const url = `/ifs/voy-details/?vessel_id=${voyage.vesselId}&voyage_id=${voyageId}`;
        
        // Redirect to the URL
        window.location.href = url;
    } else {
        console.error(`Voyage with ID ${voyageId} not found`);
    }
}

function navigateToDashboard() {
    state.currentView = 'dashboard';
    const container = document.querySelector('.svt-container');
    if (container) container.style.display = 'block';
    if (voyageDetailsElements.container) voyageDetailsElements.container.style.display = 'none';
}

// Render functions
function renderFilters() {
    console.log("Rendering filters...");
    
    if (!apiData) {
        console.warn("Cannot render filters: API data not loaded");
        return;
    }
    
    // Render vessel filters
    if (dashboardElements.vesselFilters) {
        dashboardElements.vesselFilters.innerHTML = '';
        apiData.vessels.forEach(vessel => {
            const isChecked = state.selectedVessels.includes(vessel.id);
            dashboardElements.vesselFilters.innerHTML += `
                <div class="svt-filter-item" onclick="toggleVesselFilter(${vessel.id})">
                    <div class="svt-filter-checkbox ${isChecked ? 'checked' : ''}">
                        ${isChecked ? '✓' : ''}
                    </div>
                    <label class="svt-filter-label">${vessel.name}</label>
                </div>
            `;
        });
    } else {
        console.error("Vessel filters element not found");
    }

    // Render charter type filters
    if (dashboardElements.charterTypeFilters) {
        dashboardElements.charterTypeFilters.innerHTML = '';
        apiData.charterTypes.forEach(charterType => {
            const isChecked = state.selectedCharterTypes.includes(charterType.id);
            dashboardElements.charterTypeFilters.innerHTML += `
                <div class="svt-filter-item" onclick="toggleCharterTypeFilter(${charterType.id})">
                    <div class="svt-filter-checkbox ${isChecked ? 'checked' : ''}">
                        ${isChecked ? '✓' : ''}
                    </div>
                    <label class="svt-filter-label">${charterType.name}</label>
                </div>
            `;
        });
    } else {
        console.error("Charter type filters element not found");
    }

    // Render charterer filters
    if (dashboardElements.chartererFilters) {
        dashboardElements.chartererFilters.innerHTML = '';
        apiData.charterers.forEach(charterer => {
            const isChecked = state.selectedCharterers.includes(charterer.id);
            dashboardElements.chartererFilters.innerHTML += `
                <div class="svt-filter-item" onclick="toggleChartererFilter(${charterer.id})">
                    <div class="svt-filter-checkbox ${isChecked ? 'checked' : ''}">
                        ${isChecked ? '✓' : ''}
                    </div>
                    <label class="svt-filter-label">${charterer.name}</label>
                </div>
            `;
        });
    } else {
        console.error("Charterer filters element not found");
    }
}

function renderScoreCards() {
    console.log("Rendering score cards...");
    
    if (!apiData) {
        console.warn("Cannot render score cards: API data not loaded");
        return;
    }
    
    // Count vessels at port vs at sea
    const vesselsAtPort = state.filteredVoyages.filter(
        voyage =>
            voyage.status.toLowerCase().includes('discharging') ||
            voyage.status.toLowerCase().includes('loading') ||
            voyage.status.toLowerCase().includes('berthing')
    ).length;
    
    const vesselsAtSea = state.filteredVoyages.length - vesselsAtPort;
    
    // Update the scorecards
    if (dashboardElements.totalVessels) dashboardElements.totalVessels.textContent = apiData.vessels.length;
    if (dashboardElements.activeVoyages) dashboardElements.activeVoyages.textContent = state.filteredVoyages.length;
    if (dashboardElements.atPort) dashboardElements.atPort.textContent = vesselsAtPort;
    if (dashboardElements.atSea) dashboardElements.atSea.textContent = vesselsAtSea;
}

function renderVoyagesList() {
    console.log("Rendering voyages list...");
    
    if (!apiData) {
        console.warn("Cannot render voyages list: API data not loaded");
        return;
    }
    
    if (!dashboardElements.voyagesList) {
        console.error("Voyages list element not found");
        return;
    }
    
    if (state.isLoading) {
        dashboardElements.voyagesList.innerHTML = `
            <div class="svt-loading">Loading voyage data...</div>
        `;
        return;
    }
    
    if (state.filteredVoyages.length === 0) {
        dashboardElements.voyagesList.innerHTML = `
            <div class="svt-no-voyages">No voyages match the selected filters</div>
        `;
        return;
    }
    
    dashboardElements.voyagesList.innerHTML = '';
    
    state.filteredVoyages.forEach(voyage => {
        const vessel = apiData.vessels.find(v => v.id === voyage.vesselId);
        const charterType = apiData.charterTypes.find(ct => ct.id === voyage.charterTypeId);
        const charterer = apiData.charterers.find(c => c.id === voyage.chartererId);
        const isExpanded = state.expandedVoyages.includes(voyage.id);
        
        let voyageCard = `
            <div class="svt-voyage-card">
                <div class="svt-voyage-header" onclick="toggleVoyage(${voyage.id})">
                    <span>${isExpanded ? '[-]' : '[+]'}</span>
                    <span class="svt-voyage-name">${vessel ? vessel.name : 'Unknown Vessel'}</span>
                    <span class="svt-voyage-id" onclick="event.stopPropagation(); navigateToVoyageDetails(${voyage.id})">
                        V.${voyage.voyage_number} 🔍
                    </span>
                    <span class="svt-voyage-date">[${formatDate(voyage.startDate)}]</span>
                    <span class="svt-voyage-status">${voyage.status}</span>
                </div>
        `;
        
        if (isExpanded) {
            voyageCard += `
                <div class="svt-voyage-content expanded">
                    <div class="svt-voyage-info-row">
                        <span class="svt-voyage-charter-info">[${charterType ? charterType.name : 'Unknown Charter Type'}] - ${charterer ? charterer.name : 'Unknown Charterer'}</span>
                    </div>
                    <div class="svt-voyage-progress">
            `;
            
            // Add ports and progress lines
            voyage.route.forEach((port, index) => {
                voyageCard += `
                    <div class="svt-port-item">
                        <div class="svt-port-indicator ${port.visited ? 'visited' : ''} ${port.current ? 'current' : ''}">
                            ${port.visited ? '✓' : ''}
                        </div>
                        <div class="svt-port-name" title="${port.portName}">${port.portName}</div>
                        <div class="svt-port-date">
                            ${port.arrivalDate 
                                ? formatShortDate(port.arrivalDate) 
                                : port.current 
                                    ? 'Est. arrival' 
                                    : 'Scheduled'}
                        </div>
                    </div>
                `;
                
                // Add progress line if not the last port
                if (index < voyage.route.length - 1) {
                    const isActiveLine = port.visited && !voyage.route[index + 1].visited;
                    voyageCard += `
                        <div class="svt-progress-line ${isActiveLine ? 'active' : ''}">
                            <span class="svt-progress-arrow ${isActiveLine ? 'active' : ''}">→</span>
                        </div>
                    `;
                }
            });
            
            voyageCard += `
                    </div>
                </div>
            `;
        }
        
        voyageCard += `</div>`;
        dashboardElements.voyagesList.innerHTML += voyageCard;
    });
}

function renderVoyageDetails() {
    console.log("Rendering voyage details...");
    
    if (!apiData) {
        console.warn("Cannot render voyage details: API data not loaded");
        return;
    }
    
    if (!voyageDetailsElements.container) {
        console.error("Voyage details container not found");
        return;
    }
    
    const voyage = apiData.voyages.find(v => v.id === state.currentVoyageId);
    
    if (!voyage) {
        voyageDetailsElements.container.innerHTML = `
            <div class="svt-back-button" onclick="navigateToDashboard()">← Back to Dashboard</div>
            <h1 class="svt-voyage-details-title">Voyage Not Found</h1>
            <p>The voyage you are looking for does not exist.</p>
        `;
        return;
    }
    
    const vessel = apiData.vessels.find(v => v.id === voyage.vesselId);
    const charterType = apiData.charterTypes.find(ct => ct.id === voyage.charterTypeId);
    const charterer = apiData.charterers.find(c => c.id === voyage.chartererId);
    
    // Update title
    if (voyageDetailsElements.title) {
        voyageDetailsElements.title.textContent = `Voyage Details: ${vessel ? vessel.name : 'Unknown Vessel'} - Voy ${voyage.voyage_number}`;
    }
    
    // Render voyage information
    if (voyageDetailsElements.infoGrid) {
        voyageDetailsElements.infoGrid.innerHTML = `
            <div class="svt-info-label">Vessel:</div>
            <div class="svt-info-value">${vessel ? vessel.name : 'Unknown'}</div>
            
            <div class="svt-info-label">Voyage Number:</div>
            <div class="svt-info-value">${voyage.voyage_number}</div>
            
            <div class="svt-info-label">Charter Type:</div>
            <div class="svt-info-value">${charterType ? charterType.name : 'Unknown'}</div>
            
            <div class="svt-info-label">Charterer:</div>
            <div class="svt-info-value">${charterer ? charterer.name : 'Unknown'}</div>
            
            <div class="svt-info-label">Start Date:</div>
            <div class="svt-info-value">${formatDate(voyage.startDate)}</div>
            
            <div class="svt-info-label">Current Status:</div>
            <div class="svt-info-value">${voyage.status}</div>
        `;
    }
    
    // Render route information
    if (voyageDetailsElements.routeList) {
        voyageDetailsElements.routeList.innerHTML = '';
        voyage.route.forEach(port => {
            voyageDetailsElements.routeList.innerHTML += `
                <div class="svt-route-item">
                    <div class="svt-route-indicator ${port.visited ? 'visited' : ''} ${port.current ? 'current' : ''}">
                        ${port.visited ? '✓' : ''}
                    </div>
                    <div class="svt-route-details">
                        <div class="svt-route-port">${port.portName}</div>
                        <div class="svt-route-date">
                            ${port.arrivalDate 
                                ? formatDate(port.arrivalDate) 
                                : port.current 
                                    ? 'Expected: ' + formatDate(port.arrivalDate || '2025-04-25T14:00:00')
                                    : 'Scheduled'}
                        </div>
                        <div class="svt-route-status ${port.visited ? 'visited' : port.current ? 'current' : 'upcoming'}">
                            ${port.current ? 'Current Location' : port.visited ? 'Visited' : 'Upcoming'}
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // Render voyage progress
    if (voyageDetailsElements.progressContainer) {
        voyageDetailsElements.progressContainer.innerHTML = `
            <div class="svt-progress-bar"></div>
            <div class="svt-progress-ports">
        `;
        
        // Calculate ship position (percentage along the journey)
        let visitedPorts = 0;
        let totalPorts = voyage.route.length;
        voyage.route.forEach(port => {
            if (port.visited) visitedPorts++;
        });
        
        // If there's a current port, add half a port to the count
        const hasCurrentPort = voyage.route.some(port => port.current);
        if (hasCurrentPort) visitedPorts += 0.5;
        
        const shipPosition = (visitedPorts / (totalPorts - 1)) * 100;
        
        // Add ship icon
        voyageDetailsElements.progressContainer.innerHTML += `
            <div class="svt-ship-icon" style="left: ${shipPosition}%;">⛴️</div>
        `;
        
        // Add ports
        voyage.route.forEach(port => {
            voyageDetailsElements.progressContainer.innerHTML += `
                <div class="svt-progress-port">
                    <div class="svt-progress-port-indicator ${port.visited ? 'visited' : ''} ${port.current ? 'current' : ''}">
                        ${port.visited ? '✓' : ''}
                    </div>
                    <div class="svt-progress-port-name">${port.portName}</div>
                </div>
            `;
        });
        
        voyageDetailsElements.progressContainer.innerHTML += `</div>`;
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    
    const day = date.getDate();
    const month = getMonthAbbr(date.getMonth());
    const year = date.getFullYear().toString().substr(2);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
}

function formatShortDate(dateString) {
    const date = new Date(dateString);
    
    const day = date.getDate();
    const month = getMonthAbbr(date.getMonth());
    
    return `${day} ${month}`;
}

function getMonthAbbr(monthIndex) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[monthIndex];
}

// Make functions available globally
window.toggleVesselFilter = toggleVesselFilter;
window.toggleCharterTypeFilter = toggleCharterTypeFilter;
window.toggleChartererFilter = toggleChartererFilter;
window.toggleVoyage = toggleVoyage;
window.navigateToVoyageDetails = navigateToVoyageDetails;
window.navigateToDashboard = navigateToDashboard;

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Add a fallback initialization in case the DOMContentLoaded event has already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("Document already loaded, initializing app...");
    setTimeout(initApp, 1);
}