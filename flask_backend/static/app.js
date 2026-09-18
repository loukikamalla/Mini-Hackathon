// DHANYA CMR Reconcile Client App (Flask + Supabase)

let currentRole = 'GOVERNMENT_OFFICER';
let currentMillCode = 'TS-WGL-MR-4412';
let currentMillName = 'Sri Lakshmi Rice Industries';
let currentManagerName = 'Loukika';
let currentUserDisplayName = 'Officer R. Kumar (DCSO)';
let activeRecords = [];
let settlementData = {};
let activeDisputeRecordId = null;

const MILL_METADATA = {
  'TS-WGL-MR-4412': { name: 'Sri Lakshmi Rice Industries', manager: 'Loukika', quota: 3500 },
  'TS-WGL-MR-1108': { name: 'Kakatiya Modern Agro Mills', manager: 'Krishna', quota: 4200 },
  'TS-WGL-MR-3391': { name: 'Telangana Parboiled Rice Corp', manager: 'Vamsi', quota: 5000 },
  'TS-WGL-MR-2204': { name: 'Bhadrakali Agri Modern Foods', manager: 'Lasya', quota: 2800 }
};

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchProcurementRecords();
  await fetchSettlementSummary();
  updateUIForRole();
});

// 1. Fetch Records from Flask REST API
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
    console.error('Fetch error:', err);
  }
}

// 2. Fetch Settlement & 67% CMR Math
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
    console.error('Settlement error:', err);
  }
}

// 3. Render Reconciled Table
function renderTable(records) {
  const tbody = document.getElementById('reconcileTableBody');
  tbody.innerHTML = '';

  document.getElementById('recordsCountBadge').innerText = records.length + ' Records';

  records.forEach(r => {
    const isMatch = r.reconciliationStatus === 'MATCH';
    const tr = document.createElement('tr');
    tr.className = isMatch ? 'hover:bg-slate-900/50 transition' : 'bg-amber-950/20 hover:bg-amber-950/30 transition';

    tr.innerHTML = `
      <td class="py-3.5 px-4 font-bold text-white">
        <div>${r.truckNo}</div>
        <div class="text-[10px] text-slate-400 font-normal">${r.passNo}</div>
      </td>
      <td class="py-3.5 px-4">
        <div class="text-slate-200 font-medium">${r.farmerName}</div>
        <div class="text-[10px] text-slate-400 font-mono">${r.farmerAadhaar}</div>
      </td>
      <td class="py-3.5 px-4 text-right text-slate-300 font-semibold">${r.govtNetKg.toLocaleString()} kg</td>
      <td class="py-3.5 px-4 text-right font-bold ${isMatch ? 'text-emerald-400' : 'text-amber-300'}">${r.millNetKg.toLocaleString()} kg</td>
      <td class="py-3.5 px-4 text-center">
        <span class="px-2 py-0.5 rounded text-[11px] font-bold ${r.moisture > 17.0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'}">
          ${r.moisture}%
        </span>
      </td>
      <td class="py-3.5 px-4 text-right font-bold ${r.netVarianceKg < 0 ? 'text-amber-400' : 'text-slate-400'}">
        ${r.netVarianceKg === 0 ? '0 kg' : r.netVarianceKg + ' kg'}
      </td>
      <td class="py-3.5 px-4 text-center">
        <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${isMatch ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}">
          ${isMatch ? '✓ MATCH' : '⚠️ MISMATCH'}
        </span>
      </td>
      <td class="py-3.5 px-4 text-[11px] text-slate-300 font-sans max-w-xs truncate" title="${r.discrepancyReason}">
        ${r.discrepancyReason}
      </td>
      <td class="py-3.5 px-4 text-center">
        ${!isMatch ? `
          <button onclick="openDisputeModal(${r.id})" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[11px] font-bold rounded-lg shadow transition">
            Resolve
          </button>
        ` : `
          <span class="text-xs text-emerald-500 font-bold">Verified</span>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. Update KPI Metrics
function updateKPIs() {
  const totalKg = activeRecords.reduce((acc, r) => acc + r.millNetKg, 0);
  const totalQtl = (totalKg / 100).toFixed(2);
  const cmrTarget = (totalQtl * 0.67).toFixed(2);
  const pendingDisputes = activeRecords.filter(r => r.reconciliationStatus !== 'MATCH').length;
  
  const millingSubsidy = totalQtl * 10.0;
  const handlingSubsidy = totalQtl * 4.50;
  const gunnyCredit = totalQtl * 4.40;
  const totalSubsidy = (millingSubsidy + handlingSubsidy + gunnyCredit).toFixed(2);

  document.getElementById('kpiTotalPaddy').innerText = totalKg.toLocaleString() + ' kg';
  document.getElementById('kpiTotalPaddyQtl').innerText = totalQtl + ' Quintals (' + activeRecords.length + ' Batches)';
  document.getElementById('kpiCmrTarget').innerText = cmrTarget + ' Qtl';
  document.getElementById('kpiDisputes').innerText = pendingDisputes + ' Pending';
  document.getElementById('kpiTotalSubsidy').innerText = '₹ ' + Number(totalSubsidy).toLocaleString();
}

// 5. Render Statutory Decision Hub
function renderStatutoryHub() {
  const container = document.getElementById('statutoryDecisionContainer');
  const isApproved = settlementData.approvalStatus === 'APPROVED';

  if (isApproved) {
    container.innerHTML = `
      <div class="bg-emerald-950/40 border-2 border-emerald-600/70 p-6 rounded-3xl space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow">
              ✓
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-base sm:text-lg font-black text-white">Statutory Subsidy Already Approved & Released</h4>
                <span class="px-2.5 py-0.5 text-xs font-black uppercase bg-emerald-900 text-emerald-300 rounded-full border border-emerald-700">Cleared</span>
              </div>
              <p class="text-xs text-emerald-300 mt-0.5">Digital JRC endorsement authorized by Officer R. Kumar (DCSO) • Direct Farmer DBT SMS Delivered</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button onclick="openJrcModal()" class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl shadow transition flex items-center gap-1.5">
              <span>📄 View JRC Certificate</span>
            </button>
            <button onclick="openSmsModal()" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-700 font-black text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-1.5">
              <span>📱 View SMS Logs (6)</span>
            </button>
          </div>
        </div>

        <div class="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs">
          <span class="font-mono text-emerald-400 font-semibold">Payment Token: PFMS-TS-2025-CLEAR-${currentMillCode.slice(-4)}</span>
          <button onclick="requestRecalibration()" class="font-bold text-amber-400 hover:text-amber-300 underline">
            Need to change? Reopen & Request Recalibration →
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <button onclick="approveSubsidyBatch()" class="py-4 px-6 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg transition flex flex-col items-center justify-center gap-1">
          <span>✓ Approve & Release Subsidy</span>
          <span class="text-[11px] font-normal opacity-80">Issue JRC Certificate & SMS Alert</span>
        </button>
        <button onclick="alert('Batch marked for halt.')" class="py-4 px-6 bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-black text-sm rounded-2xl shadow transition flex flex-col items-center justify-center gap-1 border border-rose-800">
          <span>✕ Reject Batch</span>
          <span class="text-[11px] font-normal opacity-80">Halt subsidy disbursement</span>
        </button>
        <button onclick="alert('Notice sent to Miller for recalibration.')" class="py-4 px-6 bg-amber-900/80 hover:bg-amber-800 text-amber-200 font-black text-sm rounded-2xl shadow transition flex flex-col items-center justify-center gap-1 border border-amber-800">
          <span>⚠️ Request Correction</span>
          <span class="text-[11px] font-normal opacity-80">Ask Miller for scale calibration</span>
        </button>
      </div>
    `;
  }
}

// 6. Approve Subsidy
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
    console.error('Approve error:', err);
  }
}

function requestRecalibration() {
  settlementData.approvalStatus = 'PENDING';
  renderStatutoryHub();
}

// 7. Role Switching
function updateUIForRole() {
  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';
  document.getElementById('userDisplayName').innerText = currentUserDisplayName;
  document.getElementById('userRoleName').innerText = isOfficer ? 'Government Officer' : 'Rice Mill Manager';
  document.getElementById('userInitial').innerText = isOfficer ? '🏛️' : '🌾';
  
  const ingSec = document.getElementById('millerIngestionSection');
  if (ingSec) {
    ingSec.style.display = isOfficer ? 'none' : 'block';
  }

  document.getElementById('bannerTitle').innerText = isOfficer ? 
    'Warangal District Civil Supplies Oversight' : 
    currentMillName + ' (' + currentMillCode + ')';
}

function loginAs(username, password) {
  fetch('/api/v2/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      currentRole = data.role;
      currentUserDisplayName = data.displayName;
      if (data.millCode) {
        currentMillCode = data.millCode;
        currentMillName = data.millName;
        currentManagerName = data.displayName;
      }
      closeLoginModal();
      updateUIForRole();
      fetchProcurementRecords();
      fetchSettlementSummary();
    }
  });
}

function switchMillView(millCode) {
  document.querySelectorAll('.mill-pill').forEach(btn => {
    if (btn.dataset.mill === millCode) {
      btn.className = 'mill-pill px-3 py-1 rounded-lg text-xs font-bold border transition bg-emerald-600 text-white border-emerald-500';
    } else {
      btn.className = 'mill-pill px-3 py-1 rounded-lg text-xs font-bold border transition bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700';
    }
  });

  if (millCode !== 'ALL' && MILL_METADATA[millCode]) {
    currentMillCode = millCode;
    currentMillName = MILL_METADATA[millCode].name;
    currentManagerName = MILL_METADATA[millCode].manager;
  }
  fetchProcurementRecords();
  fetchSettlementSummary();
}

// 8. Filter Records
function filterRecords(type) {
  if (type === 'ALL') renderTable(activeRecords);
  else if (type === 'MATCH') renderTable(activeRecords.filter(r => r.reconciliationStatus === 'MATCH'));
  else if (type === 'MISMATCH') renderTable(activeRecords.filter(r => r.reconciliationStatus !== 'MATCH'));
}

// 9. Modals Control
function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }

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
  document.getElementById('jrcTotalPaddy').innerText = totalQtl + ' Quintals';
  document.getElementById('jrcCmrTarget').innerText = cmrTarget + ' Quintals';
  document.getElementById('jrcSubsidyAmt').innerText = '₹ ' + Number(totalSubsidy).toLocaleString();

  document.getElementById('jrcCertificateModal').classList.remove('hidden');
}
function closeJrcModal() { document.getElementById('jrcCertificateModal').classList.add('hidden'); }

function openSmsModal() {
  const container = document.getElementById('smsLogsContainer');
  container.innerHTML = '';
  
  const farmers = [
    { name: 'K. Mallesh', phone: '9848011221', amt: '₹ 3,68,000', bank: 'SBI Narsampet', time: '10:15 AM' },
    { name: 'B. Ramesh', phone: '9848011222', amt: '₹ 3,18,550', bank: 'APGVB Geesugonda', time: '10:16 AM' },
    { name: 'G. Venkatiah', phone: '9848011223', amt: '₹ 4,14,000', bank: 'UBI Wardhannapet', time: '10:17 AM' },
    { name: 'M. Saritha', phone: '9848011224', amt: '₹ 2,69,100', bank: 'HDFC Atmakur', time: '10:18 AM' },
    { name: 'P. Sammaiah', phone: '9848011225', amt: '₹ 3,91,000', bank: 'SBI Parkal', time: '10:19 AM' },
    { name: 'V. Narsaiah', phone: '9848011226', amt: '₹ 3,45,000', bank: 'APGVB Rayaparthy', time: '10:20 AM' }
  ];

  farmers.forEach(f => {
    const card = document.createElement('div');
    card.className = 'bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs';
    card.innerHTML = `
      <div>
        <div class="font-bold text-white flex items-center gap-1.5">
          <span>${f.name}</span>
          <span class="text-[10px] text-slate-400 font-mono">(${f.phone})</span>
        </div>
        <div class="text-[10px] text-emerald-400 mt-0.5">Direct DBT Released to ${f.bank}</div>
      </div>
      <div class="text-right">
        <div class="font-black text-emerald-400 font-mono">${f.amt}</div>
        <div class="text-[10px] text-slate-500">${f.time} • Delivered</div>
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
  document.getElementById('dispNotes').value = 'Joint physical weighbridge inspection agreed';

  document.getElementById('disputeModal').classList.remove('hidden');
}
function closeDisputeModal() { document.getElementById('disputeModal').classList.add('hidden'); }

async function submitDisputeResolution() {
  const agreed = parseFloat(document.getElementById('dispAgreedQty').value);
  const notes = document.getElementById('dispNotes').value;

  try {
    const res = await fetch('/api/v2/disputes/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: activeDisputeRecordId,
        agreedQuantity: agreed,
        notes: notes
      })
    });
    const data = await res.json();
    if (data.success) {
      closeDisputeModal();
      await fetchProcurementRecords();
      await fetchSettlementSummary();
      alert('Dispute recalibrated successfully!');
    }
  } catch (err) {
    console.error('Dispute error:', err);
  }
}

// 10. File Ingestion Handlers
function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  alert('Excel file ' + file.name + ' uploaded! Ingesting into Pandas reconciliation engine...');
}

function handleOcrPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('photo', file);

  fetch('/api/v2/ingest/ocr-slip', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        alert('OCR Success! Detected: ' + data.detectedFields.truckNo + ' (Net: ' + data.detectedFields.netKg + ' kg, Moisture: ' + data.detectedFields.moisturePercent + '%)');
      }
    });
}
