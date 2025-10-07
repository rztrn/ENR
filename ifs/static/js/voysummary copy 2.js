// Voyage Summary JavaScript - Pure JS implementation
// Integrates with Django template and API data structure

// Global state management
let voyageData = {
  vessels: [],
  charterTypes: [],
  charterers: [],
  voyages: [],
  filteredVoyages: [],
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
    // Fetch data from API or use provided data structure
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

// Fetch voyage data from API
async function fetchVoyageData() {
  try {
    // Replace with your actual API endpoint
    const response = await fetch("/api/voyage-data/")

    if (!response.ok) {
      throw new Error("Failed to fetch data")
    }

    const data = await response.json()
    voyageData = data
    voyageData.filteredVoyages = [...voyageData.voyages]
  } catch (error) {
    console.error("API fetch failed, using fallback data:", error)

    // Fallback to provided data structure
    voyageData = {
      vessels: [
        { id: 1, vesselname: "Sakti" },
        { id: 2, vesselname: "Kota Padang" },
      ],
      charterTypes: [
        { id: 1, name: "Freight Charter" },
        { id: 2, name: "Time Charter" },
      ],
      charterers: [{ id: 1, name: "PT. Solusi Bangun Andalas" }],
      voyages: [
        {
          id: 3,
          voyage_number: 313,
          vesselId: 2,
          charterTypeId: 1,
          chartererId: 1,
          startDate: "2025-04-25T12:00:00Z",
          status: "Maneuvering",
          route: [
            {
              portName: "IDTBN",
              visited: false,
              current: false,
              arrivalDate: "2025-04-16T21:00:00Z",
              purpose: "Maneuvering",
            },
            {
              portName: "IDJTP",
              visited: false,
              current: false,
              arrivalDate: "2025-04-25T12:00:00Z",
              purpose: "Maneuvering",
            },
          ],
        },
        {
          id: 4,
          voyage_number: 111,
          vesselId: 1,
          charterTypeId: 1,
          chartererId: 1,
          startDate: "2025-04-25T12:00:00Z",
          status: "Maneuvering",
          route: [
            {
              portName: "IDMRD",
              visited: false,
              current: false,
              arrivalDate: "2025-04-16T21:00:00Z",
              purpose: "Maneuvering",
            },
            {
              portName: "IDTJN",
              visited: false,
              current: false,
              arrivalDate: "2025-04-25T12:00:00Z",
              purpose: "Maneuvering",
            },
          ],
        },
      ],
    }
    voyageData.filteredVoyages = [...voyageData.voyages]
  }
}

// Update scorecard values
function updateScorecards() {
  const totalVessels = voyageData.vessels.length
  const activeVoyages = voyageData.voyages.filter((v) => v.status !== "Completed").length
  const atPort = voyageData.voyages.filter((v) => v.status === "At Port").length
  const atSea = voyageData.voyages.filter((v) => v.status === "At Sea" || v.status === "Maneuvering").length

  document.getElementById("svt-total-vessels").textContent = totalVessels
  document.getElementById("svt-active-voyages").textContent = activeVoyages
  document.getElementById("svt-at-port").textContent = atPort
  document.getElementById("svt-at-sea").textContent = atSea
}

// Render filter checkboxes
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

  voyageData.vessels.forEach((vessel) => {
    const filterItem = createFilterCheckbox(
      `vessel-${vessel.id}`,
      vessel.vesselname,
      filterState.selectedVessels.includes(vessel.id),
      () => toggleVesselFilter(vessel.id),
    )
    container.appendChild(filterItem)
  })
}

function renderCharterTypeFilters() {
  const container = document.getElementById("svt-charter-type-filters")
  container.innerHTML = ""

  voyageData.charterTypes.forEach((charterType) => {
    const filterItem = createFilterCheckbox(
      `charter-type-${charterType.id}`,
      charterType.name,
      filterState.selectedCharterTypes.includes(charterType.id),
      () => toggleCharterTypeFilter(charterType.id),
    )
    container.appendChild(filterItem)
  })
}

function renderChartererFilters() {
  const container = document.getElementById("svt-charterer-filters")
  container.innerHTML = ""

  voyageData.charterers.forEach((charterer) => {
    const filterItem = createFilterCheckbox(
      `charterer-${charterer.id}`,
      charterer.name,
      filterState.selectedCharterers.includes(charterer.id),
      () => toggleChartererFilter(charterer.id),
    )
    container.appendChild(filterItem)
  })
}

function renderPortFilters() {
  const container = document.getElementById("svt-port-filters")
  container.innerHTML = ""

  // Extract unique ports from all voyage routes
  const allPorts = new Set()
  voyageData.voyages.forEach((voyage) => {
    voyage.route.forEach((port) => {
      allPorts.add(port.portName)
    })
  })

  Array.from(allPorts)
    .sort()
    .forEach((portName) => {
      const filterItem = createFilterCheckbox(
        `port-${portName}`,
        portName,
        filterState.selectedPorts.includes(portName),
        () => togglePortFilter(portName),
      )
      container.appendChild(filterItem)
    })
}

function renderStatusFilters() {
  const container = document.getElementById("svt-status-filters")
  container.innerHTML = ""

  // Extract unique statuses
  const allStatuses = [...new Set(voyageData.voyages.map((v) => v.status))]

  allStatuses.sort().forEach((status) => {
    const filterItem = createFilterCheckbox(
      `status-${status}`,
      status,
      filterState.selectedStatuses.includes(status),
      () => toggleStatusFilter(status),
    )
    container.appendChild(filterItem)
  })
}

// Create filter checkbox element
function createFilterCheckbox(id, label, checked, onChange) {
  const div = document.createElement("div")
  div.className = "svt-filter-item"

  const checkbox = document.createElement("input")
  checkbox.type = "checkbox"
  checkbox.id = id
  checkbox.checked = checked
  checkbox.addEventListener("change", onChange)

  const labelElement = document.createElement("label")
  labelElement.htmlFor = id
  labelElement.textContent = label

  div.appendChild(checkbox)
  div.appendChild(labelElement)

  return div
}

// Filter toggle functions
function toggleVesselFilter(vesselId) {
  const index = filterState.selectedVessels.indexOf(vesselId)
  if (index > -1) {
    filterState.selectedVessels.splice(index, 1)
  } else {
    filterState.selectedVessels.push(vesselId)
  }
  applyFilters()
}

function toggleCharterTypeFilter(charterTypeId) {
  const index = filterState.selectedCharterTypes.indexOf(charterTypeId)
  if (index > -1) {
    filterState.selectedCharterTypes.splice(index, 1)
  } else {
    filterState.selectedCharterTypes.push(charterTypeId)
  }
  applyFilters()
}

function toggleChartererFilter(chartererId) {
  const index = filterState.selectedCharterers.indexOf(chartererId)
  if (index > -1) {
    filterState.selectedCharterers.splice(index, 1)
  } else {
    filterState.selectedCharterers.push(chartererId)
  }
  applyFilters()
}

function togglePortFilter(portName) {
  const index = filterState.selectedPorts.indexOf(portName)
  if (index > -1) {
    filterState.selectedPorts.splice(index, 1)
  } else {
    filterState.selectedPorts.push(portName)
  }
  applyFilters()
}

function toggleStatusFilter(status) {
  const index = filterState.selectedStatuses.indexOf(status)
  if (index > -1) {
    filterState.selectedStatuses.splice(index, 1)
  } else {
    filterState.selectedStatuses.push(status)
  }
  applyFilters()
}

// Apply all active filters
function applyFilters() {
  voyageData.filteredVoyages = voyageData.voyages.filter((voyage) => {
    // Vessel filter
    if (filterState.selectedVessels.length > 0 && !filterState.selectedVessels.includes(voyage.vesselId)) {
      return false
    }

    // Charter type filter
    if (
      filterState.selectedCharterTypes.length > 0 &&
      !filterState.selectedCharterTypes.includes(voyage.charterTypeId)
    ) {
      return false
    }

    // Charterer filter
    if (filterState.selectedCharterers.length > 0 && !filterState.selectedCharterers.includes(voyage.chartererId)) {
      return false
    }

    // Port filter
    if (filterState.selectedPorts.length > 0) {
      const voyagePorts = voyage.route.map((r) => r.portName)
      const hasSelectedPort = filterState.selectedPorts.some((port) => voyagePorts.includes(port))
      if (!hasSelectedPort) {
        return false
      }
    }

    // Status filter
    if (filterState.selectedStatuses.length > 0 && !filterState.selectedStatuses.includes(voyage.status)) {
      return false
    }

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

  const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage
  const endIndex = startIndex + paginationState.itemsPerPage
  const pageVoyages = voyageData.filteredVoyages.slice(startIndex, endIndex)

  pageVoyages.forEach((voyage) => {
    const row = createVoyageRow(voyage)
    tbody.appendChild(row)
  })

  updatePaginationInfo()
}

// Create voyage table row
function createVoyageRow(voyage) {
  const row = document.createElement("tr")

  const vessel = voyageData.vessels.find((v) => v.id === voyage.vesselId)
  const charterType = voyageData.charterTypes.find((ct) => ct.id === voyage.charterTypeId)
  const charterer = voyageData.charterers.find((c) => c.id === voyage.chartererId)

  const loadPort = voyage.route.length > 0 ? voyage.route[0].portName : "-"
  const destination = voyage.route.length > 1 ? voyage.route[voyage.route.length - 1].portName : "-"

  row.innerHTML = `
        <td>${vessel ? vessel.vesselname : "-"}</td>
        <td>${voyage.voyage_number}</td>
        <td>${charterType ? charterType.name : "-"}</td>
        <td>${charterer ? charterer.name : "-"}</td>
        <td>${loadPort}</td>
        <td>${destination}</td>
        <td>${formatDate(voyage.startDate)}</td>
        <td>-</td>
        <td><span class="svt-status svt-status-${voyage.status.toLowerCase().replace(" ", "-")}">${voyage.status}</span></td>
        <td><button class="svt-details-btn" onclick="viewVoyageDetails(${voyage.id})">View</button></td>
    `

  return row
}

// Pagination functions
function updatePagination() {
  paginationState.totalPages = Math.ceil(voyageData.filteredVoyages.length / paginationState.itemsPerPage)
  renderPaginationControls()
}

function renderPaginationControls() {
  const container = document.getElementById("svt-pagination-controls")
  container.innerHTML = ""

  // Previous button
  const prevBtn = document.createElement("button")
  prevBtn.textContent = "Previous"
  prevBtn.disabled = paginationState.currentPage === 1
  prevBtn.addEventListener("click", () => goToPage(paginationState.currentPage - 1))
  container.appendChild(prevBtn)

  // Page numbers
  for (let i = 1; i <= paginationState.totalPages; i++) {
    const pageBtn = document.createElement("button")
    pageBtn.textContent = i
    pageBtn.className = i === paginationState.currentPage ? "active" : ""
    pageBtn.addEventListener("click", () => goToPage(i))
    container.appendChild(pageBtn)
  }

  // Next button
  const nextBtn = document.createElement("button")
  nextBtn.textContent = "Next"
  nextBtn.disabled = paginationState.currentPage === paginationState.totalPages
  nextBtn.addEventListener("click", () => goToPage(paginationState.currentPage + 1))
  container.appendChild(nextBtn)
}

function goToPage(page) {
  if (page >= 1 && page <= paginationState.totalPages) {
    paginationState.currentPage = page
    renderVoyageTable()
    renderPaginationControls()
  }
}

function updatePaginationInfo() {
  const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage + 1
  const endIndex = Math.min(startIndex + paginationState.itemsPerPage - 1, voyageData.filteredVoyages.length)
  const total = voyageData.filteredVoyages.length

  document.getElementById("svt-pagination-info").textContent =
    `Showing ${startIndex} to ${endIndex} of ${total} voyages`
}

// Sorting functions
function setupTableSorting() {
  const headers = document.querySelectorAll("th[data-sort]")
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const column = header.getAttribute("data-sort")
      sortTable(column)
    })
  })
}

function sortTable(column) {
  if (sortState.column === column) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc"
  } else {
    sortState.column = column
    sortState.direction = "asc"
  }

  voyageData.filteredVoyages.sort((a, b) => {
    let aValue, bValue

    switch (column) {
      case "vessel":
        const vesselA = voyageData.vessels.find((v) => v.id === a.vesselId)
        const vesselB = voyageData.vessels.find((v) => v.id === b.vesselId)
        aValue = vesselA ? vesselA.vesselname : ""
        bValue = vesselB ? vesselB.vesselname : ""
        break
      case "voyage":
        aValue = a.voyage_number
        bValue = b.voyage_number
        break
      case "charterType":
        const charterTypeA = voyageData.charterTypes.find((ct) => ct.id === a.charterTypeId)
        const charterTypeB = voyageData.charterTypes.find((ct) => ct.id === b.charterTypeId)
        aValue = charterTypeA ? charterTypeA.name : ""
        bValue = charterTypeB ? charterTypeB.name : ""
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
  headers.forEach((header) => {
    const indicator = header.querySelector(".svt-sort-indicator")
    if (header.getAttribute("data-sort") === sortState.column) {
      indicator.textContent = sortState.direction === "asc" ? "▲" : "▼"
    } else {
      indicator.textContent = "▲"
    }
  })
}

// Event listeners setup
function setupEventListeners() {
  // Items per page selector
  const itemsPerPageSelect = document.getElementById("svt-items-per-page")
  itemsPerPageSelect.addEventListener("change", (e) => {
    paginationState.itemsPerPage = Number.parseInt(e.target.value)
    paginationState.currentPage = 1
    updatePagination()
    renderVoyageTable()
  })

  // Table sorting
  setupTableSorting()
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

function showLoading(show) {
  const loadingIndicator = document.getElementById("svt-loading-indicator")
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? "block" : "none"
  }
}

function viewVoyageDetails(voyageId) {
  // Implement voyage details view
  console.log("View details for voyage:", voyageId)
  // You can redirect to a details page or show a modal
}

// Export functions for global access
window.voyageTracker = {
  viewVoyageDetails,
  refreshData: initializeApp,
}
