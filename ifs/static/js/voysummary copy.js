// Global state
let apiData = null;
let selectedVessels = [];
let selectedCharterTypes = [];
let selectedCharterers = [];
let selectedPorts = [];
let selectedStatuses = [];
let filteredVoyages = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;

// DOM elements - will be initialized after DOM loads
let loadingIndicator;
let voyageTableBody;
let paginationInfo;
let paginationControls;
let itemsPerPageSelect;
let vesselFilters;
let charterTypeFilters;
let chartererFilters;
let portFilters;
let statusFilters;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application...');
    
    // Initialize DOM elements
    loadingIndicator = document.getElementById('svt-loading-indicator');
    voyageTableBody = document.getElementById('svt-voyage-table-body');
    paginationInfo = document.getElementById('svt-pagination-info');
    paginationControls = document.getElementById('svt-pagination-controls');
    itemsPerPageSelect = document.getElementById('svt-items-per-page');
    vesselFilters = document.getElementById('svt-vessel-filters');
    charterTypeFilters = document.getElementById('svt-charter-type-filters');
    chartererFilters = document.getElementById('svt-charterer-filters');
    portFilters = document.getElementById('svt-port-filters');
    statusFilters = document.getElementById('svt-status-filters');
    
    // Check if all elements are found
    if (!loadingIndicator || !voyageTableBody || !paginationInfo || !paginationControls || !itemsPerPageSelect) {
        console.error('Some DOM elements not found!');
        return;
    }
    
    console.log('All DOM elements found, setting up event listeners...');
    
    // Set up event listeners
    itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);
    
    // Fetch data
    console.log('Starting to fetch voyage data...');
    fetchVoyageData();
});

// Fetch voyage data from API or use dummy data
async function fetchVoyageData() {
    console.log('fetchVoyageData called');
    showLoading();
    
    try {
        // In a real app, you would fetch from your API
         const response = await fetch('/api/voyage/');
         const data = await response.json();
         apiData = data;
        
        console.log('Using dummy data...');
        
        // Using dummy data for demonstration
        setTimeout(() => {
            console.log('Setting up dummy data...');
            apiData = dummyAPI;
            
            console.log('API Data loaded:', apiData);
            
            // Initialize filters with all items selected
            selectedVessels = apiData.vessels.map(v => v.id);
            selectedCharterTypes = apiData.charterTypes.map(ct => ct.id);
            selectedCharterers = apiData.charterers.map(c => c.id);
            
            // Get unique ports from both load and destination ports
            const allPorts = [...apiData.loadPorts, ...apiData.destinationPorts];
            selectedPorts = [...new Set(allPorts)];
            
            selectedStatuses = ["In Progress", "Finished", "Approved"];
            
            console.log('Filters initialized');
            console.log('Selected vessels:', selectedVessels);
            console.log('Selected ports:', selectedPorts);
            
            // Populate filter UI
            populateFilters();
            
            // Update filtered voyages
            updateFilteredVoyages();
            
            // Hide loading indicator
            hideLoading();
            
            console.log('Data loading complete');
        }, 500);
    } catch (error) {
        console.error("Error fetching data:", error);
        
        // Fallback to dummy data
        apiData = dummyAPI;
        
        // Initialize filters with all items selected
        selectedVessels = apiData.vessels.map(v => v.id);
        selectedCharterTypes = apiData.charterTypes.map(ct => ct.id);
        selectedCharterers = apiData.charterers.map(c => c.id);
        
        // Get unique ports from both load and destination ports
        const allPorts = [...apiData.loadPorts, ...apiData.destinationPorts];
        selectedPorts = [...new Set(allPorts)];
        
        selectedStatuses = ["In Progress", "Finished", "Approved"];
        
        // Populate filter UI
        populateFilters();
        
        // Update filtered voyages
        updateFilteredVoyages();
        
        // Hide loading indicator
        hideLoading();
    }
}

// Populate filter UI
function populateFilters() {
    console.log('Populating filters...');
    
    if (!apiData) {
        console.error('No API data available for populating filters');
        return;
    }
    
    // Populate vessel filters (limit to 5 entries)
    if (vesselFilters) {
        vesselFilters.innerHTML = '';
        const limitedVessels = apiData.vessels.slice(0, 5);
        limitedVessels.forEach(vessel => {
            const filterItem = createFilterItem(vessel.name, vessel.id, selectedVessels.includes(vessel.id), () => toggleVesselFilter(vessel.id));
            vesselFilters.appendChild(filterItem);
        });
        console.log('Vessel filters populated (limited to 5)');
    }
    
    // Populate charter type filters (limit to 5 entries)
    if (charterTypeFilters) {
        charterTypeFilters.innerHTML = '';
        const limitedCharterTypes = apiData.charterTypes.slice(0, 5);
        limitedCharterTypes.forEach(charterType => {
            const filterItem = createFilterItem(charterType.name, charterType.id, selectedCharterTypes.includes(charterType.id), () => toggleCharterTypeFilter(charterType.id));
            charterTypeFilters.appendChild(filterItem);
        });
        console.log('Charter type filters populated (limited to 5)');
    }
    
    // Populate charterer filters (limit to 5 entries)
    if (chartererFilters) {
        chartererFilters.innerHTML = '';
        const limitedCharterers = apiData.charterers.slice(0, 5);
        limitedCharterers.forEach(charterer => {
            const filterItem = createFilterItem(charterer.name, charterer.id, selectedCharterers.includes(charterer.id), () => toggleChartererFilter(charterer.id));
            chartererFilters.appendChild(filterItem);
        });
        console.log('Charterer filters populated (limited to 5)');
    }
    
    // Populate port filters (limit to 5 entries)
    if (portFilters) {
        portFilters.innerHTML = '';
        const allPorts = [...apiData.loadPorts, ...apiData.destinationPorts];
        const uniquePorts = [...new Set(allPorts)];
        const limitedPorts = uniquePorts.slice(0, 5);
        limitedPorts.forEach(port => {
            const filterItem = createFilterItem(port, port, selectedPorts.includes(port), () => togglePortFilter(port));
            portFilters.appendChild(filterItem);
        });
        console.log('Port filters populated (limited to 5)');
    }
    
    // Populate status filters (limit to 5 entries)
    if (statusFilters) {
        statusFilters.innerHTML = '';
        const statuses = ["In Progress", "Finished", "Approved"];
        const limitedStatuses = statuses.slice(0, 5);
        limitedStatuses.forEach(status => {
            const filterItem = createFilterItem(status, status, selectedStatuses.includes(status), () => toggleStatusFilter(status));
            statusFilters.appendChild(filterItem);
        });
        console.log('Status filters populated (limited to 5)');
    }
}

// Create a filter item element
function createFilterItem(label, value, isChecked, onClickHandler) {
    const filterItem = document.createElement('div');
    filterItem.className = 'svt-filter-item';
    filterItem.dataset.value = value;
    
    const checkbox = document.createElement('div');
    checkbox.className = `svt-filter-checkbox ${isChecked ? 'checked' : ''}`;
    checkbox.innerHTML = isChecked ? '✓' : '';
    
    const labelElement = document.createElement('label');
    labelElement.className = 'svt-filter-label';
    labelElement.textContent = label;
    labelElement.title = label; // Add tooltip for long names
    
    filterItem.appendChild(checkbox);
    filterItem.appendChild(labelElement);
    
    filterItem.addEventListener('click', onClickHandler);
    
    return filterItem;
}

// Update filtered voyages based on selected filters
function updateFilteredVoyages() {
    console.log('Updating filtered voyages...');
    
    if (!apiData) {
        console.error('No API data available for filtering');
        return;
    }
    
    filteredVoyages = apiData.voyages.filter(voyage => {
        // Check if vessel is selected
        if (!selectedVessels.includes(voyage.vesselId)) return false;
        
        // Check if charter type is selected
        if (!selectedCharterTypes.includes(voyage.charterTypeId)) return false;
        
        // Check if charterer is selected
        if (!selectedCharterers.includes(voyage.chartererId)) return false;
        
        // Check if load port is selected
        if (!selectedPorts.includes(voyage.loadPort)) return false;
        
        // Check if at least one destination port is selected
        const hasSelectedDestination = voyage.destinations.some(dest => selectedPorts.includes(dest));
        if (!hasSelectedDestination) return false;
        
        // Check if status is selected
        if (!selectedStatuses.includes(voyage.status)) return false;
        
        return true;
    });
    
    console.log('Filtered voyages:', filteredVoyages.length);
    
    totalPages = Math.ceil(filteredVoyages.length / itemsPerPage);
    
    // Reset to first page when filters change
    currentPage = 1;
    
    // Update UI
    updatePaginatedVoyages();
}

// Update paginated voyages
function updatePaginatedVoyages() {
    console.log('Updating paginated voyages...');
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVoyages = filteredVoyages.slice(startIndex, endIndex);
    
    console.log('Paginated voyages:', paginatedVoyages.length);
    
    // Update table
    renderVoyageTable(paginatedVoyages);
    
    // Update pagination
    renderPagination();
}

// Render voyage table
function renderVoyageTable(voyages) {
    console.log('Rendering voyage table with', voyages.length, 'voyages');
    
    if (!voyageTableBody) {
        console.error('Voyage table body element not found');
        return;
    }
    
    voyageTableBody.innerHTML = '';
    
    if (voyages.length === 0) {
        const noDataRow = document.createElement('tr');
        const noDataCell = document.createElement('td');
        noDataCell.colSpan = 10;
        noDataCell.className = 'svt-no-data';
        noDataCell.textContent = 'No voyages match the selected filters';
        noDataRow.appendChild(noDataCell);
        voyageTableBody.appendChild(noDataRow);
        return;
    }
    
    voyages.forEach(voyage => {
        const row = document.createElement('tr');
        
        // Vessel
        const vesselCell = document.createElement('td');
        vesselCell.textContent = getVesselCode(voyage.vesselId);
        row.appendChild(vesselCell);
        
        // Voyage
        const voyageCell = document.createElement('td');
        voyageCell.textContent = voyage.voyageNumber;
        row.appendChild(voyageCell);
        
        // Charter Type
        const charterTypeCell = document.createElement('td');
        charterTypeCell.textContent = getCharterTypeName(voyage.charterTypeId);
        row.appendChild(charterTypeCell);
        
        // Charterer
        const chartererCell = document.createElement('td');
        chartererCell.textContent = voyage.chartererCode;
        row.appendChild(chartererCell);
        
        // Load Port
        const loadPortCell = document.createElement('td');
        const loadPortTag = document.createElement('span');
        loadPortTag.className = 'svt-port-tag';
        loadPortTag.textContent = voyage.loadPort;
        loadPortCell.appendChild(loadPortTag);
        row.appendChild(loadPortCell);
        
        // Destinations with navigation arrows
        const destinationsCell = document.createElement('td');
        destinationsCell.className = 'svt-destinations-cell';
        
        const destinationsContent = document.createElement('div');
        destinationsContent.className = 'svt-destinations-content';
        
        voyage.destinations.forEach(port => {
            const portTag = document.createElement('span');
            portTag.className = 'svt-port-tag';
            portTag.textContent = port;
            destinationsContent.appendChild(portTag);
        });
        
        const navContainer = document.createElement('div');
        navContainer.className = 'svt-destinations-nav';
        
        const leftArrow = document.createElement('div');
        leftArrow.className = 'svt-nav-arrow';
        leftArrow.innerHTML = '‹';
        leftArrow.addEventListener('click', () => scrollDestinations(destinationsContent, -50));
        
        const rightArrow = document.createElement('div');
        rightArrow.className = 'svt-nav-arrow';
        rightArrow.innerHTML = '›';
        rightArrow.addEventListener('click', () => scrollDestinations(destinationsContent, 50));
        
        navContainer.appendChild(leftArrow);
        navContainer.appendChild(rightArrow);
        
        destinationsCell.appendChild(destinationsContent);
        destinationsCell.appendChild(navContainer);
        row.appendChild(destinationsCell);
        
        // Start Date
        const startDateCell = document.createElement('td');
        startDateCell.textContent = formatDate(voyage.startDate);
        row.appendChild(startDateCell);
        
        // End Date
        const endDateCell = document.createElement('td');
        endDateCell.textContent = formatDate(voyage.endDate);
        row.appendChild(endDateCell);
        
        // Status
        const statusCell = document.createElement('td');
        const statusTag = document.createElement('span');
        statusTag.className = `svt-status-tag ${getStatusClass(voyage.status)}`;
        statusTag.textContent = voyage.status;
        statusCell.appendChild(statusTag);
        row.appendChild(statusCell);
        
        // Details
        const detailsCell = document.createElement('td');
        detailsCell.className = 'svt-details-cell';
        detailsCell.textContent = '🔍';
        detailsCell.addEventListener('click', () => navigateToVoyageDetails(voyage.id));
        row.appendChild(detailsCell);
        
        voyageTableBody.appendChild(row);
    });
    
    console.log('Table rendered successfully');
}

// Scroll destinations content
function scrollDestinations(element, scrollAmount) {
    element.scrollLeft += scrollAmount;
}

// Render pagination
function renderPagination() {
    if (!paginationInfo || !paginationControls) {
        console.error('Pagination elements not found');
        return;
    }
    
    // Update pagination info
    if (filteredVoyages.length === 0) {
        paginationInfo.textContent = 'No voyages to display';
        paginationControls.innerHTML = '';
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredVoyages.length);
    paginationInfo.textContent = `Showing ${startIndex} to ${endIndex} of ${filteredVoyages.length} voyages`;
    
    // Update pagination controls
    paginationControls.innerHTML = '';
    
    // First page button
    const firstPageButton = createPaginationButton('&laquo;', () => changePage(1), currentPage === 1);
    paginationControls.appendChild(firstPageButton);
    
    // Previous page button
    const prevPageButton = createPaginationButton('&lsaquo;', () => changePage(currentPage - 1), currentPage === 1);
    paginationControls.appendChild(prevPageButton);
    
    // Page number buttons
    const pageButtonCount = Math.min(5, totalPages);
    let startPage;
    
    if (totalPages <= 5) {
        startPage = 1;
    } else if (currentPage <= 3) {
        startPage = 1;
    } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
    } else {
        startPage = currentPage - 2;
    }
    
    for (let i = 0; i < pageButtonCount; i++) {
        const pageNum = startPage + i;
        const pageButton = createPaginationButton(pageNum.toString(), () => changePage(pageNum), false, currentPage === pageNum);
        paginationControls.appendChild(pageButton);
    }
    
    // Next page button
    const nextPageButton = createPaginationButton('&rsaquo;', () => changePage(currentPage + 1), currentPage === totalPages);
    paginationControls.appendChild(nextPageButton);
    
    // Last page button
    const lastPageButton = createPaginationButton('&raquo;', () => changePage(totalPages), currentPage === totalPages);
    paginationControls.appendChild(lastPageButton);
}

// Create a pagination button
function createPaginationButton(text, onClick, isDisabled, isActive = false) {
    const button = document.createElement('button');
    button.className = `svt-pagination-button ${isActive ? 'active' : ''}`;
    button.innerHTML = text;
    button.disabled = isDisabled;
    button.addEventListener('click', onClick);
    return button;
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    updatePaginatedVoyages();
}

// Handle items per page change
function handleItemsPerPageChange(event) {
    itemsPerPage = parseInt(event.target.value);
    totalPages = Math.ceil(filteredVoyages.length / itemsPerPage);
    currentPage = 1; // Reset to first page
    updatePaginatedVoyages();
}

// Toggle vessel filter
function toggleVesselFilter(id) {
    if (selectedVessels.includes(id)) {
        selectedVessels = selectedVessels.filter(vesselId => vesselId !== id);
    } else {
        selectedVessels.push(id);
    }
    
    // Update UI
    const filterItem = vesselFilters.querySelector(`[data-value="${id}"]`);
    if (filterItem) {
        const checkbox = filterItem.querySelector('.svt-filter-checkbox');
        checkbox.classList.toggle('checked');
        checkbox.innerHTML = checkbox.classList.contains('checked') ? '✓' : '';
    }
    
    // Update filtered voyages
    updateFilteredVoyages();
}

// Toggle charter type filter
function toggleCharterTypeFilter(id) {
    if (selectedCharterTypes.includes(id)) {
        selectedCharterTypes = selectedCharterTypes.filter(charterTypeId => charterTypeId !== id);
    } else {
        selectedCharterTypes.push(id);
    }
    
    // Update UI
    const filterItem = charterTypeFilters.querySelector(`[data-value="${id}"]`);
    if (filterItem) {
        const checkbox = filterItem.querySelector('.svt-filter-checkbox');
        checkbox.classList.toggle('checked');
        checkbox.innerHTML = checkbox.classList.contains('checked') ? '✓' : '';
    }
    
    // Update filtered voyages
    updateFilteredVoyages();
}

// Toggle charterer filter
function toggleChartererFilter(id) {
    if (selectedCharterers.includes(id)) {
        selectedCharterers = selectedCharterers.filter(chartererId => chartererId !== id);
    } else {
        selectedCharterers.push(id);
    }
    
    // Update UI
    const filterItem = chartererFilters.querySelector(`[data-value="${id}"]`);
    if (filterItem) {
        const checkbox = filterItem.querySelector('.svt-filter-checkbox');
        checkbox.classList.toggle('checked');
        checkbox.innerHTML = checkbox.classList.contains('checked') ? '✓' : '';
    }
    
    // Update filtered voyages
    updateFilteredVoyages();
}

// Toggle port filter
function togglePortFilter(port) {
    if (selectedPorts.includes(port)) {
        selectedPorts = selectedPorts.filter(p => p !== port);
    } else {
        selectedPorts.push(port);
    }
    
    // Update UI
    const filterItem = portFilters.querySelector(`[data-value="${port}"]`);
    if (filterItem) {
        const checkbox = filterItem.querySelector('.svt-filter-checkbox');
        checkbox.classList.toggle('checked');
        checkbox.innerHTML = checkbox.classList.contains('checked') ? '✓' : '';
    }
    
    // Update filtered voyages
    updateFilteredVoyages();
}

// Toggle status filter
function toggleStatusFilter(status) {
    if (selectedStatuses.includes(status)) {
        selectedStatuses = selectedStatuses.filter(s => s !== status);
    } else {
        selectedStatuses.push(status);
    }
    
    // Update UI
    const filterItem = statusFilters.querySelector(`[data-value="${status}"]`);
    if (filterItem) {
        const checkbox = filterItem.querySelector('.svt-filter-checkbox');
        checkbox.classList.toggle('checked');
        checkbox.innerHTML = checkbox.classList.contains('checked') ? '✓' : '';
    }
    
    // Update filtered voyages
    updateFilteredVoyages();
}

// Navigate to voyage details
function navigateToVoyageDetails(voyageId) {
    // In a real app, you would navigate to the voyage details page
    console.log(`Navigating to voyage details for voyage ${voyageId}`);
    // For example: window.location.href = `/voyage-details/${voyageId}`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Get vessel name by ID
function getVesselName(id) {
    const vessel = apiData?.vessels.find(v => v.id === id);
    return vessel ? vessel.name : "Unknown";
}

// Get vessel code by ID
function getVesselCode(id) {
    const vessel = apiData?.vessels.find(v => v.id === id);
    return vessel ? vessel.code : "Unknown";
}

// Get charter type name by ID
function getCharterTypeName(id) {
    const charterType = apiData?.charterTypes.find(ct => ct.id === id);
    return charterType ? charterType.name : "Unknown";
}

// Get charterer name by ID
function getChartererName(id) {
    const charterer = apiData?.charterers.find(c => c.id === id);
    return charterer ? charterer.name : "Unknown";
}

// Get charterer code by ID
function getChartererCode(id) {
    const charterer = apiData?.charterers.find(c => c.id === id);
    return charterer ? charterer.code : "Unknown";
}

// Get status class
function getStatusClass(status) {
    switch (status) {
        case "In Progress":
            return "svt-status-in-progress";
        case "Finished":
            return "svt-status-finished";
        case "Approved":
            return "svt-status-approved";
        default:
            return "";
    }
}

// Show loading indicator
function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
}

// Hide loading indicator
function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Dummy API data
const dummyAPI = {
    vessels: [
        { id: 1, name: "MV. Sakti", code: "KPG", active: true },
        { id: 2, name: "MV. Kota Padang", code: "SWL", active: true },
        { id: 3, name: "MV. Baik", code: "KPG", active: true },
        { id: 4, name: "MV. Cepat", code: "SWL", active: false },
        { id: 5, name: "MV. Cerdas", code: "KPG", active: false },
        { id: 6, name: "MV. Extra Vessel 1", code: "EV1", active: true },
        { id: 7, name: "MV. Extra Vessel 2", code: "EV2", active: true },
    ],
    charterTypes: [
        { id: 1, name: "FREIGHT", code: "FREIGHT" },
        { id: 2, name: "TIME", code: "TIME" },
        { id: 3, name: "BAREBOAT", code: "BAREBOAT" },
        { id: 4, name: "DEMISE", code: "DEMISE" },
        { id: 5, name: "VOYAGE", code: "VOYAGE" },
        { id: 6, name: "SPOT", code: "SPOT" },
    ],
    charterers: [
        { id: 1, name: "PT. Solusi Bangun Andalas", code: "SBA" },
        { id: 2, name: "PT. Indocement Triperkasa", code: "ITP" },
        { id: 3, name: "MARUBENI", code: "MARUBENI" },
        { id: 4, name: "PT. Extra Charterer 1", code: "EC1" },
        { id: 5, name: "PT. Extra Charterer 2", code: "EC2" },
        { id: 6, name: "PT. Extra Charterer 3", code: "EC3" },
    ],
    loadPorts: ["Lhoknga", "Tuban", "Jakarta", "Surabaya", "Makassar", "Balikpapan", "Pontianak", "Banjarmasin"],
    destinationPorts: [
        "Lhokseumawе",
        "Belawan",
        "Singapore",
        "Kuala Lumpur",
        "Bangkok",
        "Manila",
        "Ho Chi Minh",
        "Hong Kong",
        "Yangon",
        "Colombo",
    ],
    voyages: [
        {
            id: 1,
            voyageNumber: 313,
            vesselId: 1,
            charterTypeId: 1,
            chartererId: 1,
            chartererCode: "SBA",
            loadPort: "Lhoknga",
            destinations: ["Lhokseumawе", "Belawan"],
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "In Progress",
        },
        {
            id: 2,
            voyageNumber: 122,
            vesselId: 2,
            charterTypeId: 1,
            chartererId: 1,
            chartererCode: "SBA",
            loadPort: "Tuban",
            destinations: ["Lhokseumawе", "Belawan", "Singapore", "Kuala Lumpur"], // 4 destinations
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "In Progress",
        },
        {
            id: 3,
            voyageNumber: 313,
            vesselId: 1,
            charterTypeId: 1,
            chartererId: 2,
            chartererCode: "ITP",
            loadPort: "Lhoknga",
            destinations: ["Lhokseumawе", "Belawan", "Singapore", "Bangkok", "Manila"], // 5 destinations
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "In Progress",
        },
        {
            id: 4,
            voyageNumber: 313,
            vesselId: 1,
            charterTypeId: 1,
            chartererId: 3,
            chartererCode: "MARUBENI",
            loadPort: "Lhoknga",
            destinations: ["Lhokseumawе", "Belawan", "Singapore", "Ho Chi Minh", "Hong Kong", "Manila"], // 6 destinations
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "In Progress",
        },
        {
            id: 5,
            voyageNumber: 122,
            vesselId: 2,
            charterTypeId: 1,
            chartererId: 1,
            chartererCode: "SBA",
            loadPort: "Tuban",
            destinations: ["Lhokseumawе", "Belawan"],
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "Finished",
        },
        {
            id: 6,
            voyageNumber: 313,
            vesselId: 1,
            charterTypeId: 1,
            chartererId: 2,
            chartererCode: "ITP",
            loadPort: "Jakarta",
            destinations: ["Singapore", "Bangkok", "Manila"],
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "Finished",
        },
        {
            id: 7,
            voyageNumber: 313,
            vesselId: 1,
            charterTypeId: 1,
            chartererId: 2,
            chartererCode: "ITP",
            loadPort: "Surabaya",
            destinations: ["Singapore", "Kuala Lumpur", "Bangkok", "Ho Chi Minh"], // 4 destinations
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "Finished",
        },
        {
            id: 8,
            voyageNumber: 122,
            vesselId: 2,
            charterTypeId: 1,
            chartererId: 1,
            chartererCode: "SBA",
            loadPort: "Tuban",
            destinations: ["Lhokseumawе", "Belawan"],
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "Finished",
        },
        {
            id: 9,
            voyageNumber: 313,
            vesselId: 1,
            charterTypeId: 1,
            chartererId: 2,
            chartererCode: "ITP",
            loadPort: "Lhoknga",
            destinations: ["Lhokseumawе", "Belawan", "Singapore", "Bangkok", "Manila"], // 5 destinations
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "Approved",
        },
        {
            id: 10,
            voyageNumber: 313,
            vesselId: 1,
            charterTypeId: 1,
            chartererId: 3,
            chartererCode: "MARUBENI",
            loadPort: "Makassar",
            destinations: ["Singapore", "Bangkok", "Ho Chi Minh", "Hong Kong"], // 4 destinations
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "Approved",
        },
        {
            id: 11,
            voyageNumber: 122,
            vesselId: 2,
            charterTypeId: 1,
            chartererId: 1,
            chartererCode: "SBA",
            loadPort: "Tuban",
            destinations: ["Lhokseumawе", "Belawan"],
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "Approved",
        },
        {
            id: 12,
            voyageNumber: 313,
            vesselId: 1,
            charterTypeId: 1,
            chartererId: 2,
            chartererCode: "ITP",
            loadPort: "Lhoknga",
            destinations: ["Lhokseumawе", "Belawan"],
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: "Approved",
        },
        // Add more voyages for pagination testing
        ...Array.from({ length: 20 }, (_, i) => ({
            id: 13 + i,
            voyageNumber: 100 + i,
            vesselId: i % 2 === 0 ? 1 : 2,
            charterTypeId: 1,
            chartererId: (i % 3) + 1,
            chartererCode: i % 3 === 0 ? "SBA" : i % 3 === 1 ? "ITP" : "MARUBENI",
            loadPort:
                i % 5 === 0
                    ? "Lhoknga"
                    : i % 5 === 1
                        ? "Tuban"
                        : i % 5 === 2
                            ? "Jakarta"
                            : i % 5 === 3
                                ? "Surabaya"
                                : "Makassar",
            destinations:
                i % 4 === 0
                    ? ["Lhokseumawе", "Belawan"]
                    : i % 4 === 1
                        ? ["Singapore", "Bangkok", "Manila"]
                        : i % 4 === 2
                            ? ["Lhokseumawе", "Belawan", "Singapore", "Bangkok"]
                            : ["Singapore", "Kuala Lumpur", "Bangkok", "Ho Chi Minh", "Hong Kong"],
            startDate: "2025-04-22T15:04:00",
            endDate: "2025-04-28T13:00:00",
            status: i % 3 === 0 ? "In Progress" : i % 3 === 1 ? "Finished" : "Approved",
        })),
    ],
};