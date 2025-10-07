document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

// Global state for filters
const state = {
    selectedVessels: [],
    selectedCharterTypes: [],
    selectedCharterers: [],
    expandedVoyages: []
};

// Initialize the application
async function initApp() {
    try {
        // Fetch data from API (or use local data for development)
        const data = await fetchVoyageData();
        
        // Initialize filters with active vessels and all charter types/charterers
        state.selectedVessels = data.vessels
            .filter(vessel => vessel.active)
            .map(vessel => vessel.id);
            
        state.selectedCharterTypes = data.charterTypes
            .map(charterType => charterType.id);
            
        state.selectedCharterers = data.charterers
            .map(charterer => charterer.id);
        
        // Render UI components
        renderFilters(data);
        renderVoyageCards(data);
        updateScoreCards(data);
        
        // Set up event listeners
        setupEventListeners(data);
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.getElementById('voyage-cards').innerHTML = 
            '<div class="error-message">Failed to load voyage data. Please try again later.</div>';
    }
}

// Import voyage data (or define it if not using imports)
// Assuming voyageData is in a separate file called voyages.js
// and is a global variable. If using modules, import it.
// For example:
// import { voyageData } from './voyages.js';
// If not using imports, you can define it here:
const voyageData = {
    vessels: [
        { id: 1, name: 'Vessel A', active: true },
        { id: 2, name: 'Vessel B', active: false },
        { id: 3, name: 'Vessel C', active: true }
    ],
    charterTypes: [
        { id: 1, name: 'Type X' },
        { id: 2, name: 'Type Y' }
    ],
    charterers: [
        { id: 1, name: 'Charterer P' },
        { id: 2, name: 'Charterer Q' }
    ],
    voyages: [
        { id: 101, vesselId: 1, charterTypeId: 1, chartererId: 1, startDate: '2024-01-15T08:00:00.000Z', status: 'Sailing', route: [{ portName: 'Port A', arrivalDate: '2024-01-16T12:00:00.000Z', visited: true }, { portName: 'Port B', arrivalDate: '2024-01-18T18:00:00.000Z', visited: false, current: true }] },
        { id: 102, vesselId: 3, charterTypeId: 2, chartererId: 2, startDate: '2024-02-01T10:00:00.000Z', status: 'Berthing', route: [{ portName: 'Port C', arrivalDate: '2024-02-02T14:00:00.000Z', visited: true, current: true }, { portName: 'Port D', arrivalDate: '2024-02-04T20:00:00.000Z', visited: false }] }
    ]
};

// Fetch voyage data from API
async function fetchVoyageData() {
    try {
        const response = await fetch('/api/voyage/');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch voyage data:", error);
        return null;
    }
}

// Render filter options
function renderFilters(data) {
    // Render vessel filters
    const vesselFiltersContainer = document.getElementById('vessel-filters');
    vesselFiltersContainer.innerHTML = '';
    
    data.vessels.forEach(vessel => {
        const isChecked = state.selectedVessels.includes(vessel.id);
        vesselFiltersContainer.appendChild(
            createFilterOption(vessel.id, vessel.vesselname, 'vessel', isChecked)
        );
    });
    
    // Render charter type filters
    const charterFiltersContainer = document.getElementById('charter-filters');
    charterFiltersContainer.innerHTML = '';
    
    data.charterTypes.forEach(charterType => {
        const isChecked = state.selectedCharterTypes.includes(charterType.id);
        charterFiltersContainer.appendChild(
            createFilterOption(charterType.id, charterType.name, 'charter', isChecked)
        );
    });
    
    // Render charterer filters
    const chartererFiltersContainer = document.getElementById('charterer-filters');
    chartererFiltersContainer.innerHTML = '';
    
    data.charterers.forEach(charterer => {
        const isChecked = state.selectedCharterers.includes(charterer.id);
        chartererFiltersContainer.appendChild(
            createFilterOption(charterer.id, charterer.name, 'charterer', isChecked)
        );
    });
}

// Create a filter option element
function createFilterOption(id, name, type, isChecked) {
    const filterOption = document.createElement('div');
    filterOption.className = 'filter-option';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${type}-${id}`;
    checkbox.checked = isChecked;
    checkbox.dataset.id = id;
    checkbox.dataset.type = type;
    
    const label = document.createElement('label');
    label.htmlFor = `${type}-${id}`;
    label.textContent = name;
    
    filterOption.appendChild(checkbox);
    filterOption.appendChild(label);
    
    return filterOption;
}

// Render voyage cards based on filters
function renderVoyageCards(data) {
    const voyageCardsContainer = document.getElementById('voyage-cards');
    voyageCardsContainer.innerHTML = '';
    
    // Filter voyages based on selected filters
    const filteredVoyages = data.voyages.filter(voyage => 
        state.selectedVessels.includes(voyage.vesselId) &&
        state.selectedCharterTypes.includes(voyage.charterTypeId) &&
        state.selectedCharterers.includes(voyage.chartererId)
    );
    
    if (filteredVoyages.length === 0) {
        voyageCardsContainer.innerHTML = 
            '<div class="no-results">No voyages match the selected filters</div>';
        return;
    }
    
    // Create voyage cards
    filteredVoyages.forEach(voyage => {
        const vessel = data.vessels.find(v => v.id === voyage.vesselId);
        const charterType = data.charterTypes.find(ct => ct.id === voyage.charterTypeId);
        const charterer = data.charterers.find(c => c.id === voyage.chartererId);
        
        voyageCardsContainer.appendChild(
            createVoyageCard(voyage, vessel, charterType, charterer)
        );
    });
}

// Create a voyage card element
function createVoyageCard(voyage, vessel, charterType, charterer) {
    const voyageCard = document.createElement('div');
    voyageCard.className = 'voyage-card';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'voyage-header';
    
    const vesselName = document.createElement('div');
    vesselName.className = 'vessel-name';
    vesselName.textContent = vessel.vesselname;
    
    const detailsLink = document.createElement('a');
    detailsLink.href = `voyage-details.html?id=${voyage.id}`;
    detailsLink.className = 'voyage-details-btn';
    detailsLink.textContent = 'Voyage Details [+]';
    
    header.appendChild(vesselName);
    header.appendChild(detailsLink);
    
    // Create info section
    const info = document.createElement('div');
    info.className = 'voyage-info';
    
    // Create meta information (voyage number, date, status, charter info)
    const meta = document.createElement('div');
    meta.className = 'voyage-meta';
    
    // Left side - voyage details
    const voyageDetails = document.createElement('div');
    voyageDetails.className = 'voyage-details';
    
    const voyageNumber = document.createElement('span');
    voyageNumber.className = 'voyage-number';
    voyageNumber.textContent = `Voy ${voyage.id}`;
    
    const separator1 = document.createTextNode(' | ');
    
    const voyageDate = document.createElement('span');
    voyageDate.className = 'voyage-date';
    voyageDate.textContent = formatDate(voyage.startDate);
    
    const separator2 = document.createTextNode(' | ');
    
    const voyageStatus = document.createElement('span');
    voyageStatus.className = 'voyage-status';
    voyageStatus.textContent = voyage.status;
    
    voyageDetails.appendChild(voyageNumber);
    voyageDetails.appendChild(separator1);
    voyageDetails.appendChild(voyageDate);
    voyageDetails.appendChild(separator2);
    voyageDetails.appendChild(voyageStatus);
    
    // Right side - charter info
    const charterInfo = document.createElement('div');
    charterInfo.className = 'charter-info';
    charterInfo.textContent = `[${charterType.name}] - ${charterer.name}`;
    
    meta.appendChild(voyageDetails);
    meta.appendChild(charterInfo);
    
    // Create voyage progress
    const progress = createVoyageProgress(voyage.route);
    
    // Assemble the card
    info.appendChild(meta);
    info.appendChild(progress);
    
    voyageCard.appendChild(header);
    voyageCard.appendChild(info);
    
    return voyageCard;
}

// Create voyage progress visualization
function createVoyageProgress(route) {
    const progress = document.createElement('div');
    progress.className = 'voyage-progress';
    
    route.forEach((port, index) => {
        // Create port element
        const portElement = document.createElement('div');
        portElement.className = 'port';
        
        // Port checkbox (visual indicator)
        const checkbox = document.createElement('div');
        checkbox.className = 'port-checkbox';
        if (port.visited) {
            checkbox.classList.add('checked');
            checkbox.textContent = '✓';
        }
        if (port.current) {
            checkbox.classList.add('current');
        }
        
        // Port name
        const portName = document.createElement('div');
        portName.className = 'port-name';
        portName.textContent = port.portName;
        portName.title = port.portName; // For tooltip on hover
        
        // Port date
        const portDate = document.createElement('div');
        portDate.className = 'port-date';
        if (port.arrivalDate) {
            portDate.textContent = formatShortDate(port.arrivalDate);
        } else if (port.current) {
            portDate.textContent = 'Est. arrival';
        } else {
            portDate.textContent = 'Scheduled';
        }
        
        portElement.appendChild(checkbox);
        portElement.appendChild(portName);
        portElement.appendChild(portDate);
        
        progress.appendChild(portElement);
        
        // Add arrow if not the last port
        if (index < route.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'voyage-arrow';
            
            // Check if this segment is active
            if (port.visited && !route[index + 1].visited) {
                arrow.classList.add('active');
            }
            
            progress.appendChild(arrow);
        }
    });
    
    return progress;
}

// Update scorecard values
function updateScoreCards(data) {
    // Total vessels
    document.getElementById('total-vessels').textContent = data.vessels.length;
    
    // Active voyages (filtered)
    const filteredVoyages = data.voyages.filter(voyage => 
        state.selectedVessels.includes(voyage.vesselId) &&
        state.selectedCharterTypes.includes(voyage.charterTypeId) &&
        state.selectedCharterers.includes(voyage.chartererId)
    );
    document.getElementById('active-voyages').textContent = filteredVoyages.length;
    
    // Vessels at port vs at sea
    const atPort = filteredVoyages.filter(voyage => 
        voyage.status.toLowerCase().includes('discharging') || 
        voyage.status.toLowerCase().includes('loading') ||
        voyage.status.toLowerCase().includes('berthing')
    ).length;
    
    const atSea = filteredVoyages.length - atPort;
    
    document.getElementById('at-port').textContent = atPort;
    document.getElementById('at-sea').textContent = atSea;
}

// Set up event listeners
function setupEventListeners(data) {
    // Filter change events
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const id = parseInt(this.dataset.id);
            const type = this.dataset.type;
            const checked = this.checked;
            
            // Update state based on filter type
            if (type === 'vessel') {
                if (checked) {
                    state.selectedVessels.push(id);
                } else {
                    state.selectedVessels = state.selectedVessels.filter(vesselId => vesselId !== id);
                }
            } else if (type === 'charter') {
                if (checked) {
                    state.selectedCharterTypes.push(id);
                } else {
                    state.selectedCharterTypes = state.selectedCharterTypes.filter(charterTypeId => charterTypeId !== id);
                }
            } else if (type === 'charterer') {
                if (checked) {
                    state.selectedCharterers.push(id);
                } else {
                    state.selectedCharterers = state.selectedCharterers.filter(chartererId => chartererId !== id);
                }
            }
            
            // Re-render voyage cards and update scorecards
            renderVoyageCards(data);
            updateScoreCards(data);
        });
    });
}

// Format date for display (full format)
function formatDate(dateString) {
    const date = new Date(dateString);
    
    const day = date.getDate();
    const month = getMonthAbbr(date.getMonth());
    const year = date.getFullYear().toString().substr(2);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
}

// Format date for display (short format)
function formatShortDate(dateString) {
    const date = new Date(dateString);
    
    const day = date.getDate();
    const month = getMonthAbbr(date.getMonth());
    
    return `${day} ${month}`;
}

// Get month abbreviation
function getMonthAbbr(monthIndex) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
} 