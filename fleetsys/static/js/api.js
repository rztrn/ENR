document.addEventListener("DOMContentLoaded", function () {
    fetchVesselList();
    fetchParameterList();
});

async function fetchVesselList() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/vessels/`);
        if (!response.ok) throw new Error("Failed to fetch vessels");

        const data = await response.json();
        const vessels = Array.isArray(data) ? data : data.results;
        populateVesselDropdown(vessels);
    } catch (error) {
        console.error("Error fetching vessels:", error);
    }
}

function populateVesselDropdown(vessels) {
    const vesselSelect = document.getElementById("vessel-select");
    vesselSelect.innerHTML = `<option value="">Select Vessel</option>`;

    vessels.forEach(vessel => {
        const option = document.createElement("option");
        option.value = vessel.id;
        option.textContent = vessel.vesselname;
        vesselSelect.appendChild(option);
    });
}

async function fetchParameterList() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/parameters/`);
        if (!response.ok) throw new Error("Failed to fetch parameters");

        const data = await response.json();
        const parameters = Array.isArray(data) ? data : data.results;
        populateParameterFilters(parameters);
    } catch (error) {
        console.error("Error fetching parameters:", error);
    }
}

function populateParameterFilters(parameters) {
    const container = document.getElementById("parameter-checkboxes");
    container.innerHTML = "";

    parameters.forEach(param => {
        const div = document.createElement("div");
        div.innerHTML = `
            <label class="flex items-center space-x-2">
                <input type="checkbox" value="${param.id}" class="form-checkbox">
                <span>${param.description}</span>
            </label>
        `;
        container.appendChild(div);
    });
}
