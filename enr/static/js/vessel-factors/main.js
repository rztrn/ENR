window.scatterChart = null;

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    fetchVesselList();

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
    const Url = buildUrl("/api/performance/seatrial/");
    const PerformanceUrl = buildUrl("/api/performance/factors/");
    const regressionInternalUrl = buildUrl("/api/model/seatrial/", { model_type: "internal" });
    const regressionExternalUrl = buildUrl("/api/model/seatrial/", { model_type: "external" });
    
    // Fetch table data as before
    fetchTableData(PerformanceUrl);
    
    // Pass all three URLs to fetchChartData
    fetchChartData({
        Url,
        regressionInternalUrl,
        regressionExternalUrl
    });
}


