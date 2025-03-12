async function applyFilters() {
    const vessel = document.getElementById("vessel-select").value;
    const parameters = getSelectedParameters();
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    let url = new URL(`${API_BASE_URL}/api/performance/multiple/`);
    let params = new URLSearchParams();

    if (vessel) params.append("vessel", vessel);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    parameters.forEach(param => params.append("parameters", param));

    url.search = params.toString();
    fetchParameterCorrelation(url);
}

async function fetchParameterCorrelation(url) {
    try {
        const response = await fetchWithAuth(url);
        if (!response.ok) throw new Error("Failed to fetch correlation data");

        const data = await response.json();
        plotScatterChart(data.results);
        displayTable(data.results);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function plotScatterChart(data) {
    const ctx = document.getElementById("scatterChart").getContext("2d");
    const selectedParameters = getSelectedParameters();

    // Build parameterMap from checkboxes (ID → Description)
    let parameterMap = {};
    document.querySelectorAll("#parameter-checkboxes input[type='checkbox']").forEach(checkbox => {
        parameterMap[checkbox.value] = checkbox.nextElementSibling.textContent; // ID → Description
    });

    const datasets = selectedParameters.map(paramId => {
        return {
            label: parameterMap[paramId] || `Parameter ${paramId}`, // Use description if available
            data: data.map(item => ({
                x: new Date(item.date),
                y: item[`parameter_${paramId}`] || 0
            })),
            borderColor: getRandomColor(),
            backgroundColor: "transparent",
            pointBackgroundColor: getRandomColor()
        };
    });

    if (scatterChart) {
        scatterChart.destroy();
    }

    scatterChart = new Chart(ctx, {
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
