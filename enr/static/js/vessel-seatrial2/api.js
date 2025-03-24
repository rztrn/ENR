// static/js/api.js
async function fetchVesselList() {
    try {
        const response = await fetchWithAuth(`${window.location.origin}/api/vessels/`);
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


window.fetchVesselList = fetchVesselList;

