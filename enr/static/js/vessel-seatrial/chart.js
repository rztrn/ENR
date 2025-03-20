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

// Function to create a curved line chart
function plotScatterChart(data) {
    const ctx = document.getElementById("scatterChart").getContext("2d");

    // Hardcoded X and Y axis descriptions (Make sure these match your dataset)
    const xAxisParam = "M/E Power";  
    const yAxisParam = "FOC (kl/day)";

    // Arrays to store X and Y values
    let xValues = [];
    let yValues = [];

    // Extract data points based on descriptions
    data.forEach(item => {
        if (item.description === xAxisParam) {
            xValues.push(item.value);
        }
        if (item.description === yAxisParam) {
            yValues.push(item.value);
        }
    });

    // Ensure X and Y values are paired correctly
    const dataPoints = xValues.map((x, index) => ({
        x: x,
        y: yValues[index] || 0
    })).filter(point => !isNaN(point.x) && !isNaN(point.y)); // Remove invalid points

    if (dataPoints.length === 0) {
        console.error("❌ No valid data points found.");
        return;
    }

    // Destroy previous chart instance if it exists
    if (window.scatterChart && typeof window.scatterChart.destroy === 'function') {
        window.scatterChart.destroy();
    }

    // Create scatter chart
    window.scatterChart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [{
                label: `${xAxisParam} vs ${yAxisParam}`,
                data: dataPoints,
                borderColor: "blue", // Default color
                backgroundColor: "rgba(0, 0, 255, 0.1)", // Light blue for visibility
                pointBackgroundColor: "blue",
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: xAxisParam } },
                y: { title: { display: true, text: yAxisParam } }
            },
            plugins: { legend: { display: true } }
        }
    });
}
