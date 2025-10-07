document.addEventListener('DOMContentLoaded', function() {
    // Helper function to get query parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Get the vessel and voyage parameters from the URL
    const vesselId = getQueryParam('vessel_id') || 2;
    const voyageNumberId = getQueryParam('voyage_number_id') || 3;

    // Ensure that the parameters exist before making the request
    //if (!vesselId || !voyageNumberId) {
    //    alert("Both 'vessel_id' and 'voyage_number_id' are required.");
    //    return;
    //}

    // Fetch data from the API based on the vessel and voyage parameters
    fetch(`/api/voyage/details/?vessel_id=${vesselId}&voyage_number_id=${voyageNumberId}`)
        .then(res => res.json())
        .then(data => {
            populateTables(data);
        })
        .catch(err => {
            console.error('Error fetching voyage details:', err);
        });

    // Tab functionality for switching between tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Synchronize scrolling between fixed and scrollable tables
    synchronizeTableScroll();

    // Function to convert minutes to hh:mm format
    function formatDuration(minutes) {
        if (minutes === null || minutes === undefined || minutes === '' || isNaN(minutes) || minutes < 0) {
            return ''; // Return blank for null, undefined, empty string, NaN, or negative
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }



    // Populate tables with data
    function populateTables(data) {
        const fixedTableBody = document.getElementById('fixed-table-body');
        const scrollTableBody = document.getElementById('scroll-table-body');

        // Clear existing data
        fixedTableBody.innerHTML = '';
        scrollTableBody.innerHTML = '';

        // Add data rows to both fixed and scrollable tables
        data.forEach((entry, index) => {
            const date = new Date(entry.date_time);  // Create a new Date object
            const formattedDate = date.toLocaleString('en-GB', {
                timeZone: 'UTC',           // ← key addition
                day: '2-digit',
                month: 'short',
                year: 'numeric',           // show full year
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            //RH Section
            const formattedDuration = formatDuration(entry.duration);
            const formattedMe_rh = formatDuration(entry.me_rh); 
            const formattedBoiler_rh = formatDuration(entry.boiler_rh);
            const formattedAux1_rh = formatDuration(entry.aux1_rh);
            const formattedAux2_rh = formatDuration(entry.aux2_rh);
            const formattedAux3_rh = formatDuration(entry.aux3_rh);
            const formattedCC1_rh = formatDuration(entry.cc1_rh);
            const formattedCC2_rh = formatDuration(entry.cc2_rh);
            const formattedCC3_rh = formatDuration(entry.cc3_rh);
            const formattedCC4_rh = formatDuration(entry.cc4_rh);
            const formattedCC5_rh = formatDuration(entry.cc5_rh);
            const formattedCC6_rh = formatDuration(entry.cc6_rh);
            const formattedEG_rh = formatDuration(entry.eg_rh);
            const formattedBT_rh = formatDuration(entry.bt_rh);

            const fixedRow = document.createElement('tr');
            fixedRow.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.activity}</td>
                <td>${entry.trip_number || ''}</td>
                <td>${formattedDate}</td>
                <td>${entry.timezone}</td>
                <td>${entry.step}</td>
                <td>${formattedDuration}</td>
            `;
            fixedTableBody.appendChild(fixedRow);

            // Scrollable table row
            const scrollRow = document.createElement('tr');
            scrollRow.innerHTML = `
                <td>${entry.loc_atfrom || ''}</td>
                <td>${entry.loc_to || ''}</td>
                <td class="numeric">${entry.engine_merpm || ''}</td>
                <td class="numeric">${entry.engine_meload || ''}</td>
                <td class="numeric">${entry.engine_proprpm || ''}</td>
                <td class="numeric">${entry.engine_speed || ''}</td>
                <td class="numeric">${entry.engine_propcpp || ''}</td>
                <td class="numeric">${entry.me_fm_in || ''}</td>
                <td class="numeric">${entry.me_fm_out || ''}</td>
                <td class="numeric">${entry.me_fo_cons || ''}</td>
                <td class="numeric">${entry.me_do_cons || ''}</td>
                <td>${entry.me_cons_check || ''}</td>
                <td class="numeric">${formattedMe_rh || ''}</td>
                <td class="numeric">${entry.boiler_fm_in || ''}</td>
                <td class="numeric">${entry.boiler_fm_out || ''}</td>
                <td class="numeric">${entry.boiler_fo_cons || ''}</td>
                <td class="numeric">${entry.boiler_do_cons || ''}</td>
                <td>${entry.boiler_cons_check || ''}</td>
                <td class="numeric">${formattedBoiler_rh || ''}</td>
                <td class="numeric">${entry.auxfm || ''}</td>
                <td class="numeric">${entry.aux1_do_cons || ''}</td>
                <td class="numeric">${entry.aux2_do_cons || ''}</td>
                <td class="numeric">${entry.aux3_do_cons || ''}</td>
                <td>${entry.aux_cons_check || ''}</td>
                <td class="numeric">${formattedAux1_rh  || ''}</td>
                <td class="numeric">${formattedAux2_rh  || ''}</td>
                <td class="numeric">${formattedAux3_rh  || ''}</td>
                <td class="numeric">${entry.cc1_do_cons  || ''}</td>
                <td class="numeric">${entry.cc2_do_cons  || ''}</td>
                <td class="numeric">${entry.cc3_do_cons  || ''}</td>
                <td class="numeric">${entry.cc4_do_cons  || ''}</td>
                <td class="numeric">${entry.cc5_do_cons  || ''}</td>
                <td class="numeric">${entry.cc6_do_cons  || ''}</td>
                <td class="numeric">${formattedCC1_rh  || ''}</td>
                <td class="numeric">${formattedCC2_rh  || ''}</td>
                <td class="numeric">${formattedCC3_rh  || ''}</td>
                <td class="numeric">${formattedCC4_rh  || ''}</td>
                <td class="numeric">${formattedCC5_rh  || ''}</td>
                <td class="numeric">${formattedCC6_rh  || ''}</td>
                <td class="numeric">${entry.eg_do_cons  || ''}</td>
                <td class="numeric">${formattedEG_rh  || ''}</td>
                <td class="numeric">${entry.bt_do_cons  || ''}</td>
                <td class="numeric">${formattedBT_rh  || ''}</td>
                <td class="numeric">${entry.other_fo_cons  || ''}</td>
                <td class="numeric">${entry.other_do_cons  || ''}</td>
                <td class="numeric">${entry.total_fo_cons_in_kl  || ''}</td>
                <td class="numeric">${entry.total_do_cons_in_kl  || ''}</td>
                <td class="numeric">${entry.fo_rob_in_kl  || ''}</td>
                <td class="numeric">${entry.fo_fots  || ''}</td>
                <td class="numeric">${entry.fo_correction  || ''}</td>
                <td class="numeric">${entry.fo_supply  || ''}</td>
                <td class="numeric">${entry.fo_supply_type  || ''}</td>
                <td class="numeric">${entry.do_rob_in_kl  || ''}</td>
                <td class="numeric">${entry.do_fots  || ''}</td>
                <td class="numeric">${entry.do_correction  || ''}</td>
                <td class="numeric">${entry.do_supply  || ''}</td>
                <td class="numeric">${entry.do_supply_type  || ''}</td>
                <td class="numeric">${entry.fo_sg  || ''}</td>
                <td class="numeric">${entry.do_sg  || ''}</td>
                <td class="numeric">${entry.total_fo_cons_in_mt  || ''}</td>
                <td class="numeric">${entry.total_do_cons_in_mt  || ''}</td>
                <td class="numeric">${entry.fo_rob_in_mt  || ''}</td>
                <td class="numeric">${entry.do_cons_in_mt  || ''}</td>
            `;
            scrollTableBody.appendChild(scrollRow);
        });
    }

    // Synchronize scrolling between fixed and scrollable tables
    function synchronizeTableScroll() {
        const fixedTableContainer = document.querySelector('.fixed-table-container');
        const scrollTableContainer = document.querySelector('.scroll-table-container');

        // Synchronize vertical scrolling
        fixedTableContainer.addEventListener('scroll', function() {
            scrollTableContainer.scrollTop = fixedTableContainer.scrollTop;
        });

        scrollTableContainer.addEventListener('scroll', function() {
            fixedTableContainer.scrollTop = scrollTableContainer.scrollTop;
        });
    }
});
