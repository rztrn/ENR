// Voyage Summary JavaScript - Pure JS implementation
// Integrates with Django template and Trip API data structure

// Global state management
let voyageData = {
  vessels: [],
  charterTypes: [],
  charterers: [],
  voyages: [],
  filteredVoyages: [],
  trips: [],
}

const filterState = {
  selectedVessels: [],
  selectedCharterTypes: [],
  selectedCharterers: [],
  selectedPorts: [],
  selectedStatuses: [],
}

const paginationState = {
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 1,
}

const sortState = {
  column: null,
  direction: "asc",
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

async function initializeApp() {
  showLoading(true)

  try {
    // Fetch data from Trip API
    await fetchVoyageData()

    // Initialize UI components
    updateScorecards()
    renderFilters()
    applyFilters()
    setupEventListeners()

    showLoading(false)
  } catch (error) {
    console.error("Error initializing app:", error)
    showLoading(false)
  }
}

// Fetch voyage data from Trip API
async function fetchVoyageData() {
  try {
    const response = await fetch("/api/trip/") // Trip API
    if (!response.ok) throw new Error("Failed to fetch data")

    const data = await response.json()
    voyageData.trips = data.trips || []

    // Map trips to "voyage" objects for table rendering
    voyageData.voyages = voyageData.trips.map((trip, index) => ({
      id: index + 1,
      voyage_number: trip.trip_number,
      vesselId: trip.vessel_id || null,
      vessel_name: trip.vessel_name || "-",
      startDate: trip.start_time,
      status: trip.status || "Unknown",
      route: trip.route || [],
      trips: [trip], // wrap single trip in array
    }))

    // Populate vessels from trips
    voyageData.vessels = [
      ...new Map(
        voyageData.trips
          .filter(t => t.vessel_id)
          .map(t => [t.vessel_id, { id: t.vessel_id, vesselname: t.vessel_name }])
      ).values(),
    ]

    // Charterers and CharterTypes (if API provides)
    voyageData.charterers = data.charterers || []
    voyageData.charterTypes = data.charterTypes || []

    voyageData.filteredVoyages = [...voyageData.voyages]
  } catch (error) {
    console.error("API fetch failed:", error)
    voyageData.filteredVoyages = [...voyageData.voyages]
  }
}

// Update scorecard values
function updateScorecards() {
  const totalVessels = voyageData.vessels.length
  const activeVoyages = voyageData.voyages.filter(v => v.status !== "Completed").length
  const atPort = voyageData.voyages.filter(v => v.status === "At Port").length
  const atSea = voyageData.voyages.filter(v => v.status === "At Sea" || v.status === "Maneuvering").length

  document.getElementById("svt-total-vessels").textContent = totalVessels
  document.getElementById("svt-active-voyages").textContent = activeVoyages
  document.getElementById("svt-at-port").textContent = atPort
  document.getElementById("svt-at-sea").textContent = atSea
}

// Render filters
function renderFilters() {
  renderVesselFilters()
  renderCharterTypeFilters()
  renderChartererFilters()
  renderPortFilters()
  renderStatusFilters()
}

function renderVesselFilters() {
  const container = document.getElementById("svt-vessel-filters")
  container.innerHTML = ""
  voyageData.vessels.forEach(v => {
    container.appendChild(createFilterCheckbox(
      `vessel-${v.id}`,
      v.vesselname,
      filterState.selectedVessels.includes(v.id),
      () => toggleVesselFilter(v.id)
    ))
  })
}

function renderCharterTypeFilters() {
  const container = document.getElementById("svt-charter-type-filters")
  container.innerHTML = ""
  voyageData.charterTypes.forEach(ct => {
    container.appendChild(createFilterCheckbox(
      `charter-type-${ct.id}`,
      ct.name,
      filterState.selectedCharterTypes.includes(ct.id),
      () => toggleCharterTypeFilter(ct.id)
    ))
  })
}

function renderChartererFilters() {
  const container = document.getElementById("svt-charterer-filters")
  container.innerHTML = ""
  voyageData.charterers.forEach(c => {
    container.appendChild(createFilterCheckbox(
      `charterer-${c.id}`,
      c.name,
      filterState.selectedCharterers.includes(c.id),
      () => toggleChartererFilter(c.id)
    ))
  })
}

function renderPortFilters() {
  const container = document.getElementById("svt-port-filters")
  container.innerHTML = ""
  const allPorts = new Set()
  voyageData.voyages.forEach(v => {
    v.route.forEach(p => allPorts.add(p.portName))
  })
  Array.from(allPorts).sort().forEach(portName => {
    container.appendChild(createFilterCheckbox(
      `port-${portName}`,
      portName,
      filterState.selectedPorts.includes(portName),
      () => togglePortFilter(portName)
    ))
  })
}

function renderStatusFilters() {
  const container = document.getElementById("svt-status-filters")
  container.innerHTML = ""
  const allStatuses = [...new Set(voyageData.voyages.map(v => v.status))].sort()
  allStatuses.forEach(status => {
    container.appendChild(createFilterCheckbox(
      `status-${status}`,
      status,
      filterState.selectedStatuses.includes(status),
      () => toggleStatusFilter(status)
    ))
  })
}

function createFilterCheckbox(id, label, checked, onChange) {
  const div = document.createElement("div")
  div.className = "svt-filter-item"
  const checkbox = document.createElement("input")
  checkbox.type = "checkbox"
  checkbox.id = id
  checkbox.checked = checked
  checkbox.addEventListener("change", onChange)
  const labelEl = document.createElement("label")
  labelEl.htmlFor = id
  labelEl.textContent = label
  div.appendChild(checkbox)
  div.appendChild(labelEl)
  return div
}

// Filter toggles
function toggleVesselFilter(id) { toggleFilter(filterState.selectedVessels, id) }
function toggleCharterTypeFilter(id) { toggleFilter(filterState.selectedCharterTypes, id) }
function toggleChartererFilter(id) { toggleFilter(filterState.selectedCharterers, id) }
function togglePortFilter(name) { toggleFilter(filterState.selectedPorts, name) }
function toggleStatusFilter(status) { toggleFilter(filterState.selectedStatuses, status) }

function toggleFilter(array, value) {
  const index = array.indexOf(value)
  if (index > -1) array.splice(index, 1)
  else array.push(value)
  applyFilters()
}

// Apply all filters
function applyFilters() {
  voyageData.filteredVoyages = voyageData.voyages.filter(v => {
    if (filterState.selectedVessels.length && !filterState.selectedVessels.includes(v.vesselId)) return false
    if (filterState.selectedCharterTypes.length && !filterState.selectedCharterTypes.includes(v.charterTypeId)) return false
    if (filterState.selectedCharterers.length && !filterState.selectedCharterers.includes(v.chartererId)) return false
    if (filterState.selectedPorts.length) {
      const voyagePorts = v.route.map(r => r.portName)
      if (!filterState.selectedPorts.some(p => voyagePorts.includes(p))) return false
    }
    if (filterState.selectedStatuses.length && !filterState.selectedStatuses.includes(v.status)) return false
    return true
  })
  paginationState.currentPage = 1
  updatePagination()
  renderVoyageTable()
}

// Render voyage table
function renderVoyageTable() {
  const tbody = document.getElementById("svt-voyage-table-body")
  tbody.innerHTML = ""
  const start = (paginationState.currentPage - 1) * paginationState.itemsPerPage
  const end = start + paginationState.itemsPerPage
  const pageVoyages = voyageData.filteredVoyages.slice(start, end)
  pageVoyages.forEach(v => {
    const row = createVoyageRow(v)
    if (row) tbody.appendChild(row)
  })
  updatePaginationInfo()
}

// Create voyage row (per trip)
function createVoyageRow(voyage) {
  if (!voyage || !voyage.trips || !voyage.trips.length) return null;

  const row = document.createElement("tr");

  // Use vessel_name from trip or fallback
  const vesselName =
    voyage.vessel_name ||
    (voyageData.vessels.find((v) => v.id === voyage.vesselId)?.vesselname || "-");

  const charterType = voyageData.charterTypes.find(
    (ct) => ct.id === voyage.charterTypeId
  );
  const charterer = voyageData.charterers.find(
    (c) => c.id === voyage.chartererId
  );

  // Use the first trip (Trip API returns 1 trip per voyage row)
  const latestTrip = voyage.trips[0];

  // FO/DO sounding consumption
  const foCons =
    latestTrip.fuelSummary?.FO?.sounding_cons?.toFixed(2) || "0.00";
  const doCons =
    latestTrip.fuelSummary?.DO?.sounding_cons?.toFixed(2) || "0.00";

  const speed = latestTrip.speed || "-";
  const utilization = latestTrip.utilization || "-";

  // Ports
  const loadPortTags = createPortTags(latestTrip.route || [], "load");
  const destinationTags = createPortTags(latestTrip.route || [], "discharge");

  row.innerHTML = `
    <td>${vesselName}</td>
    <td>${latestTrip.voyage_number_val || voyage.voyage_number}</td>
    <td>${charterType ? charterType.name : "-"}</td>
    <td>${charterer ? charterer.name : "-"}</td>
    <td class="svt-port-tags-cell">${loadPortTags}</td>
    <td class="svt-port-tags-cell">${destinationTags}</td>
    <td>${formatDate(voyage.startDate)}</td>
    <td>${formatDate(latestTrip.end_time)}</td>
    <td><span class="svt-status svt-status-${voyage.status
      .toLowerCase()
      .replace(" ", "-")}">${voyage.status}</span></td>
    <td>${foCons}</td>
    <td>${doCons}</td>
    <td>${speed}</td>
    <td>${utilization}</td>
    <td><button class="svt-details-btn" onclick="viewVoyageDetails(${voyage.id})">View</button></td>
  `;

  return row;
}


// Create port tags
function createPortTags(ports, portType) {
  const filtered = (ports || []).filter(p => p.portType === portType)
  if (!filtered.length) return '<span class="svt-no-data">-</span>'
  return filtered.map(p => `<span class="svt-port-tag">${p.portName}</span>`).join("")
}

// Pagination
function updatePagination() {
  paginationState.totalPages = Math.ceil(voyageData.filteredVoyages.length / paginationState.itemsPerPage)
  renderPaginationControls()
}

function renderPaginationControls() {
  const container = document.getElementById("svt-pagination-controls")
  container.innerHTML = ""

  const prevBtn = document.createElement("button")
  prevBtn.textContent = "Previous"
  prevBtn.disabled = paginationState.currentPage === 1
  prevBtn.addEventListener("click", () => goToPage(paginationState.currentPage - 1))
  container.appendChild(prevBtn)

  for (let i = 1; i <= paginationState.totalPages; i++) {
    const btn = document.createElement("button")
    btn.textContent = i
    btn.className = i === paginationState.currentPage ? "active" : ""
    btn.addEventListener("click", () => goToPage(i))
    container.appendChild(btn)
  }

  const nextBtn = document.createElement("button")
  nextBtn.textContent = "Next"
  nextBtn.disabled = paginationState.currentPage === paginationState.totalPages
  nextBtn.addEventListener("click", () => goToPage(paginationState.currentPage + 1))
  container.appendChild(nextBtn)
}

function goToPage(page) {
  if (page < 1 || page > paginationState.totalPages) return
  paginationState.currentPage = page
  renderVoyageTable()
  renderPaginationControls()
}

function updatePaginationInfo() {
  const start = (paginationState.currentPage - 1) * paginationState.itemsPerPage + 1
  const end = Math.min(start + paginationState.itemsPerPage - 1, voyageData.filteredVoyages.length)
  const total = voyageData.filteredVoyages.length
  document.getElementById("svt-pagination-info").textContent =
    `Showing ${start} to ${end} of ${total} voyages`
}

// Table sorting
function setupTableSorting() {
  const headers = document.querySelectorAll("th[data-sort]")
  headers.forEach(h => {
    h.addEventListener("click", () => sortTable(h.getAttribute("data-sort")))
  })
}

function sortTable(column) {
  if (!column) return
  sortState.direction = sortState.column === column
    ? sortState.direction === "asc" ? "desc" : "asc"
    : "asc"
  sortState.column = column

  voyageData.filteredVoyages.sort((a, b) => {
    let aValue, bValue
    switch (column) {
      case "vessel":
        aValue = a.vessel_name || ""
        bValue = b.vessel_name || ""
        break
      case "voyage":
        aValue = a.voyage_number
        bValue = b.voyage_number
        break
      case "charterType":
        aValue = voyageData.charterTypes.find(ct => ct.id === a.charterTypeId)?.name || ""
        bValue = voyageData.charterTypes.find(ct => ct.id === b.charterTypeId)?.name || ""
        break
      case "startDate":
        aValue = new Date(a.startDate)
        bValue = new Date(b.startDate)
        break
      case "status":
        aValue = a.status
        bValue = b.status
        break
      default:
        return 0
    }
    if (aValue < bValue) return sortState.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortState.direction === "asc" ? 1 : -1
    return 0
  })

  updateSortIndicators()
  renderVoyageTable()
}

function updateSortIndicators() {
  const headers = document.querySelectorAll("th[data-sort]")
  headers.forEach(h => {
    const ind = h.querySelector(".svt-sort-indicator")
    if (h.getAttribute("data-sort") === sortState.column) {
      ind.textContent = sortState.direction === "asc" ? "▲" : "▼"
    } else {
      ind.textContent = "▲"
    }
  })
}

// Event listeners
function setupEventListeners() {
  const itemsPerPageSelect = document.getElementById("svt-items-per-page")
  itemsPerPageSelect.addEventListener("change", e => {
    paginationState.itemsPerPage = parseInt(e.target.value)
    paginationState.currentPage = 1
    updatePagination()
    renderVoyageTable()
  })
  setupTableSorting()
}

// Utility
function formatDate(dateString) {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
}

function showLoading(show) {
  const loading = document.getElementById("svt-loading-indicator")
  if (loading) loading.style.display = show ? "block" : "none"
}

function viewVoyageDetails(voyageId) {
  console.log("View details for voyage:", voyageId)
}

window.voyageTracker = { viewVoyageDetails, refreshData: initializeApp }
