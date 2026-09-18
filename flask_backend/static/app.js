// DHANYA Simple Client Controller

let currentRole = 'GOVERNMENT_OFFICER';
let currentMillCode = 'TS-WGL-MR-4412';
let currentMillName = 'Sri Lakshmi Rice Industries';
let currentManagerName = 'Loukika';
let currentUserDisplayName = 'Officer R. Kumar (DCSO)';
let activeRecords = [];
let settlementData = {};
let activeDisputeRecordId = null;

const MILL_METADATA = {
  'TS-WGL-MR-4412': { name: 'Sri Lakshmi Rice Industries', manager: 'Loukika', quota: '3,500.00 Qtl' },
  'TS-WGL-MR-1108': { name: 'Kakatiya Modern Agro Mills', manager: 'Krishna', quota: '4,200.00 Qtl' },
  'TS-WGL-MR-3391': { name: 'Telangana Parboiled Rice Corp', manager: 'Vamsi', quota: '5,000.00 Qtl' },
  'TS-WGL-MR-2204': { name: 'Bhadrakali Agri Modern Foods', manager: 'Lasya', quota: '2,800.00 Qtl' }
};

document.addEventListener('DOMContentLoaded', async () => {
  const storedUser = sessionStorage.getItem('dhanya_user');
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      currentRole = u.role || currentRole;
      currentUserDisplayName = u.displayName || currentUserDisplayName;
      if (u.millCode) {
        currentMillCode = u.millCode;
        currentMillName = u.millName || (MILL_METADATA[u.millCode] ? MILL_METADATA[u.millCode].name : currentMillName);
        currentManagerName = u.displayName || currentManagerName;
      }
    } catch (e) {
      console.error(e);
    }
  }

  updateUIForRole();
  await fetchProcurementRecords();
  await fetchSettlementSummary();
});

// 1. AUTO-FETCH DIRECT FROM LIVE OPMS API
async function autoFetchFromAPI() {
  const btn = document.getElementById('autoFetchBtn');
  const spinner = document.getElementById('syncSpinner');
  const lastSync = document.getElementById('lastSyncTime');
  
  if (spinner) spinner.classList.remove('hidden');
  if (btn) btn.disabled = true;

  try {
    const fetchUrl = (currentRole === 'GOVERNMENT_OFFICER' && currentMillCode === 'ALL') ? 
      '/api/v2/cmr-procurement?sync=live' : 
      '/api/v2/cmr-procurement?millCode=' + currentMillCode + '&sync=live';
      
    const res = await fetch(fetchUrl);
    const data = await res.json();
    if (data.success) {
      activeRecords = data.data;
      renderTable(activeRecords);
      await fetchSettlementSummary();
      
      const now = new Date();
      if (lastSync) lastSync.innerText = 'Synced: ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (OPMS API Live)';
    }
  } catch (err) {
    console.error('Auto-fetch error:', err);
  } finally {
    if (spinner) spinner.classList.add('hidden');
    if (btn) btn.disabled = false;
  }
}

// 2. Fetch Records
async function fetchProcurementRecords() {
  try {
    const fetchUrl = (currentRole === 'GOVERNMENT_OFFICER' && currentMillCode === 'ALL') ? 
      '/api/v2/cmr-procurement' : 
      '/api/v2/cmr-procurement?millCode=' + currentMillCode;

    const res = await fetch(fetchUrl);
    const data = await res.json();
    if (data.success) {
      activeRecords = data.data;
      renderTable(activeRecords);
      updateKPIs();
    }
  } catch (err) {
    console.error(err);
  }
}

// 3. Fetch Settlement Summary
async function fetchSettlementSummary() {
  try {
    const res = await fetch('/api/v2/settlement?millCode=' + currentMillCode);
    const data = await res.json();
    if (data.success) {
      settlementData = data.settlement;
      updateKPIs();
      renderStatutoryHub();
    }
  } catch (err) {
    console.error(err);
  }
}

// 4. Render Table Rows with Clear Typography
function renderTable(records) {
  const tbody = document.getElementById('reconcileTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const badge = document.getElementById('recordsCountBadge');
  if (badge) badge.innerText = records.length + ' Items';

  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';

  records.forEach(r => {
    const isMatch = r.reconciliationStatus === 'MATCH';
    const tr = document.createElement('tr');
    tr.className = isMatch ? 'hover:bg-slate-50 transition' : 'bg-amber-50/60 hover:bg-amber-50 transition';

    tr.innerHTML = `
      <td class="py-3 px-3.5 font-bold text-slate-900">${r.truckNo}</td>
      <td class="py-3 px-3 text-slate-600 font-mono text-xs">${r.passNo}</td>
      <td class="py-3 px-3.5">
        <div class="font-bold text-slate-900 font-sans">${r.farmerName}</div>
        <div class="text-xs text-slate-500 font-mono">${r.farmerAadhaar}</div>
      </td>
      <td class="py-3 px-3 text-right text-slate-700">${r.govtNetKg.toLocaleString()} kg</td>
      <td class="py-3 px-3 text-right font-bold ${isMatch ? 'text-emerald-700' : 'text-amber-800'}">${r.millNetKg.toLocaleString()} kg</td>
      <td class="py-3 px-3 text-center">
        <span class="px-2 py-0.5 rounded text-xs ${r.moisture > 17.0 ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300' : 'bg-slate-100 text-slate-700'}">
          ${r.moisture}%
        </span>
      </td>
      <td class="py-3 px-3 text-right font-bold ${r.netVarianceKg < 0 ? 'text-amber-700' : 'text-slate-500'}">
        ${r.netVarianceKg === 0 ? '0 kg' : r.netVarianceKg + ' kg'}
      </td>
      <td class="py-3 px-3 text-center">
        <span class="px-2.5 py-1 rounded-md text-xs font-bold ${isMatch ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}">
          ${isMatch ? 'VERIFIED' : 'FLAGGED'}
        </span>
      </td>
      <td class="py-3 px-3.5 text-xs text-slate-600 max-w-xs font-sans" title="${r.discrepancyReason}">
        ${r.discrepancyReason}
      </td>
      <td class="py-3 px-3.5 text-center">
        ${!isMatch ? `
          <button onclick="openDisputeModal(${r.id})" class="px-3 py-1.5 ${isOfficer ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-800 hover:bg-slate-900'} text-white text-xs font-bold rounded-md shadow transition">
            ${isOfficer ? '⚖️ Resolve' : '⚠️ Recalibrate'}
          </button>
        ` : `
          <span class="text-xs text-emerald-700 font-bold font-sans">✓ Cleared</span>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 5. Update KPI Cards
function updateKPIs() {
  const totalKg = activeRecords.reduce((acc, r) => acc + r.millNetKg, 0);
  const totalQtl = (totalKg / 100).toFixed(2);
  const cmrTarget = (totalQtl * 0.67).toFixed(2);
  const pendingDisputes = activeRecords.filter(r => r.reconciliationStatus !== 'MATCH').length;
  
  const millingSubsidy = totalQtl * 10.0;
  const handlingSubsidy = totalQtl * 4.50;
  const gunnyCredit = totalQtl * 4.40;
  const totalSubsidy = (millingSubsidy + handlingSubsidy + gunnyCredit).toFixed(2);

  const elPaddy = document.getElementById('kpiTotalPaddy');
  if (elPaddy) elPaddy.innerText = totalKg.toLocaleString() + ' kg';
  const elPaddyQtl = document.getElementById('kpiTotalPaddyQtl');
  if (elPaddyQtl) elPaddyQtl.innerText = totalQtl + ' Qtl (' + activeRecords.length + ' Batches)';
  const elCmr = document.getElementById('kpiCmrTarget');
  if (elCmr) elCmr.innerText = cmrTarget + ' Qtl';
  const elDisp = document.getElementById('kpiDisputes');
  if (elDisp) elDisp.innerText = pendingDisputes + ' Batches';
  const elSub = document.getElementById('kpiTotalSubsidy');
  if (elSub) elSub.innerText = '₹ ' + Number(totalSubsidy).toLocaleString();
}

// 6. Render Statutory Decision Hub (Role-Adaptive)
function renderStatutoryHub() {
  const container = document.getElementById('statutoryDecisionContainer');
  if (!container) return;
  const isApproved = settlementData.approvalStatus === 'APPROVED';
  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';

  if (isApproved) {
    container.innerHTML = `
      <div class="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">✓</span>
          <div>
            <div class="font-bold text-emerald-950 text-sm sm:text-base">Statutory Subsidy & 67% CMR Approved by DCSO</div>
            <div class="text-xs sm:text-sm text-emerald-800 mt-0.5">Clearance Token: <code class="font-bold bg-white/70 px-1 py-0.5 rounded">PFMS-TS-2025-CLEAR-${currentMillCode.slice(-4)}</code> • Farmer DBT SMS Gateway Dispatched</div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button onclick="openJrcModal()" class="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold rounded-lg shadow transition">
            📄 View / Print JRC Certificate
          </button>
          <button onclick="openSmsModal()" class="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-sm font-semibold rounded-lg transition">
            📱 View Farmer SMS Logs
          </button>
          ${isOfficer ? `
            <button onclick="requestRecalibration()" class="text-xs text-amber-800 hover:underline font-semibold ml-1">Reopen Audit</button>
          ` : ''}
        </div>
      </div>
    `;
  } else {
    if (isOfficer) {
      container.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div class="text-sm font-bold text-slate-900">District Officer Authorization Required</div>
            <div class="text-xs text-slate-500 mt-0.5">Review reconciled quantities before digitally signing JRC & clearing treasury subsidy funds.</div>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button onclick="approveSubsidyBatch()" class="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-lg shadow transition">
              ✓ Approve & Authorize Subsidy
            </button>
            <button onclick="alert('Consignment batch held for inspection.')" class="px-3.5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-sm rounded-lg transition">
              ✕ Halt Consignment
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div class="text-sm font-bold text-slate-900">Subsidy Claim Prepared (Miller Portal)</div>
            <div class="text-xs text-slate-500 mt-0.5">Milling subsidy claim of ₹10/Qtl + handling fees prepared for Warangal DCSO Sign-Off.</div>
          </div>
          <div class="flex items-center gap-2.5">
            <button onclick="submitMillerClaim()" class="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-lg shadow transition">
              📝 Submit Claim to DCSO
            </button>
          </div>
        </div>
      `;
    }
  }
}

function submitMillerClaim() {
  alert('Subsidy claim and 67% CMR delivery schedule submitted to Warangal District Civil Supplies Office for review!');
}

async function approveSubsidyBatch() {
  const totalKg = activeRecords.reduce((acc, r) => acc + r.millNetKg, 0);
  const totalQtl = totalKg / 100;
  const cmrTarget = totalQtl * 0.67;
  const totalSubsidy = totalQtl * (10 + 4.5 + 4.4);

  try {
    const res = await fetch('/api/v2/statutory/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        millCode: currentMillCode,
        millName: currentMillName,
        managerName: currentManagerName,
        totalPaddyQtl: totalQtl,
        cmr67TargetQtl: cmrTarget,
        totalPayableSubsidy: totalSubsidy
      })
    });
    const data = await res.json();
    if (data.success) {
      settlementData.approvalStatus = 'APPROVED';
      renderStatutoryHub();
      openJrcModal();
    }
  } catch (err) {
    console.error(err);
  }
}

function requestRecalibration() {
  settlementData.approvalStatus = 'PENDING';
  renderStatutoryHub();
}

function updateUIForRole() {
  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';
  
  const nameEl = document.getElementById('userDisplayName');
  if (nameEl) nameEl.innerText = currentUserDisplayName;
  
  const subTitleEl = document.getElementById('userSubTitle');
  if (subTitleEl) {
    subTitleEl.innerText = isOfficer ? 'Warangal District Civil Supplies Oversight' : `${currentMillName} (${currentMillCode})`;
  }

  const roleEl = document.getElementById('userRoleName');
  if (roleEl) {
    roleEl.innerText = isOfficer ? 'Officer (DCSO)' : 'Rice Miller';
    roleEl.className = isOfficer ? 
      'bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-300 font-semibold text-xs' : 
      'bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-300 font-semibold text-xs';
  }
  
  const banEl = document.getElementById('bannerTitle');
  if (banEl) {
    banEl.innerText = isOfficer ? 
      'Warangal District Civil Supplies Oversight' : 
      currentMillName + ' Console';
  }

  const quotaEl = document.getElementById('millQuotaLabel');
  if (quotaEl) {
    quotaEl.innerText = isOfficer ? 
      'All 4 Mills Monitored (District View)' : 
      'Season Quota: ' + (MILL_METADATA[currentMillCode]?.quota || '3,500.00 Qtl');
  }

  const millSelectContainer = document.getElementById('millSelectContainer');
  if (millSelectContainer) {
    if (!isOfficer) {
      // Lock dropdown for Miller to only show their own mill
      const select = document.getElementById('millFilterSelect');
      if (select) {
        select.value = currentMillCode;
        select.disabled = true;
        select.classList.add('bg-slate-100', 'cursor-not-allowed');
      }
    }
  }

  // Update card titles for Miller context
  if (!isOfficer) {
    const c1 = document.getElementById('card1Title');
    if (c1) c1.innerText = 'Mill Inward Paddy';
    const c2 = document.getElementById('card2Title');
    if (c2) c2.innerText = 'My 67% CMR Out-Turn Obligation';
    const c3 = document.getElementById('card3Title');
    if (c3) c3.innerText = 'Active Flagged Batches';
    const c4 = document.getElementById('card4Title');
    if (c4) c4.innerText = 'Accrued Subsidy Claim';
  }
}

function switchMillFromSelect(millCode) {
  if (millCode !== 'ALL' && MILL_METADATA[millCode]) {
    currentMillCode = millCode;
    currentMillName = MILL_METADATA[millCode].name;
    currentManagerName = MILL_METADATA[millCode].manager;
  }
  updateUIForRole();
  fetchProcurementRecords();
  fetchSettlementSummary();
}

function filterRecords(type) {
  if (type === 'ALL') renderTable(activeRecords);
  else if (type === 'MATCH') renderTable(activeRecords.filter(r => r.reconciliationStatus === 'MATCH'));
  else if (type === 'MISMATCH') renderTable(activeRecords.filter(r => r.reconciliationStatus !== 'MATCH'));
}

// Modals
function openJrcModal() {
  const totalKg = activeRecords.reduce((acc, r) => acc + r.millNetKg, 0);
  const totalQtl = (totalKg / 100).toFixed(2);
  const cmrTarget = (totalQtl * 0.67).toFixed(2);
  const totalSubsidy = (totalQtl * 18.90).toFixed(2);

  document.getElementById('jrcCertId').innerText = 'JRC-2025-TS-' + currentMillCode.slice(-4);
  document.getElementById('jrcMillName').innerText = currentMillName;
  document.getElementById('jrcMillCode').innerText = currentMillCode;
  document.getElementById('jrcManagerName').innerText = currentManagerName;
  document.getElementById('jrcSignManager').innerText = currentManagerName;
  document.getElementById('jrcTotalPaddy').innerText = totalQtl + ' Qtl';
  document.getElementById('jrcCmrTarget').innerText = cmrTarget + ' Qtl';
  document.getElementById('jrcSubsidyAmt').innerText = '₹ ' + Number(totalSubsidy).toLocaleString();

  document.getElementById('jrcCertificateModal').classList.remove('hidden');
}
function closeJrcModal() { document.getElementById('jrcCertificateModal').classList.add('hidden'); }

function openSmsModal() {
  const container = document.getElementById('smsLogsContainer');
  container.innerHTML = '';
  
  const farmers = [
    { name: 'K. Mallesh', phone: '9848011221', amt: '₹ 3,68,000', bank: 'SBI Narsampet' },
    { name: 'B. Ramesh', phone: '9848011222', amt: '₹ 3,18,550', bank: 'APGVB Geesugonda' },
    { name: 'G. Venkatiah', phone: '9848011223', amt: '₹ 4,14,000', bank: 'UBI Wardhannapet' },
    { name: 'M. Saritha', phone: '9848011224', amt: '₹ 2,69,100', bank: 'HDFC Atmakur' },
    { name: 'P. Sammaiah', phone: '9848011225', amt: '₹ 3,91,000', bank: 'SBI Parkal' },
    { name: 'V. Narsaiah', phone: '9848011226', amt: '₹ 3,45,000', bank: 'APGVB Rayaparthy' }
  ];

  farmers.forEach(f => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-sm';
    card.innerHTML = `
      <div>
        <div class="font-bold text-slate-900">${f.name} <span class="font-normal text-slate-500 font-mono">(${f.phone})</span></div>
        <div class="text-xs text-emerald-800">Direct Benefit Transfer to ${f.bank}</div>
      </div>
      <div class="text-right font-mono">
        <div class="font-bold text-emerald-800 text-sm">${f.amt}</div>
        <div class="text-xs text-slate-500">Delivered</div>
      </div>
    `;
    container.appendChild(card);
  });

  document.getElementById('smsLogsModal').classList.remove('hidden');
}
function closeSmsModal() { document.getElementById('smsLogsModal').classList.add('hidden'); }

function openDisputeModal(recordId) {
  activeDisputeRecordId = recordId;
  const record = activeRecords.find(r => r.id === recordId);
  if (!record) return;

  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';

  const modalTitle = document.getElementById('disputeModalTitle');
  if (modalTitle) {
    modalTitle.innerText = isOfficer ? 'Statutory Dispute Resolution & Calibration' : 'Request Weight Recalibration';
  }

  const submitBtn = document.getElementById('dispSubmitBtn');
  if (submitBtn) {
    submitBtn.innerText = isOfficer ? 'Save & Calibrate Weight' : 'Submit Recalibration Request';
  }

  document.getElementById('dispTruckNo').innerText = record.truckNo;
  document.getElementById('dispGovtNet').innerText = record.govtNetKg.toLocaleString() + ' kg';
  document.getElementById('dispVariance').innerText = record.netVarianceKg + ' kg';
  document.getElementById('dispAgreedQty').value = record.millNetKg;

  document.getElementById('disputeModal').classList.remove('hidden');
}
function closeDisputeModal() { document.getElementById('disputeModal').classList.add('hidden'); }

async function submitDisputeResolution() {
  const agreed = parseFloat(document.getElementById('dispAgreedQty').value);
  const notes = document.getElementById('dispNotes').value.trim();

  try {
    const res = await fetch('/api/v2/disputes/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: activeDisputeRecordId,
        agreedQuantity: agreed,
        notes: notes || 'Joint physical weighbridge scale inspection calibrated'
      })
    });
    const data = await res.json();
    if (data.success) {
      closeDisputeModal();
      await fetchProcurementRecords();
      await fetchSettlementSummary();
    }
  } catch (err) {
    console.error(err);
  }
}
