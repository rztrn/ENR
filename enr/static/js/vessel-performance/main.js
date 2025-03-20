window.scatterChart = null;

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    fetchVesselList();
    fetchParameterList();
    fetchFilterOptions();

    // Bind pagination buttons if they exist
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", prevPage);
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", nextPage);
    }
    
    // Bind the applyFilters function to the corresponding button
    const applyFiltersButton = document.querySelector("button[onclick='applyFilters()']");
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener("click", applyFilters);
    } else {
        console.error("Apply Filters button not found in the DOM.");
    }
});

// The applyFilters function remains unchanged.
function applyFilters() {
    currentPage = 1; // Reset pagination to first page
    const tableUrl = buildUrl("/api/performance/multiple/");
    console.log("Constructed Table URL:", tableUrl.toString());
    // For chart data, add full_data flag
    const chartUrl = buildUrl("/api/performance/multiple/", { full_data: "true" });
    console.log("Constructed Chart URL:", chartUrl.toString());
    fetchChartData(chartUrl);
    fetchTableData(tableUrl);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("download-excel").addEventListener("click", async () => {
        const url = buildUrl("/api/download-excel/"); // Reuse buildUrl for filters
        try {
            const response = await fetchWithAuth(url.toString(), { method: "GET" });
            if (!response.ok) {
                console.error("Failed to download Excel file:", response.status);
                return;
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = "vessel_performance.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error downloading Excel file:", error);
        }
    });
});
