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
        plotScatterChartGeneric(chartData.results,"scatterChart1", "M/E Power", "FOC (kl/day)", "regressionInfo1");
        plotScatterChartGeneric(chartData.results,"scatterChart2", "M/E Power", "Ship Speed (GPS)", "regressionInfo2");
    } catch (error) {
        console.error("Error fetching chart data:", error);
    }
}

// Generic function to plot a scatter chart with quadratic regression line
// Generic function to plot a scatter chart with a quadratic regression line,
// filtering out any pairs where either x or y is missing or not a valid number.
function plotScatterChartGeneric(data, canvasId, xAxisParam, yAxisParam, regressionInfoId) {
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

    // Compute quadratic regression coefficients and function
    const { regressionFunc, coefficients } = polynomialRegression(xValues, yValues);

    // Generate regression line data using sorted x values
    const sortedX = [...xValues].sort((a, b) => a - b);
    const minX = sortedX[0];
    const maxX = sortedX[sortedX.length - 1];
    const numPoints = 100;
    const step = (maxX - minX) / (numPoints - 1);
    let regressionData = [];
    for (let i = 0; i < numPoints; i++) {
        const x = minX + i * step;
        regressionData.push({ x: x, y: regressionFunc(x) });
    }

    // Compute R² value for additional info
    const predictedY = dataPoints.map(pt => regressionFunc(pt.x));
    const actualY = dataPoints.map(pt => pt.y);
    const rSquared = computeRSquared(actualY, predictedY);

    // Format the regression equation and R² (using 8 decimal places)
    const formula = `y = ${coefficients.a.toFixed(8)}x² + ${coefficients.b.toFixed(8)}x + ${coefficients.c.toFixed(8)}`;
    const rSquaredText = `R² = ${rSquared.toFixed(8)}`;

    // Display regression info if a container is provided
    if (regressionInfoId) {
        const infoEl = document.getElementById(regressionInfoId);
        if (infoEl) {
            infoEl.innerHTML = `<strong>${formula}</strong><br>${rSquaredText}`;
        }
    }

    // Destroy previous chart instance if it exists (using a global variable keyed by canvasId)
    if (window[canvasId] && typeof window[canvasId].destroy === 'function') {
        window[canvasId].destroy();
    }

    // Create scatter chart with two datasets: data points and regression line
    window[canvasId] = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: `${xAxisParam} vs ${yAxisParam}`,
                    data: dataPoints,
                    borderColor: "blue",
                    backgroundColor: "rgba(0, 0, 255, 0.1)",
                    pointBackgroundColor: "blue",
                    pointRadius: 4
                },
                {
                    label: "Regression Line",
                    data: regressionData,
                    type: "line", // Force line type for regression
                    borderColor: "lightblue",
                    backgroundColor: "transparent",
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false
                }
            ]
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

  
// Helper: Compute determinant of a 3x3 matrix
function determinant3(m) {
    return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
         - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
         + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
}
  
// Compute quadratic regression (y = a*x^2 + b*x + c)
// using normal equations and Cramer's rule.
function polynomialRegression(xValues, yValues) {
    const n = xValues.length;
    let sumX = 0, sumY = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
    let sumXY = 0, sumX2Y = 0;
    for (let i = 0; i < n; i++) {
        const x = xValues[i];
        const y = yValues[i];
        const x2 = x * x;
        const x3 = x2 * x;
        const x4 = x3 * x;
        sumX  += x;
        sumY  += y;
        sumX2 += x2;
        sumX3 += x3;
        sumX4 += x4;
        sumXY += x * y;
        sumX2Y += x2 * y;
    }
    // Build coefficient matrix A and vector B
    let A = [
        [n, sumX, sumX2],
        [sumX, sumX2, sumX3],
        [sumX2, sumX3, sumX4]
    ];
    let B = [sumY, sumXY, sumX2Y];
      
    const detA = determinant3(A);
    if (detA === 0) {
        console.error("Determinant is zero. Regression cannot be computed.");
        return { regressionFunc: (x) => 0, coefficients: { a: 0, b: 0, c: 0 } };
    }
      
    // Solve for c, b, a using Cramer's rule
    let A_c = [
        [B[0], A[0][1], A[0][2]],
        [B[1], A[1][1], A[1][2]],
        [B[2], A[2][1], A[2][2]]
    ];
    let A_b = [
        [A[0][0], B[0], A[0][2]],
        [A[1][0], B[1], A[1][2]],
        [A[2][0], B[2], A[2][2]]
    ];
    let A_a = [
        [A[0][0], A[0][1], B[0]],
        [A[1][0], A[1][1], B[1]],
        [A[2][0], A[2][1], B[2]]
    ];
      
    const c = determinant3(A_c) / detA;
    const b = determinant3(A_b) / detA;
    const a = determinant3(A_a) / detA;
      
    return { regressionFunc: (x) => a * x * x + b * x + c, coefficients: { a, b, c } };
}
  
// Function to compute R-squared given actual and predicted values
function computeRSquared(actualY, predictedY) {
    const n = actualY.length;
    const meanY = actualY.reduce((acc, val) => acc + val, 0) / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
        ssTot += Math.pow(actualY[i] - meanY, 2);
        ssRes += Math.pow(actualY[i] - predictedY[i], 2);
    }
    return 1 - ssRes / ssTot;
}