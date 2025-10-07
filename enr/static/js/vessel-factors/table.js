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


function displayTable(data) {
    // Extract the data from the API response
    const tableHead = document.getElementById("table-head");
    const tableBody = document.getElementById("table-body");

    // Clear any existing content
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='5' class='px-4 py-2 border text-center'>No data available</td></tr>";
        return;
    }

    // Get keys from the first object that start with "parameter_"
    const parameterKeys = Object.keys(data[0]).filter(key => key.startsWith("parameter_"));

    // Build the table header with fixed columns and dynamic parameter columns
    let headerRow = `
         <tr class="border-b">
             <th class="px-4 py-2 border">Date</th>
             <th class="px-4 py-2 border">Movement</th>
             <th class="px-4 py-2 border">Displacement</th>`;
    parameterKeys.forEach(key => {
         // Remove the prefix to display just the parameter code
         const paramTitle = key.replace("parameter_", "");
         headerRow += `<th class="px-4 py-2 border">${paramTitle}</th>`;
    });
    headerRow += "</tr>";
    tableHead.innerHTML = headerRow;

    // Build the table rows
    data.forEach(item => {
         let row = `
              <tr class="border-b">
                  <td class="px-2 py-1 border w-32 whitespace-nowrap">${item.date}</td>
                  <td class="px-4 py-2 border">${formatNumber(item.movement)}</td>
                  <td class="px-4 py-2 border">${formatNumber(item.displacement)}</td>`;
         parameterKeys.forEach(key => {
              row += `<td class="px-4 py-2 border">${formatNumber(item[key])}</td>`;
         });
         row += "</tr>";
         tableBody.innerHTML += row;
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
