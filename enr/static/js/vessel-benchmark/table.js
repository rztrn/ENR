// static/js/table.js
let currentPage = 1;
let pageSize = 10;
let totalRows = 0;

async function fetchTableData(benchmarkedUrl) {
    try {
        console.log("Constructed URL for Table Data:", benchmarkedUrl.toString());
        const response = await fetchWithAuth(benchmarkedUrl);

        if (!response.ok) {
            if (response.status === 401) {
                alert("Session expired. Please log in again.");
                logout();
                return;
            } else {
                throw new Error(`Failed to fetch table data: ${response.statusText}`);
            }
        }

        const tabledata = await response.json();
        console.log("API Response (Table Data):", tabledata);

        // Ensure tabledata is not empty
        if (!tabledata || Object.keys(tabledata).length === 0) {
            console.warn("API response is empty.");
            displayTable({}); // Pass an empty object to avoid errors
            return;
        }

        // Pass the rawData (as returned by API) to displayTable
        displayTable(tabledata);

    } catch (error) {
        console.error("Error fetching table data:", error);
    }
}

function formatNumber(value) {
    return (typeof value === "number" && !isNaN(value)) ? value.toFixed(2) : value;
}

function displayTable(rawData) {
    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");

    // Extract dates (keys from rawData) and sort them
    const dates = Object.keys(rawData).sort();

    // Collect all unique parameter codes across all dates
    const parameterSet = new Set();
    dates.forEach(date => {
        const parameters = rawData[date];
        Object.keys(parameters).forEach(param => parameterSet.add(param));
    });
    const parameters = Array.from(parameterSet).sort();

    // Build table header with merged date columns and subheaders
    let headerHTML = `<tr><th rowspan="2">Parameter</th>`;
    dates.forEach(date => {
        headerHTML += `<th colspan="3">${date}</th>`;
    });
    headerHTML += `</tr><tr>`;
    dates.forEach(() => {
        headerHTML += `<th>ENR Value</th><th>Benchmarked</th><th>Difference</th>`;
    });
    headerHTML += `</tr>`;
    tableHead.innerHTML = headerHTML;

    // Build table body: For each parameter, create a row with values for each date.
    let bodyHTML = "";
    parameters.forEach(param => {
        bodyHTML += `<tr><td>${param}</td>`;
        dates.forEach(date => {
            // Check if data exists for the parameter on this date; if not, show dashes.
            const paramData = rawData[date][param] || {};
            const enr = (paramData.enr_value !== undefined) ? formatNumber(paramData.enr_value) : "-";
            const benchmark = (paramData.benchmark !== undefined) ? formatNumber(paramData.benchmark) : "-";
            const difference = (paramData.difference !== undefined) ? formatNumber(paramData.difference) : "-";

            bodyHTML += `<td>${enr}</td><td>${benchmark}</td><td>${difference}</td>`;
        });
        bodyHTML += `</tr>`;
    });
    tableBody.innerHTML = bodyHTML;
}

window.fetchTableData = fetchTableData;
window.displayTable = displayTable;
