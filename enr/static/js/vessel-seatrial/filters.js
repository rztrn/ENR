function getFilterParams() {
    return {
        vessel: document.getElementById("vessel-select").value,
    };
}

function buildUrl(endpoint) {
    const url = new URL(`${window.location.origin}${endpoint}`);
    const filters = getFilterParams();
    const params = new URLSearchParams();
    if (filters.vessel) params.append("vessel", filters.vessel);
    url.search = params.toString();
    return url;
}