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
  'TS-WGL-MR-4412': { name: 'Sri Lakshmi Rice Industries', manager: 'Loukika', quota: '3,500 MT' },
  'TS-WGL-MR-1108': { name: 'Kakatiya Modern Agro Mills', manager: 'Krishna', quota: '4,200 MT' },
  'TS-WGL-MR-3391': { name: 'Telangana Parboiled Rice Corp', manager: 'Vamsi', quota: '5,000 MT' },
  'TS-WGL-MR-2204': { name: 'Bhadrakali Agri Modern Foods', manager: 'Lasya', quota: '2,800 MT' }
};

document.addEventListener('DOMContentLoaded', async () => {
  const storedUser = sessionStorage.getItem('dhanya_user');
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      currentRole = u.role;
      currentUserDisplayName = u.displayName;
      if (u.millCode) {
        currentMillCode = u.millCode;
        currentMillName = u.millName;
        currentManagerName = u.displayName;
      }
    } catch (e) {}
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
    const res = await fetch('/api/v2/cmr-procurement?millCode=' + currentMillCode + '&sync=live');
    const data = await res.json();
    if (data.success) {
      activeRecords = data.data;
      renderTable(activeRecords);
      await fetchSettlementSummary();
      
      const now = new Date();
      if (lastSync) lastSync.innerText = 'Synced: ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
    const res = await fetch('/api/v2/cmr-procurement?millCode=' + currentMillCode);
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

// 4. Render Table Rows
function renderTable(records) {
  const tbody = document.getElementById('reconcileTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const badge = document.getElementById('recordsCountBadge');
  if (badge) badge.innerText = records.length + ' Items';

  records.forEach(r => {
    const isMatch = r.reconciliationStatus === 'MATCH';
    const tr = document.createElement('tr');
    tr.className = isMatch ? 'hover:bg-gray-50' : 'bg-amber-50/50 hover:bg-amber-50';

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-semibold text-gray-900">${r.truckNo}</td>
      <td class="py-2.5 px-3 text-gray-600">${r.passNo}</td>
      <td class="py-2.5 px-3">
        <div class="font-medium text-gray-900">${r.farmerName}</div>
        <div class="text-[10px] text-gray-500 font-mono">${r.farmerAadhaar}</div>
      </td>
      <td class="py-2.5 px-3 text-right">${r.govtNetKg.toLocaleString()} kg</td>
      <td class="py-2.5 px-3 text-right font-semibold ${isMatch ? 'text-emerald-700' : 'text-amber-800'}">${r.millNetKg.toLocaleString()} kg</td>
      <td class="py-2.5 px-3 text-center">
        <span class="px-1.5 py-0.5 rounded text-[11px] ${r.moisture > 17.0 ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-gray-100 text-gray-700'}">
          ${r.moisture}%
        </span>
      </td>
      <td class="py-2.5 px-3 text-right font-semibold ${r.netVarianceKg < 0 ? 'text-amber-700' : 'text-gray-500'}">
        ${r.netVarianceKg === 0 ? '0 kg' : r.netVarianceKg + ' kg'}
      </td>
      <td class="py-2.5 px-3 text-center">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${isMatch ? 'MATCH' : 'MISMATCH'}
        </span>
      </td>
      <td class="py-2.5 px-3 text-[11px] text-gray-600 max-w-xs truncate" title="${r.discrepancyReason}">
        ${r.discrepancyReason}
      </td>
      <td class="py-2.5 px-3 text-center">
        ${!isMatch ? `
          <button onclick="openDisputeModal(${r.id})" class="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded">
            Resolve
          </button>
        ` : `
          <span class="text-xs text-emerald-700 font-medium">Verified</span>
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

// 6. Render Statutory Decision Hub
function renderStatutoryHub() {
  const container = document.getElementById('statutoryDecisionContainer');
  if (!container) return;
  const isApproved = settlementData.approvalStatus === 'APPROVED';

  if (isApproved) {
    container.innerHTML = `
      <div class="bg-emerald-50 border border-emerald-300 p-3.5 rounded flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span class="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">✓</span>
          <div>
            <div class="font-bold text-emerald-950 text-xs">Statutory Subsidy Approved & Cleared for Payment</div>
            <div class="text-[11px] text-emerald-800">Token: PFMS-TS-2025-CLEAR-${currentMillCode.slice(-4)} • SMS Alerts Sent</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="openJrcModal()" class="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded">
            📄 View JRC Certificate
          </button>
          <button onclick="openSmsModal()" class="px-3 py-1 bg-white hover:bg-gray-50 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded">
            📱 View SMS Logs
          </button>
          <button onclick="requestRecalibration()" class="text-xs text-amber-800 underline ml-2">Reopen</button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">
        <button onclick="approveSubsidyBatch()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-sm">
          ✓ Approve & Release Subsidy
        </button>
        <button onclick="alert('Batch halted.')" class="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded">
          ✕ Reject Batch
        </button>
        <button onclick="alert('Notice sent to Miller for recalibration.')" class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded">
          ⚠️ Request Correction
        </button>
      </div>
    `;
  }
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
  const roleEl = document.getElementById('userRoleName');
  if (roleEl) roleEl.innerText = isOfficer ? 'Officer (DCSO)' : 'Rice Miller';
  
  const banEl = document.getElementById('bannerTitle');
  if (banEl) {
    banEl.innerText = isOfficer ? 
      'Warangal District Civil Supplies Oversight' : 
      currentMillName + ' (' + currentMillCode + ')';
  }

  const quotaEl = document.getElementById('millQuotaLabel');
  if (quotaEl) {
    quotaEl.innerText = isOfficer ? 'All 4 Mills Monitored' : 'Allocated Quota: ' + (MILL_METADATA[currentMillCode]?.quota || '3,500 MT');
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
    card.className = 'bg-gray-50 p-2 rounded border border-gray-200 flex items-center justify-between text-xs';
    card.innerHTML = `
      <div>
        <div class="font-bold text-gray-900">${f.name} <span class="font-normal text-gray-500 font-mono">(${f.phone})</span></div>
        <div class="text-[10px] text-emerald-800">Direct DBT to ${f.bank}</div>
      </div>
      <div class="text-right font-mono">
        <div class="font-bold text-emerald-800">${f.amt}</div>
        <div class="text-[10px] text-gray-500">Sent</div>
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

  document.getElementById('dispTruckNo').innerText = record.truckNo;
  document.getElementById('dispGovtNet').innerText = record.govtNetKg.toLocaleString() + ' kg';
  document.getElementById('dispVariance').innerText = record.netVarianceKg + ' kg';
  document.getElementById('dispAgreedQty').value = record.millNetKg;

  document.getElementById('disputeModal').classList.remove('hidden');
}
function closeDisputeModal() { document.getElementById('disputeModal').classList.add('hidden'); }

async function submitDisputeResolution() {
  const agreed = parseFloat(document.getElementById('dispAgreedQty').value);

  try {
    const res = await fetch('/api/v2/disputes/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: activeDisputeRecordId,
        agreedQuantity: agreed,
        notes: 'Joint physical scale inspection calibrated'
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
