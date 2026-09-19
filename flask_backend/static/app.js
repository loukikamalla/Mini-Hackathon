// DHANYA - Smart India Mini-Hackathon Client Controller (Problem Statement #18)

let currentRole = 'GOVERNMENT_OFFICER';
let currentMillCode = 'TS-WGL-MR-4412';
let currentMillName = 'Sri Lakshmi Rice Industries';
let currentManagerName = 'Loukika';
let currentUserDisplayName = 'Officer R. Kumar (DCSO)';
let activeRecords = [];
let settlementData = {};
let activeDisputeRecordId = null;
let activeNotifications = [];

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
  await fetchNotifications();

  // Bilateral Live Polling every 5 seconds
  setInterval(fetchNotifications, 5000);
});

// 1. AUTO-FETCH DIRECT FROM LIVE OPMS MANDI STREAM
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
      if (lastSync) lastSync.innerText = 'Synced: ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (OPMS Mandi Stream Live)';
    }
  } catch (err) {
    console.error('Auto-fetch error:', err);
  } finally {
    if (spinner) spinner.classList.add('hidden');
    if (btn) btn.disabled = false;
  }
}

// 2. Fetch Procurement Records
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

// 4. Render Table Rows with Status Badges and Discrepancy Highlighting
function renderTable(records) {
  const tbody = document.getElementById('reconcileTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const badge = document.getElementById('recordsCountBadge');
  if (badge) badge.innerText = records.length + ' Items';

  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';

  records.forEach(r => {
    const isMatch = r.reconciliationStatus === 'MATCH';
    const isRejected = r.reconciliationStatus === 'REJECTED';
    const isCorrection = r.reconciliationStatus === 'CORRECTION_REQUESTED';
    
    const tr = document.createElement('tr');
    tr.className = isMatch ? 'hover:bg-slate-50 transition' : 
                   isRejected ? 'bg-rose-50/70 hover:bg-rose-50 transition' :
                   isCorrection ? 'bg-amber-50/70 hover:bg-amber-50 transition' :
                   'bg-amber-50/50 hover:bg-amber-50 transition';

    let statusBadge = '';
    if (isMatch) {
      statusBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">VERIFIED</span>';
    } else if (isRejected) {
      statusBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">REJECTED</span>';
    } else if (isCorrection) {
      statusBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">NOTICE</span>';
    } else {
      statusBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">FLAGGED</span>';
    }

    tr.innerHTML = `
      <td class="py-3.5 px-3.5 font-bold text-slate-900">${r.truckNo}</td>
      <td class="py-3.5 px-3 text-slate-600 font-mono text-xs">${r.passNo}</td>
      <td class="py-3.5 px-3.5">
        <div class="font-bold text-slate-900 font-sans">${r.farmerName}</div>
        <div class="text-xs text-slate-500 font-mono">${r.farmerAadhaar || 'XXXX-XXXX-9812'}</div>
      </td>
      <td class="py-3.5 px-3 text-right text-slate-700">${r.govtNetKg.toLocaleString()} kg</td>
      <td class="py-3.5 px-3 text-right font-bold ${isMatch ? 'text-emerald-800' : 'text-amber-800'}">${r.millNetKg.toLocaleString()} kg</td>
      <td class="py-3.5 px-3 text-center">
        <span class="px-2 py-0.5 rounded text-xs ${r.moisture > 17.0 ? 'bg-rose-100 text-rose-800 font-black border border-rose-300' : 'bg-slate-100 text-slate-700'}">
          ${r.moisture}%
        </span>
      </td>
      <td class="py-3.5 px-3 text-right font-bold ${r.netVarianceKg < 0 ? 'text-amber-700' : 'text-slate-500'}">
        ${r.netVarianceKg === 0 ? '0 kg' : r.netVarianceKg + ' kg'}
      </td>
      <td class="py-3.5 px-3 text-center">
        ${statusBadge}
      </td>
      <td class="py-3.5 px-3.5 text-xs text-slate-700 max-w-xs font-sans" title="${r.discrepancyReason}">
        ${r.discrepancyReason}
      </td>
      <td class="py-3.5 px-3.5 text-center">
        ${!isMatch ? `
          <button onclick="openDisputeModal(${r.id})" class="px-3 py-1.5 ${isOfficer ? 'bg-[#012B1B] hover:bg-emerald-900 text-amber-300' : 'bg-slate-800 hover:bg-slate-900 text-white'} text-xs font-bold rounded-lg shadow transition">
            ${isOfficer ? '⚖️ 3-Way Action' : '⚠️ Recalibrate'}
          </button>
        ` : `
          <span class="text-xs text-emerald-800 font-bold font-sans">✓ Cleared</span>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 5. Update KPI Cards with Statutory 67% CMR and ₹25/Qtl Rate
function updateKPIs() {
  const totalKg = activeRecords.reduce((acc, r) => acc + r.millNetKg, 0);
  const totalQtl = (totalKg / 100).toFixed(2);
  const cmrTarget = (totalQtl * 0.67).toFixed(2);
  const pendingDisputes = activeRecords.filter(r => r.reconciliationStatus !== 'MATCH').length;
  
  // Statutory Remuneration @ ₹25.00/Qtl
  const totalSubsidy = (totalQtl * 25.00).toFixed(2);

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

// 6. Render Statutory Decision Hub (Role-Adaptive 3-Way Governance)
function renderStatutoryHub() {
  const container = document.getElementById('statutoryDecisionContainer');
  if (!container) return;
  const isApproved = settlementData.approvalStatus === 'APPROVED';
  const isRejected = settlementData.approvalStatus === 'REJECTED';
  const isCorrection = settlementData.approvalStatus === 'CORRECTION_REQUESTED';
  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';

  if (isApproved) {
    const certId = 'JRC-2025-TS-' + currentMillCode.slice(-4);
    container.innerHTML = `
      <div class="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <span class="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-lg shadow-sm">✓</span>
          <div>
            <div class="font-black text-[#012B1B] text-base sm:text-lg">Statutory 67% CMR & Subsidy Approved by DCSO</div>
            <div class="text-xs sm:text-sm text-emerald-800 mt-0.5 font-medium">
              PFMS Clearance Token: <code class="font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">PFMS-TS-2025-CLEAR-${currentMillCode.slice(-4)}</code> • Certificate: <b class="font-mono text-slate-900">${certId}</b>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button onclick="openJrcModal()" class="px-4 py-2.5 bg-[#012B1B] hover:bg-emerald-950 text-white text-sm font-bold rounded-lg shadow-md transition flex items-center gap-2">
            <span>📄 View / Print Official JRC</span>
          </button>
          <a href="/api/v2/statutory/jrc-pdf/${certId}" target="_blank" class="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-lg shadow transition">
            📥 Download PDF
          </a>
          <button onclick="openSmsModal()" class="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-sm font-bold rounded-lg transition">
            📱 Farmer DBT SMS Logs
          </button>
          ${isOfficer ? `
            <button onclick="requestRecalibration()" class="text-xs text-amber-800 hover:underline font-bold ml-1">Reopen Audit</button>
          ` : ''}
        </div>
      </div>
    `;
  } else if (isRejected) {
    container.innerHTML = `
      <div class="bg-rose-50 border border-rose-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div class="font-black text-rose-950 text-base">Consignment Batch Officially Rejected by DCSO</div>
          <div class="text-xs text-rose-700 mt-0.5">Physical inspection violation flagged under Telangana Food Security Act.</div>
        </div>
        ${isOfficer ? `<button onclick="requestRecalibration()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg">Re-evaluate</button>` : ''}
      </div>
    `;
  } else if (isCorrection) {
    container.innerHTML = `
      <div class="bg-amber-50 border border-amber-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div class="font-black text-amber-950 text-base">Regulatory Correction Notice Dispatched</div>
          <div class="text-xs text-amber-800 mt-0.5">Miller must recalibrate tare weights and re-submit for DCSO joint inspection.</div>
        </div>
        ${isOfficer ? `<button onclick="requestRecalibration()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg">Clear Notice</button>` : ''}
      </div>
    `;
  } else {
    if (isOfficer) {
      container.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <div class="text-base font-black text-[#012B1B]">3-Way DCSO Governance Action Required</div>
            <div class="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">Verify 67% CMR delivery obligation before digitally signing JRC & authorizing treasury subsidy release (@ ₹25.00/Qtl).</div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="executeDCSOGovernance('APPROVE')" class="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-lg shadow-md transition">
              ✓ Approve & Issue JRC
            </button>
            <button onclick="executeDCSOGovernance('REQUEST_CORRECTION')" class="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-lg transition">
              ⚠️ Request Correction
            </button>
            <button onclick="executeDCSOGovernance('REJECT')" class="px-3.5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm rounded-lg transition">
              ✕ Reject Consignment
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <div class="text-base font-black text-[#012B1B]">Milling Remuneration Claim Prepared (Miller View)</div>
            <div class="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">Statutory Remuneration claim of ₹25.00/Qtl (Milling + Handling + Gunny) prepared for Warangal DCSO Sign-Off.</div>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="submitMillerClaim()" class="px-5 py-2.5 bg-[#012B1B] hover:bg-emerald-900 text-white font-bold text-sm rounded-lg shadow-md transition">
              📝 Submit Claim to DCSO
            </button>
          </div>
        </div>
      `;
    }
  }
}

function submitMillerClaim() {
  alert('Statutory claim and 67% CMR delivery schedule submitted to Warangal District Civil Supplies Office for review & JRC issuance!');
}

async function executeDCSOGovernance(action) {
  const totalKg = activeRecords.reduce((acc, r) => acc + r.millNetKg, 0);
  const totalQtl = totalKg / 100;
  const cmrTarget = totalQtl * 0.67;
  const totalSubsidy = totalQtl * 25.00;

  let reason = '';
  if (action === 'REJECT') {
    reason = prompt('Enter statutory grounds for consignment rejection:', 'Scale variance exceeded permissible ±1.0% limit.') || 'Rejected by DCSO';
  } else if (action === 'REQUEST_CORRECTION') {
    reason = prompt('Enter recalibration notice instructions:', 'Joint scale re-weighing required for moisture over 17.0%.') || 'Correction requested';
  }

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
        totalPayableSubsidy: totalSubsidy,
        action: action,
        reason: reason
      })
    });
    const data = await res.json();
    if (data.success) {
      settlementData.approvalStatus = (action === 'APPROVE') ? 'APPROVED' : (action === 'REJECT') ? 'REJECTED' : 'CORRECTION_REQUESTED';
      renderStatutoryHub();
      if (action === 'APPROVE') {
        openJrcModal();
      } else {
        alert(data.message);
      }
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
      'Allocated Quota: ' + (MILL_METADATA[currentMillCode]?.quota || '3,500.00 Qtl');
  }

  const millSelectContainer = document.getElementById('millSelectContainer');
  if (millSelectContainer) {
    if (!isOfficer) {
      const select = document.getElementById('millFilterSelect');
      if (select) {
        select.value = currentMillCode;
        select.disabled = true;
        select.classList.add('bg-slate-100', 'cursor-not-allowed');
      }
    }
  }

  if (!isOfficer) {
    const c1 = document.getElementById('card1Title');
    if (c1) c1.innerText = 'Mill Inward Paddy';
    const c2 = document.getElementById('card2Title');
    if (c2) c2.innerText = 'My 67% CMR Out-Turn Obligation';
    const c3 = document.getElementById('card3Title');
    if (c3) c3.innerText = 'Active Flagged Batches';
    const c4 = document.getElementById('card4Title');
    if (c4) c4.innerText = 'Accrued Subsidy Claim (@ ₹25/Qtl)';
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
  fetchNotifications();
}

function filterRecords(type) {
  if (type === 'ALL') renderTable(activeRecords);
  else if (type === 'MATCH') renderTable(activeRecords.filter(r => r.reconciliationStatus === 'MATCH'));
  else if (type === 'MISMATCH') renderTable(activeRecords.filter(r => r.reconciliationStatus !== 'MATCH'));
}

// 7. Modals (JRC, SMS Gateway, Dispute Resolution)
function openJrcModal() {
  const totalKg = activeRecords.reduce((acc, r) => acc + r.millNetKg, 0);
  const totalQtl = (totalKg / 100).toFixed(2);
  const cmrTarget = (totalQtl * 0.67).toFixed(2);
  const totalSubsidy = (totalQtl * 25.00).toFixed(2);
  const certId = 'JRC-2025-TS-' + currentMillCode.slice(-4);
  const pfmsToken = 'PFMS-TS-2025-CLEAR-' + currentMillCode.slice(-4);

  document.getElementById('jrcCertId').innerText = certId;
  document.getElementById('jrcMillName').innerText = currentMillName;
  document.getElementById('jrcMillCode').innerText = currentMillCode;
  document.getElementById('jrcManagerName').innerText = currentManagerName;
  document.getElementById('jrcSignManager').innerText = currentManagerName;
  document.getElementById('jrcTotalPaddy').innerText = totalQtl + ' Qtl';
  document.getElementById('jrcCmrTarget').innerText = cmrTarget + ' Qtl (Raw Rice)';
  document.getElementById('jrcSubsidyAmt').innerText = '₹ ' + Number(totalSubsidy).toLocaleString();

  // QR Code Image URL update
  const qrImg = document.getElementById('jrcQrImage');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://epds.telangana.gov.in/verify/jrc?cert=${certId}&token=${pfmsToken}`;
  }

  // Update PDF download link
  const pdfLink = document.getElementById('downloadPdfLink');
  if (pdfLink) {
    pdfLink.href = `/api/v2/statutory/jrc-pdf/${certId}`;
  }

  document.getElementById('jrcCertificateModal').classList.remove('hidden');
}
function closeJrcModal() { document.getElementById('jrcCertificateModal').classList.add('hidden'); }

// 8. Simulated Farmer DBT SMS Gateway Broadcast Logs
function openSmsModal() {
  const container = document.getElementById('smsLogsContainer');
  if (!container) return;
  container.innerHTML = '';
  
  // Compute dynamically based on active batches or standard MSP rate (₹2,320/Qtl Grade-A)
  const records = activeRecords.length > 0 ? activeRecords : [
    { farmerName: 'K. Mallesh', farmerPhone: '9848011221', millNetKg: 16000 },
    { farmerName: 'B. Ramesh', farmerPhone: '9848011222', millNetKg: 13850 },
    { farmerName: 'G. Venkatiah', farmerPhone: '9848011223', millNetKg: 18000 },
    { farmerName: 'M. Saritha', farmerPhone: '9848011224', millNetKg: 11700 },
    { farmerName: 'P. Sammaiah', farmerPhone: '9848011225', millNetKg: 17000 },
    { farmerName: 'V. Narsaiah', farmerPhone: '9848011226', millNetKg: 15000 }
  ];

  const banks = ['SBI Narsampet', 'APGVB Geesugonda', 'UBI Wardhannapet', 'HDFC Atmakur', 'SBI Parkal', 'APGVB Rayaparthy'];

  records.forEach((r, idx) => {
    const qtl = (r.millNetKg / 100);
    const mspPayout = Math.round(qtl * 2320); // MSP ₹2,320 per quintal
    const bank = banks[idx % banks.length];
    const phone = r.farmerPhone || ('98480112' + (21 + idx));
    const now = new Date();
    const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const card = document.createElement('div');
    card.className = 'bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-sm hover:bg-slate-100 transition';
    card.innerHTML = `
      <div class="space-y-0.5">
        <div class="font-bold text-slate-900">${r.farmerName} <span class="font-normal text-slate-500 font-mono text-xs">(+91 ${phone})</span></div>
        <div class="text-xs text-emerald-800 font-medium">Paddy: ${qtl.toFixed(2)} Qtl • Direct DBT to ${bank}</div>
        <div class="text-[10px] text-slate-400 font-mono">Ref: TXN-TS-DBT-${r.truckNo || ('TRK-' + (idx+1))} • ${timeStr}</div>
      </div>
      <div class="text-right font-mono">
        <div class="font-black text-emerald-800 text-base">₹ ${mspPayout.toLocaleString()}</div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">DISPATCHED</span>
      </div>
    `;
    container.appendChild(card);
  });

  document.getElementById('smsLogsModal').classList.remove('hidden');
}
function closeSmsModal() { document.getElementById('smsLogsModal').classList.add('hidden'); }

// 9. Open Dispute Modal with 3-Way DCSO Governance
function openDisputeModal(recordId) {
  activeDisputeRecordId = recordId;
  const record = activeRecords.find(r => r.id === recordId);
  if (!record) return;

  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';

  const modalTitle = document.getElementById('disputeModalTitle');
  if (modalTitle) {
    modalTitle.innerText = isOfficer ? '3-Way Statutory Dispute Resolution & Calibration' : 'Miller Scale Recalibration Console';
  }

  const subtitleEl = document.getElementById('disputeModalSubtitle');
  if (subtitleEl) {
    subtitleEl.innerText = isOfficer ? 'Official DCSO Statutory Determination' : `Correct Weighbridge Tare Variance for ${record.truckNo}`;
  }

  document.getElementById('dispTruckNo').innerText = record.truckNo;
  document.getElementById('dispGovtNet').innerText = record.govtNetKg.toLocaleString() + ' kg';
  document.getElementById('dispVariance').innerText = record.netVarianceKg + ' kg';
  document.getElementById('dispAgreedQty').value = record.millNetKg;

  const actionsContainer = document.getElementById('disputeModalActionsContainer');
  if (actionsContainer) {
    if (isOfficer) {
      actionsContainer.innerHTML = `
        <div class="flex flex-wrap items-center justify-end gap-2.5">
          <button onclick="closeDisputeModal()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm">Cancel</button>
          <button onclick="submitDisputeResolution('REJECT')" class="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-sm shadow">✕ Reject</button>
          <button onclick="submitDisputeResolution('REQUEST_CORRECTION')" class="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm shadow">⚠️ Request Correction</button>
          <button onclick="submitDisputeResolution('APPROVE_RECALIBRATION')" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-lg text-sm shadow">✓ Calibrate & Approve</button>
        </div>
      `;
    } else {
      const isNotice = record.reconciliationStatus === 'CORRECTION_REQUESTED';
      actionsContainer.innerHTML = `
        <div class="flex items-center justify-end gap-2.5">
          <button onclick="closeDisputeModal()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm">Cancel</button>
          <button onclick="submitDisputeResolution('MILLER_SUBMIT_CORRECTION')" class="px-4 py-2 bg-[#012B1B] hover:bg-emerald-950 text-white font-black rounded-lg text-sm shadow">
            ${isNotice ? '⚡ Clear Notice & Submit to DCSO' : 'Submit Recalibration to DCSO'}
          </button>
        </div>
      `;
    }
  }

  document.getElementById('disputeModal').classList.remove('hidden');
}
function closeDisputeModal() { document.getElementById('disputeModal').classList.add('hidden'); }

async function submitDisputeResolution(actionType = 'APPROVE_RECALIBRATION') {
  const agreed = parseFloat(document.getElementById('dispAgreedQty').value);
  const notes = document.getElementById('dispNotes').value.trim();

  try {
    const res = await fetch('/api/v2/disputes/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: activeDisputeRecordId,
        action: actionType,
        agreedQuantity: agreed,
        notes: notes || 'Joint physical weighbridge scale inspection calibrated',
        userRole: currentRole,
        millName: currentMillName,
        managerName: currentManagerName
      })
    });
    const data = await res.json();
    if (data.success) {
      closeDisputeModal();
      await fetchProcurementRecords();
      await fetchSettlementSummary();
      await fetchNotifications();
    }
  } catch (err) {
    console.error(err);
  }
}

// 10. BILATERAL NOTIFICATION & ALERT SYSTEM
async function fetchNotifications() {
  try {
    const recipient = (currentRole === 'GOVERNMENT_OFFICER') ? 'DCSO' : currentMillCode;
    const res = await fetch('/api/v2/notifications?recipient=' + recipient);
    const data = await res.json();
    if (data.success) {
      activeNotifications = data.notifications || [];
      
      const activeCount = activeNotifications.filter(n => n.status === 'ACTIVE').length;
      const badge = document.getElementById('notifBadgeCount');
      if (badge) {
        badge.innerText = activeCount;
        badge.className = activeCount > 0 ? 
          'px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full animate-pulse' :
          'px-1.5 py-0.2 bg-emerald-800 text-emerald-200 font-bold text-[10px] rounded-full';
      }

      renderAlertBanner();
      renderNotifications();
    }
  } catch (err) {
    console.error('Fetch notifications error:', err);
  }
}

function renderAlertBanner() {
  const banner = document.getElementById('liveAlertBannerContainer');
  if (!banner) return;

  const isOfficer = currentRole === 'GOVERNMENT_OFFICER';
  const activeAlerts = activeNotifications.filter(n => n.status === 'ACTIVE');

  if (activeAlerts.length === 0) {
    banner.classList.add('hidden');
    banner.innerHTML = '';
    return;
  }

  const latest = activeAlerts[0];
  banner.classList.remove('hidden');

  if (isOfficer) {
    // DCSO View of incoming Miller recalibrations
    banner.innerHTML = `
      <div class="bg-amber-50 border-l-4 border-amber-500 border border-amber-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <div class="font-black text-amber-950 text-sm sm:text-base">${latest.title}</div>
            <div class="text-xs text-amber-800 mt-0.5">${latest.message} <span class="font-mono text-slate-500 font-semibold">• ${latest.timestamp}</span></div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${latest.recordId ? `
            <button onclick="openDisputeModal(${latest.recordId})" class="px-3.5 py-1.5 bg-[#012B1B] hover:bg-emerald-950 text-amber-300 text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5">
              <span>⚖️ Review & Approve</span>
            </button>
          ` : ''}
          <button onclick="openNotificationModal()" class="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100 transition">
            View All (${activeAlerts.length})
          </button>
        </div>
      </div>
    `;
  } else {
    // Miller View of incoming DCSO Correction notices or Approvals
    const isApproval = latest.type === 'DCSO_APPROVED';
    const bgClass = isApproval ? 'bg-emerald-50 border-emerald-500 border-emerald-200' : 'bg-amber-50 border-amber-500 border-amber-200';
    const textClass = isApproval ? 'text-emerald-950' : 'text-amber-950';
    const subTextClass = isApproval ? 'text-emerald-800' : 'text-amber-800';

    banner.innerHTML = `
      <div class="${bgClass} border-l-4 border p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${isApproval ? '✓' : '⚠️'}</span>
          <div>
            <div class="font-black ${textClass} text-sm sm:text-base">${latest.title}</div>
            <div class="text-xs ${subTextClass} mt-0.5">${latest.message} <span class="font-mono text-slate-500 font-semibold">• ${latest.timestamp}</span></div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${(latest.recordId && !isApproval) ? `
            <button onclick="openDisputeModal(${latest.recordId})" class="px-3.5 py-1.5 bg-[#012B1B] hover:bg-emerald-950 text-amber-300 text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5">
              <span>🔧 Recalibrate Tare Weight Now</span>
            </button>
          ` : ''}
          <button onclick="openNotificationModal()" class="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-100 transition">
            View All (${activeAlerts.length})
          </button>
        </div>
      </div>
    `;
  }
}

function renderNotifications() {
  const container = document.getElementById('notificationsListContainer');
  if (!container) return;

  if (activeNotifications.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <span class="text-3xl block mb-2">🔕</span>
        <div class="font-bold text-slate-600">No Notifications</div>
        <div class="text-xs">All consignments and reconciliation workflows are synchronized.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  activeNotifications.forEach(n => {
    const isActive = n.status === 'ACTIVE';
    const isApproval = n.type === 'DCSO_APPROVED';
    const isReject = n.type === 'CONSIGNMENT_REJECTED';
    const isRecalib = n.type === 'MILLER_RECALIBRATION_SUBMITTED';

    const card = document.createElement('div');
    card.className = `p-3.5 rounded-xl border ${isActive ? (isApproval ? 'bg-emerald-50/60 border-emerald-300' : isReject ? 'bg-rose-50/60 border-rose-300' : 'bg-amber-50/60 border-amber-300') : 'bg-slate-50 border-slate-200 opacity-60'} space-y-1.5 transition`;

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black uppercase px-2 py-0.5 rounded ${isApproval ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : isReject ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}">
            ${n.type.replace(/_/g, ' ')}
          </span>
          <span class="text-xs text-slate-500 font-mono">${n.timestamp}</span>
        </div>
        <span class="text-[11px] font-bold ${isActive ? 'text-amber-700' : 'text-slate-400'}">
          ${isActive ? '● Active' : 'Dismissed'}
        </span>
      </div>

      <div class="font-bold text-slate-900 text-sm">${n.title}</div>
      <div class="text-xs text-slate-600 leading-relaxed">${n.message}</div>
      <div class="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
        <span>From: <b class="text-slate-800">${n.sender}</b></span>
        <div class="flex items-center gap-2">
          ${n.recordId ? `
            <button onclick="closeNotificationModal(); openDisputeModal(${n.recordId});" class="text-xs text-emerald-900 hover:text-emerald-700 font-bold underline">
              Action Record #${n.recordId}
            </button>
          ` : ''}
          ${isActive ? `
            <button onclick="dismissNotification('${n.id}')" class="text-xs text-slate-400 hover:text-slate-700">Dismiss</button>
          ` : ''}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openNotificationModal() {
  renderNotifications();
  const modal = document.getElementById('notificationsModal');
  if (modal) modal.classList.remove('hidden');
}

function closeNotificationModal() {
  const modal = document.getElementById('notificationsModal');
  if (modal) modal.classList.add('hidden');
}

async function dismissNotification(notifId) {
  try {
    const res = await fetch('/api/v2/notifications/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notifId })
    });
    const data = await res.json();
    if (data.success) {
      await fetchNotifications();
    }
  } catch (err) {
    console.error(err);
  }
}


