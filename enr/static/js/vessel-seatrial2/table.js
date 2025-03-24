// static/js/table.js
let currentPage = 1;
let pageSize = 10;
let totalRows = 0;

async function fetchTableData(url) {
    try {
        console.log("Constructed URL for Table Data:", url.toString());
        const response = await fetchWithAuth(url);
        if (!response.ok) {
            if (response.status === 401) {
                alert("Session expired. Please log in again.");
                logout();
            } else {
                throw new Error("Failed to fetch table data");
            }
        }
        const tabledata = await response.json();
        console.log("API Response (Table Data):", tabledata);
        displayTable(tabledata.results);
    } catch (error) {
        console.error("Error fetching table data:", error);
    }
}

/*
function displayTable(rawData) {
    let tableData = {};  // Store grouped data
    let parameterDescription = new Set();  // Store all parameter names

    // Process raw data
    rawData.forEach(row => {
        let key = `${row.timestamp}-${row.session}-${row.vessel}`;
        if (!tableData[key]) {
            tableData[key] = {
                timestamp: row.timestamp,
                session: row.session,
                vessel: row.vessel
            };
        }
        tableData[key][row.description] = row.value;  // Dynamically add parameters
        parameterDescription.add(row.description);
    });

    // Convert to array format
    let finalData = Object.values(tableData);
    let descriptionList = Array.from(parameterDescription);  // Convert Set to Array

    // Get table elements
    const tableHead = document.getElementById("table-head");
    const tableBody = document.getElementById("table-body");

    // Clear existing content
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // Build table headers
    let headerRow = `<tr>
        <th>Timestamp</th>
        <th>Session</th>
        <th>Vessel</th>`;
    
    descriptionList.forEach(param => {
        headerRow += `<th>${param}</th>`;
    });

    headerRow += `</tr>`;
    tableHead.innerHTML = headerRow;

    // Build table rows
    finalData.forEach(row => {
        let tr = `<tr>
            <td>${row.timestamp}</td>
            <td>${row.session}</td>
            <td>${row.vessel}</td>`;
        
        descriptionList.forEach(param => {
            tr += `<td>${row[param] !== undefined ? formatNumber(row[param]) : "N/A"}</td>`;
        });

        tr += `</tr>`;
        tableBody.innerHTML += tr;
    });
}

function formatNumber(value) {
    return (typeof value === "number" && !isNaN(value)) ? value.toFixed(2) : value;
}
*/

function displayTable(rawData) {
    let tableData = {};  // Stores data in transposed format
    let headers = new Set();  // Unique (Timestamp, Session, Vessel) combinations
    let parameterDescriptions = new Set();  // Unique parameters

    // Process raw data
    rawData.forEach(row => {
        let formattedTimestamp = formatTimestamp(row.timestamp); // Format timestamp
         let key = `${formattedTimestamp}`;
        if (!tableData[row.description]) {
            tableData[row.description] = {};  // Initialize row for this parameter
        }
        tableData[row.description][key] = row.value;  // Store value under the timestamp/session/vessel key
        headers.add(key);  // Store unique column headers
        parameterDescriptions.add(row.description);
    });

    let headerList = Array.from(headers);  // Convert Set to Array for ordered columns
    let descriptionList = Array.from(parameterDescriptions);  // Convert Set to Array

    // Get table elements
    const tableHead = document.getElementById("table-head");
    const tableBody = document.getElementById("table-body");

    // Clear existing content
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // Build transposed table headers
    let headerRow = `<tr><th>Parameter</th>`;
    headerList.forEach(header => {
        headerRow += `<th>${header}</th>`;
    });
    headerRow += `</tr>`;
    tableHead.innerHTML = headerRow;

    // Build transposed table rows
    descriptionList.forEach(description => {
        let tr = `<tr><td>${description}</td>`;  // Parameter name in the first column
        headerList.forEach(header => {
            let value = tableData[description][header] !== undefined ? formatNumber(tableData[description][header]) : "N/A";
            tr += `<td>${value}</td>`;
        });
        tr += `</tr>`;
        tableBody.innerHTML += tr;
    });
}

function updatePaginationControls(next, previous) {
    document.getElementById("prev-page").disabled = !previous;
    document.getElementById("next-page").disabled = !next;
}

function changePage(increment) {
    const totalPages = Math.ceil(totalRows / pageSize);
    const newPage = currentPage + increment;
    if (newPage >= 1 && newPage <= totalPages) {
         currentPage = newPage;
         const url = buildUrl("/api/performance/multiple/", { page: currentPage });
         console.log(`Paginated URL with Filters (Page ${currentPage}):`, url.toString());
         fetchTableData(url);
    }
}

function nextPage() { changePage(1); }
function prevPage() { changePage(-1); }

window.fetchTableData = fetchTableData;
window.displayTable = displayTable;
window.changePage = changePage;
window.nextPage = nextPage;
window.prevPage = prevPage;
