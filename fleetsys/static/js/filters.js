// static/js/filters.js
function getSelectedParameters() {
    return Array.from(document.querySelectorAll("#parameter-checkboxes input:checked"))
                .map(checkbox => checkbox.value);
}

function getFilterParams() {
    return {
        vessel: document.getElementById("vessel-select").value,
        movement: document.getElementById("movement-select").value,
        displacement: document.getElementById("displacement-select").value,
        start_date: document.getElementById("start-date").value,
        end_date: document.getElementById("end-date").value,
        parameters: getSelectedParameters()
    };
}

function buildUrl(endpoint, extraParams = {}) {
    const url = new URL(`${window.location.origin}${endpoint}`);
    const filters = getFilterParams();
    const params = new URLSearchParams();
    if (filters.vessel) params.append("vessel", filters.vessel);
    if (filters.movement) params.append("movement", filters.movement);
    if (filters.displacement) params.append("displacement", filters.displacement);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    filters.parameters.forEach(param => params.append("parameters", param));
    Object.keys(extraParams).forEach(key => {
         params.append(key, extraParams[key]);
    });
    url.search = params.toString();
    return url;
}

   /* ============================
       UI Interactions & Filter Pane
       ============================ */
function openFilterPane() {
    document.getElementById("filter-pane").classList.remove("translate-x-full");
}

function closeFilterPane() {
    document.getElementById("filter-pane").classList.add("translate-x-full");
}

window.getSelectedParameters = getSelectedParameters;
window.getFilterParams = getFilterParams;
window.buildUrl = buildUrl;
window.openFilterPane = openFilterPane;
window.closeFilterPane = closeFilterPane;
