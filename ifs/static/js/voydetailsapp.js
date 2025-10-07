document.addEventListener('DOMContentLoaded', () => {
    // Query params helper
    const getQueryParam = k => new URLSearchParams(location.search).get(k);
  
    const vesselId = getQueryParam('vessel_id');
    const voyageId = getQueryParam('voyage_id');
  
    // Cache tab buttons and contents
    const tabs       = document.querySelectorAll('.tab-btn');
    const contents   = document.querySelectorAll('.tab-content');
  
    // Wire up tab switching + dynamic fetch
    tabs.forEach(btn => btn.addEventListener('click', () => {
      // activate tab
      tabs.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
  
      // fetch new data
      const apiUrl = `${btn.dataset.api}?voyage_id=${voyageId}`;
      fetch(apiUrl)
        .then(r => r.json())
        .then(data => {
          switch(btn.dataset.tab) {
            case 'engine-form': populateEngine(data); break;
            case 'deck-form':   populateDeck(data);   break;
            case 'lo-form':     populateLO(data);     break;
          }
        })
        .catch(console.error);
    }));
  
    // initial load
    document.querySelector('.tab-btn.active').click();
  
    // fmt minutes → hh:mm
    function fmtMin(m) {
      if (!m || isNaN(m) || m<0) return '';
      const h = Math.floor(m/60), mm = m%60;
      return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
    }
  
    // ENGINE table populator
    function populateEngine(rows) {
      const fBody = document.getElementById('fixed-engine-fixed-body');
      const sBody = document.getElementById('scroll-engine-scroll-body');
      fBody.innerHTML = ''; sBody.innerHTML = '';
  
      rows.forEach((e,i) => {
        const d = new Date(e.date_time);
        const fmtDate = d.toLocaleString('en-GB', {
          timeZone: 'UTC', day:'2-digit', month:'short',
          year:'numeric', hour:'2-digit', minute:'2-digit',
          hour12:false
        });
  
        // fixed columns
        fBody.insertAdjacentHTML('beforeend', `
          <tr>
            <td>${i+1}</td>
            <td>${e.activity}</td>
            <td>${e.trip_number}</td>
            <td>${fmtDate}</td>
            <td>${e.timezone}</td>
            <td>${e.step}</td>
            <td>${fmtMin(e.duration)}</td>
          </tr>
        `);
  
        // scroll columns
        sBody.insertAdjacentHTML('beforeend', `
          <tr>
            <td>${e.loc_atfrom||''}</td>
            <td>${e.loc_to||''}</td>
            <td class="numeric">${e.engine_merpm||''}</td>
            <td class="numeric">${e.engine_meload||''}</td>
            <td class="numeric">${e.engine_proprpm||''}</td>
            <td class="numeric">${e.engine_speed||''}</td>
            <td class="numeric">${e.engine_propcpp||''}</td>
            <td class="numeric">${e.me_fm_in||''}</td>
            <td class="numeric">${e.me_fm_out||''}</td>
            <td class="numeric">${e.me_fo_cons||''}</td>
            <td class="numeric">${e.me_do_cons||''}</td>
            <td>${e.me_cons_check||''}</td>
            <td class="numeric">${fmtMin(e.me_rh)}</td>
            <td class="numeric">${e.boiler_fm_in||''}</td>
            <td class="numeric">${e.boiler_fm_out||''}</td>
            <td class="numeric">${e.boiler_fo_cons||''}</td>
            <td class="numeric">${e.boiler_do_cons||''}</td>
            <td>${e.boiler_cons_check||''}</td>
            <td class="numeric">${fmtMin(e.boiler_rh)}</td>
            <td class="numeric">${e.auxfm||''}</td>
            <td class="numeric">${e.aux1_do_cons||''}</td>
            <td class="numeric">${e.aux2_do_cons||''}</td>
            <td class="numeric">${e.aux3_do_cons||''}</td>
            <td>${e.aux_cons_check||''}</td>
            <td class="numeric">${fmtMin(e.aux1_rh)}</td>
            <td class="numeric">${fmtMin(e.aux2_rh)}</td>
            <td class="numeric">${fmtMin(e.aux3_rh)}</td>
            <td class="numeric">${e.cc1_do_cons||''}</td>
            <td class="numeric">${e.cc2_do_cons||''}</td>
            <td class="numeric">${e.cc3_do_cons||''}</td>
            <td class="numeric">${e.cc4_do_cons||''}</td>
            <td class="numeric">${e.cc5_do_cons||''}</td>
            <td class="numeric">${e.cc6_do_cons||''}</td>
            <td class="numeric">${fmtMin(e.cc1_rh)}</td>
            <td class="numeric">${fmtMin(e.cc2_rh)}</td>
            <td class="numeric">${fmtMin(e.cc3_rh)}</td>
            <td class="numeric">${fmtMin(e.cc4_rh)}</td>
            <td class="numeric">${fmtMin(e.cc5_rh)}</td>
            <td class="numeric">${fmtMin(e.cc6_rh)}</td>
            <td class="numeric">${e.eg_do_cons||''}</td>
            <td class="numeric">${fmtMin(e.eg_rh)}</td>
            <td class="numeric">${e.bt_do_cons||''}</td>
            <td class="numeric">${fmtMin(e.bt_rh)}</td>
            <td class="numeric">${e.other_fo_cons||''}</td>
            <td class="numeric">${e.other_do_cons||''}</td>
            <td class="numeric">${formatNumber(e.total_fo_cons_in_kl) ||''}</td>
            <td class="numeric">${formatNumber(e.total_do_cons_in_kl) ||''}</td>
            <td class="numeric">${formatNumber(e.fo_rob_in_kl)}</td>
            <td class="numeric">${formatNumber(e.fo_fots)}</td>
            <td class="numeric">${formatNumber(e.fo_correction)}</td>
            <td class="numeric">${formatNumber(e.fo_supply)}</td>
            <td class="numeric">${e.fo_supply_type||''}</td>
            <td class="numeric">${formatNumber(e.do_rob_in_kl)}</td>
            <td class="numeric">${formatNumber(e.do_fots)}</td>
            <td class="numeric">${formatNumber(e.do_correction)}</td>
            <td class="numeric">${formatNumber(e.do_supply)}</td>
            <td class="numeric">${e.do_supply_type||''}</td>
            <td class="numeric">${e.fo_sg||''}</td>
            <td class="numeric">${e.do_sg||''}</td>
            <td class="numeric">${formatNumber(e.total_fo_cons_in_mt)}</td>
            <td class="numeric">${formatNumber(e.total_do_cons_in_mt)}</td>
            <td class="numeric">${formatNumber(e.fo_rob_in_mt)}</td>
            <td class="numeric">${formatNumber(e.do_rob_in_mt)}</td>
          </tr>
        `);
      });
      syncScroll('engine');
    }
  
    // DECK table populator (example—adjust fields to match your deck data)
    function populateDeck(rows) {
      const fBody = document.getElementById('fixed-deck-fixed-body');
      const sBody = document.getElementById('scroll-deck-scroll-body');
      fBody.innerHTML = ''; sBody.innerHTML = '';
  
      rows.forEach((e,i) => {
        const d = new Date(e.date_time);
        const fmtDate = d.toLocaleString('en-GB', {
          timeZone: 'UTC', day:'2-digit', month:'short',
          year:'numeric', hour:'2-digit', minute:'2-digit',
          hour12:false
        });
  
        // fixed
        fBody.insertAdjacentHTML('beforeend', `
          <tr>
            <td>${i+1}</td>
            <td>${e.activity}</td>
            <td>${e.trip_number||''}</td>
            <td>${fmtDate}</td>
            <td>${e.timezone}</td>
            <td>${e.step}</td>
            <td>${fmtMin(e.duration)}</td>
          </tr>
        `);
  
        // scroll (customize columns—you’ll have FW, DWT, Draft, etc)
        sBody.insertAdjacentHTML('beforeend', `
          <tr>
            <td>${e.loc_atfrom||''}</td>
            <td>${e.loc_to||''}</td>
            <td class="numeric">${e.fw_rob || ''}</td>
            <td class="numeric">${e.fw_supply || ''}</td>
            <td class="numeric">${e.fw_generated || ''}</td>
            <td class="numeric">${e.fw_consumption_pernoon || ''}</td>
            <td>${e.fw_remarks || ''}</td>
            <td class="numeric">${e.dwt_cargo_1_rob || ''}</td>
            <td>${e.dwt_cargo_1_type || ''}</td>
            <td class="numeric">${e.dwt_cargo_2_rob || ''}</td>
            <td>${e.dwt_cargo_2_type || ''}</td>
            <td class="numeric">${e.dwt_ballast_water || ''}</td>
            <td class="numeric">${e.dwt_constant || ''}</td>
            <td class="numeric">${e.dwt_other || ''}</td>
            <td class="numeric">${formatNumber(e.dwt_total)}</td>
            <td class="numeric">${e.draft_f || ''}</td>
            <td class="numeric">${e.draft_m || ''}</td>
            <td class="numeric">${e.draft_a || ''}</td>
            <td class="numeric">${formatNumber(e.hogsag)  }</td>
            <td class="numeric">${e.dist_lastport || ''}</td>
            <td class="numeric">${e.dist_24hours || ''}</td>
            <td class="numeric">${e.dist_togo || ''}</td>
            <td class="numeric">${e.speed_log || ''}</td>
            <td class="numeric">${e.speed_gps || ''}</td>
            <td class="numeric">${e.speed_average || ''}</td>
            <td class="numeric">${e.speed_slip || ''}</td>
            <td class="numeric">${e.coord_latdegree || ''}</td>
            <td class="numeric">${e.coord_latdecimal || ''}</td>
            <td>${e.coord_latq || ''}</td>
            <td class="numeric">${e.coord_longdegree || ''}</td>
            <td class="numeric">${e.coord_longdecimal || ''}</td>
            <td>${e.coord_longq || ''}</td>
            <td>${e.coord_notes || ''}</td>
            <td class="numeric">${e.pos_hs || ''}</td>
            <td class="numeric">${e.pos_steering_rh || ''}</td>
            <td class="numeric">${e.pos_barometer || ''}</td>
            <td class="numeric">${e.pos_temperature || ''}</td>
            <td>${e.wind_dir || ''}</td>
            <td class="numeric">${e.wind_speed || ''}</td>
            <td class="numeric">${e.wind_bf_scale || ''}</td>
            <td>${e.wind_condition || ''}</td>
            <td class="numeric">${e.wave_height || ''}</td>
            <td class="numeric">${e.wave_douglas_scale || ''}</td>
            <td>${e.wave_state || ''}</td>
            <td class="numeric">${e.wave_swell || ''}</td>
            <td>${e.remarks || ''}</td>
          </tr>
        `);
      });
      syncScroll('deck');
    }
  
    // L.O. placeholder
    function populateLO(_rows) {
      document.querySelector('#lo-form .placeholder').innerHTML = `
        <p>L.O. data isn't implemented yet.</p>
        <p>API endpoint will return your Lube Oil records here.</p>
      `;
    }
  
    // keep fixed & scroll in sync
    function syncScroll(prefix) {
      const f = document.querySelector(`.fixed-table-container`);
      const s = document.querySelector(`.scroll-table-container`);
      f.onscroll = () => s.scrollTop = f.scrollTop;
      s.onscroll = () => f.scrollTop = s.scrollTop;
    }
  });
  
  
 function formatNumber(val, decimals = 2) {
   if (val === null || val === undefined || val === '') return '';
   const n = parseFloat(val);
   return isNaN(n) ? '' : n.toFixed(decimals);
 }