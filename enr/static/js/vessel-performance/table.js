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
        totalRows = tabledata.count || 0;
        const maxPages = Math.max(1, Math.ceil(totalRows / pageSize));
        updatePaginationControls(tabledata.next, tabledata.previous);
        document.getElementById("pagination-info").textContent = `Page ${currentPage} of ${maxPages}`;
    } catch (error) {
        console.error("Error fetching table data:", error);
    }
}

function displayTable(data) {
    const tableHead = document.getElementById("table-head");
    const tableBody = document.getElementById("table-body");
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    if (data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='5' class='px-4 py-2 border text-center'>No data available</td></tr>";
        return;
    }
    let parameterMap = {};
    document.querySelectorAll("#parameter-checkboxes input[type='checkbox']").forEach(checkbox => {
         parameterMap[checkbox.value] = checkbox.nextElementSibling.textContent;
    });
    const parameterKeys = Object.keys(data[0]).filter(key => key.startsWith("parameter_"));
    let headerRow = `
         <tr class="border-b">
             <th class="px-4 py-2 border">Date</th>
             <th class="px-4 py-2 border">Movement</th>
             <th class="px-4 py-2 border">Displacement</th>`;
    parameterKeys.forEach(key => {
         const paramId = key.replace("parameter_", "");
         const paramDesc = parameterMap[paramId] || key;
         headerRow += `<th class="px-4 py-2 border">${paramDesc}</th>`;
    });
    headerRow += "</tr>";
    tableHead.innerHTML = headerRow;
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
