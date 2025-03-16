async function fetchChartData(url) {
    try {
        console.log("Constructed URL for Chart Data:", url.toString());
        const response = await fetchWithAuth(url);
        if (!response.ok) {
            if (response.status === 401) {
                alert("Session expired. Please log in again.");
                logout();
            } else {
                throw new Error("Failed to fetch chart data");
            }
        }
        const chartData = await response.json();
        console.log("API Response (Chart Data):", chartData.results);
        plotScatterChart(chartData.results);
    } catch (error) {
        console.error("Error fetching chart data:", error);
    }
}

// static/js/chart.js

function plotScatterChart(data) {
    const ctx = document.getElementById("scatterChart").getContext("2d");
    const selectedParameters = getSelectedParameters();
    let parameterMap = {};
    document.querySelectorAll("#parameter-checkboxes input[type='checkbox']").forEach(checkbox => {
         parameterMap[checkbox.value] = checkbox.nextElementSibling.textContent;
    });
    const datasets = selectedParameters.map(paramId => ({
         label: parameterMap[paramId] || `Parameter ${paramId}`,
         data: data.map(item => ({
              x: new Date(item.date),
              y: item[`parameter_${paramId}`] || 0
         })),
         borderColor: getRandomColor(),
         backgroundColor: "transparent",
         pointBackgroundColor: getRandomColor()
    }));
    // Safely destroy existing chart instance if it exists and has a destroy method
    if (window.scatterChart && typeof window.scatterChart.destroy === 'function') {
         window.scatterChart.destroy();
    }
    window.scatterChart = new Chart(ctx, {
         type: "scatter",
         data: { datasets },
         options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                   x: { type: "time", time: { unit: "day" } },
                   y: { beginAtZero: true }
              }
         }
    });
}

function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

window.fetchChartData = fetchChartData;
window.plotScatterChart = plotScatterChart;
window.getRandomColor = getRandomColor;
