async function fetchChartData(urls) {
    try {
        // Use Promise.all to fetch raw data, internal regression, and external regression concurrently
        const [rawResponse, internalResponse, externalResponse] = await Promise.all([
            fetchWithAuth(urls.Url),
            fetchWithAuth(urls.regressionInternalUrl),
            fetchWithAuth(urls.regressionExternalUrl)
        ]);
        
        // Handle potential errors for each response
        if (!rawResponse.ok) {
            if (rawResponse.status === 401) {
                alert("Session expired. Please log in again.");
                logout();
            } else {
                throw new Error("Failed to fetch raw chart data");
            }
        }
        if (!internalResponse.ok) {
            if (internalResponse.status === 401) {
                alert("Session expired. Please log in again.");
                logout();
            } else {
                throw new Error("Failed to fetch internal regression data");
            }
        }
        if (!externalResponse.ok) {
            if (externalResponse.status === 401) {
                alert("Session expired. Please log in again.");
                logout();
            } else {
                throw new Error("Failed to fetch external regression data");
            }
        }
        
        // Parse JSON responses
        const rawData = await rawResponse.json();
        const internalData = await internalResponse.json();
        const externalData = await externalResponse.json();

        // For Debugging
        /*
        console.log("API Response (Raw Data):", rawData.results);
        console.log("API Response (Internal Regression Data):", internalData.results);
        console.log("API Response (External Regression Data):", externalData.results);
        */

        // Plot scatter chart for internal model: M/E Power vs FOC (kl/day)
        plotScatterChartGeneric(
            rawData.results,
            "scatterChart1",
            "M/E Power",
            "FOC (kl/day)",
            "regressionInfo1",
            internalData.results[0]  // regression model for internal model
        );

        // Plot scatter chart for external model: M/E Power vs Ship Speed (GPS)
        plotScatterChartGeneric(
            rawData.results,
            "scatterChart2",
            "M/E Power",
            "Ship Speed (GPS)",
            "regressionInfo2",
            externalData.results[0]  // regression model for external model
        );
    } catch (error) {
        console.error("Error fetching chart data:", error);
    }
}

// Generic function to plot a scatter chart with a quadratic regression line
function plotScatterChartGeneric(data, canvasId, xAxisParam, yAxisParam, regressionInfoId, regressionModel) {
    const ctx = document.getElementById(canvasId).getContext("2d");

   // Group data by a unique key using 'session' and 'timestamp'
   let groups = data.reduce((acc, item) => {
    // Only consider items for the specified parameters
    if (item.description === xAxisParam || item.description === yAxisParam) {
        // Use a unique key from session and timestamp (adjust as needed)
        let key = item.session + "_" + item.timestamp;
        if (!acc[key]) {
            acc[key] = {};
        }
        // For the x-axis parameter, store the value if it's valid
        if (item.description === xAxisParam) {
            let val = Number(item.value);
            if (!isNaN(val)) {
                acc[key].x = val;
            }
        }
        // For the y-axis parameter, store the value if it's valid
        if (item.description === yAxisParam) {
            let val = Number(item.value);
            if (!isNaN(val)) {
                acc[key].y = val;
            }
        }
    }
    return acc;
}, {});

// Build arrays from groups for valid pairs
let xValues = [];
let yValues = [];
let dataPoints = [];
Object.keys(groups).forEach(key => {
    const pair = groups[key];
    // Only include pairs if both x and y exist
    if (pair.x !== undefined && pair.y !== undefined) {
        xValues.push(pair.x);
        yValues.push(pair.y);
        dataPoints.push({ x: pair.x, y: pair.y });
    }
});

if (dataPoints.length === 0) {
    console.error(`❌ No valid data points found for ${canvasId}`);
    return;
}

    // If a regression model is provided, use its coefficients to generate a regression line.
    let regressionDataset = null;
    if (regressionModel) {
        const a = regressionModel.coefficient_a;
        const b = regressionModel.coefficient_b;
        const c = regressionModel.coefficient_c;
        const rSquared = regressionModel.coefficient_determination;

        // Generate regression line data using the range of x values
        const xValues = dataPoints.map(pt => pt.x);
        const sortedX = [...xValues].sort((x1, x2) => x1 - x2);
        const minX = sortedX[0];
        const maxX = sortedX[sortedX.length - 1];
        const numPoints = 100;
        const step = (maxX - minX) / (numPoints - 1);
        let regressionData = [];
        for (let i = 0; i < numPoints; i++) {
            const x = minX + i * step;
            const y = a * x * x + b * x + c;  // quadratic equation
            regressionData.push({ x, y });
        }

        // Display the regression equation and R² value
        if (regressionInfoId) {
            const infoEl = document.getElementById(regressionInfoId);
            if (infoEl) {
                const formulaStr = `y = ${a.toFixed(8)}x² + ${b.toFixed(8)}x + ${c.toFixed(8)}`;
                const rSquaredStr = `R² = ${rSquared.toFixed(8)}`;
                infoEl.innerHTML = `<strong>${formulaStr}</strong><br>${rSquaredStr}`;
            }
        }

        regressionDataset = {
            label: "Regression Line",
            data: regressionData,
            type: "line",
            borderColor: "lightblue",
            backgroundColor: "transparent",
            pointRadius: 0,
            borderWidth: 2,
            fill: false
        };
    }

    // Prepare datasets: always include data points
    let datasets = [
        {
            label: `${xAxisParam} vs ${yAxisParam}`,
            data: dataPoints,
            borderColor: "blue",
            backgroundColor: "rgba(0, 0, 255, 0.1)",
            pointBackgroundColor: "blue",
            pointRadius: 4
        }
    ];
    // Add regression line dataset if available
    if (regressionDataset) {
        datasets.push(regressionDataset);
    }

    // Destroy any existing chart instance on this canvas
    if (window[canvasId] && typeof window[canvasId].destroy === "function") {
        window[canvasId].destroy();
    }

    // Create a new Chart.js scatter chart
    window[canvasId] = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: datasets
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
