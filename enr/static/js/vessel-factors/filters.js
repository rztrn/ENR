function getFilterParams() {
    return {
        vessel: document.getElementById("vessel-select").value,
    };
}

function buildUrl(endpoint, extraParams = {}) {
    const url = new URL(`${window.location.origin}${endpoint}`);
    const filters = getFilterParams();
    const params = new URLSearchParams();

    // Add filter parameters (e.g., vessel)
    if (filters.vessel) params.append("vessel", filters.vessel);

    // Add any extra parameters provided
    for (const key in extraParams) {
        if (extraParams.hasOwnProperty(key)) {
            params.append(key, extraParams[key]);
        }
    }

    url.search = params.toString();
    return url;
}
