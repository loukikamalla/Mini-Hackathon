import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ReconcileService } from "./services/reconcile.service";
import { AuthService, AuthUser } from "./services/auth.service";
import { ReconciledItem, GovtLotRecord, MillGateRecord, FarmerProfile, FarmerLoadRecord } from "./models/cmr.model";


export interface MillSummary {
  millId: string;
  millName: string;
  location: string;
  paddyAllocatedQtl: number;
  riceTargetQtl: number;
  deliveredRiceQtl: number;
  complianceRate: string;
  pendingDisputes: number;
  status: "COMPLIANT" | "UNDER_REVIEW" | "DISPUTE_FLAGGED";
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  readonly reconcileService = inject(ReconcileService);
  readonly authService = inject(AuthService);
  readonly Math = Math;

  // App View State: 'LANDING' | 'PORTAL'
  currentView = signal<"LANDING" | "PORTAL">("LANDING");

  // Authentication State
  authenticatedUser = signal<AuthUser | null>(null);
  authErrorMessage = signal<string | null>(null);

  // Login Form State
  selectedLoginRole = signal<"MILL_OPERATOR" | "GOVT_OFFICER">("GOVT_OFFICER");
  loginUserId = signal<string>("dcso.wgl@telangana.gov.in");
  loginPassword = signal<string>("Govt@Civil2025");

  // Tab Navigation
  activeTab = signal<"mills-directory" | "auto-compare" | "live-api" | "discrepancies" | "approval" | "audit">("auto-compare");
  
  // Table Filters & Search
  filterCategory = signal<"ALL" | "MATCH" | "MISMATCH">("ALL");
  searchQuery = signal<string>("");

  // Officer-Specific Mandi & Mill Selectors
  selectedMandiCenter = signal<string>("ALL");
  selectedMillId = signal<string>("TS-WGL-MR-4412");

  // List of District Mills under Officer Jurisdiction
    districtMills = signal<MillSummary[]>([
    {
      millId: "TS-WGL-MR-4412",
      millName: "Sri Lakshmi Rice Industries",
      location: "Narsampet Road, Warangal Urban",
      paddyAllocatedQtl: 6350.00,
      riceTargetQtl: 4254.50,
      deliveredRiceQtl: 3050.00,
      complianceRate: "71.7%",
      pendingDisputes: 3,
      status: "UNDER_REVIEW"
    },
    {
      millId: "TS-WGL-MR-1108",
      millName: "Kakatiya Modern Agro Mills",
      location: "Parkal Highway, Warangal Rural",
      paddyAllocatedQtl: 4800.00,
      riceTargetQtl: 3216.00,
      deliveredRiceQtl: 3216.00,
      complianceRate: "100.0%",
      pendingDisputes: 0,
      status: "COMPLIANT"
    },
    {
      millId: "TS-WGL-MR-3391",
      millName: "Telangana Parboiled Rice Corp",
      location: "Wardhannapet MLS Point",
      paddyAllocatedQtl: 5500.00,
      riceTargetQtl: 3685.00,
      deliveredRiceQtl: 2100.00,
      complianceRate: "57.0%",
      pendingDisputes: 2,
      status: "DISPUTE_FLAGGED"
    },
    {
      millId: "TS-WGL-MR-2204",
      millName: "Bhadrakali Agri Modern Foods",
      location: "Chennaraopet Road, Warangal Rural",
      paddyAllocatedQtl: 7200.00,
      riceTargetQtl: 4824.00,
      deliveredRiceQtl: 4500.00,
      complianceRate: "93.2%",
      pendingDisputes: 1,
      status: "UNDER_REVIEW"
    }
  ]);

  currentActiveMill = computed(() => {
    return this.districtMills().find(m => m.millId === this.selectedMillId()) || this.districtMills()[0];
  });

  // Live Govt API Sync States
  isApiSyncing = signal<boolean>(false);
  lastSyncSuccessMessage = signal<string | null>("Live connected to Civil Supplies OPMS Gateway. 7 Procurement Lots synced.");

  // Discrepancy Modal States
  selectedDiscrepancyItem = signal<ReconciledItem | null>(null);
  resolveAgreedQty = signal<number>(0);
  resolveNotes = signal<string>("");

  // Farmer 360 Passbook Profile Modal State
  selectedFarmerProfile = signal<FarmerProfile | null>(null);

  // Officer Action Form State
  officerRemarksInput = signal<string>("Verified digital weighment feeds against official Civil Supplies procurement manifests. Approved for payment.");

  // Mill Scale Inward Form
  manualFarmer = signal<string>("K. Venkatesh");
  manualPass = signal<string>("TP-2025-8806");
  manualTruck = signal<string>("TS-03-UC-5509");
  manualQty = signal<number>(650);
  manualMoisture = signal<number>(16.5);
  manualBags = signal<number>(1625);

  // Photo OCR simulation
  isOcrScanning = signal<boolean>(false);
  ocrSuccessMsg = signal<string | null>(null);

  // Notifications & Modals
  showSuccessToast = signal<string | null>(null);
  showCertificateModal = signal<boolean>(false);
  showNotificationModal = signal<boolean>(false);

  // Computed Auto Compare List (Filtered by category, search & center)
  filteredReconciledList = computed(() => {
    const items = this.reconcileService.reconciledItems();
    const cat = this.filterCategory();
    const query = this.searchQuery().toLowerCase().trim();
    const center = this.selectedMandiCenter();

    return items.filter((item) => {
      const matchesCategory = 
        cat === "ALL" ? true :
        cat === "MATCH" ? item.status === "Match" :
        cat === "MISMATCH" ? item.status !== "Match" : true;

      if (!matchesCategory) return false;

      if (center !== "ALL") {
        const itemCenter = item.govtRecord?.ppcCenter || "";
        if (!itemCenter.toLowerCase().includes(center.toLowerCase())) {
          return false;
        }
      }

      if (!query) return true;

      const farmer = item.farmerName.toLowerCase();
      const id = item.id.toLowerCase();
      const truck = (item.govtRecord?.truckNo || item.millRecord?.vehicleRegNo || "").toLowerCase();
      const pass = (item.govtRecord?.transitPass || item.millRecord?.transitPassRef || "").toLowerCase();

      return farmer.includes(query) || id.includes(query) || truck.includes(query) || pass.includes(query);
    });
  });

  discrepancyList = computed(() => {
    return this.reconcileService.reconciledItems().filter((item) => item.status !== "Match" || item.resolutionDetails != null);
  });

    // Auth Methods
  setLoginRole(role: "MILL_OPERATOR" | "GOVT_OFFICER") {
    this.selectedLoginRole.set(role);
    this.authErrorMessage.set(null);
    this.setDemoCredentials(role);
  }

  setDemoCredentials(role: "MILL_OPERATOR" | "GOVT_OFFICER") {
    this.authErrorMessage.set(null);
    if (role === "MILL_OPERATOR") {
      this.loginUserId.set("TS-WGL-MR-4412");
      this.loginPassword.set("Miller@2025");
    } else {
      this.loginUserId.set("dcso.wgl@telangana.gov.in");
      this.loginPassword.set("Govt@Civil2025");
    }
  }

  performDirectLogin(event: Event) {
    event.preventDefault();
    this.authErrorMessage.set(null);

    const result = this.authService.authenticate(
      this.loginUserId(),
      this.loginPassword(),
      this.selectedLoginRole()
    );

    if (result.success && result.user) {
      this.authenticatedUser.set(result.user);
      if (result.user.assignedMillId) {
        this.selectedMillId.set(result.user.assignedMillId);
      }
      this.currentView.set("PORTAL");
      this.showToast(`Welcome ${result.user.name} (${result.user.designation})`);
    } else {
      this.authErrorMessage.set(result.error || "Authentication failed.");
    }
  }

  performQuickLogin(role: "MILL_OPERATOR" | "GOVT_OFFICER", millId?: string) {
    this.authErrorMessage.set(null);
    const user = this.authService.quickLogin(role, millId);
    this.authenticatedUser.set(user);
    if (user.assignedMillId) {
      this.selectedMillId.set(user.assignedMillId);
    }
    this.currentView.set("PORTAL");
    this.showToast(`⚡ Fast Sign-in: ${user.name}`);
  }

  logout() {
    this.authService.logout();
    this.authenticatedUser.set(null);
    this.authErrorMessage.set(null);
    this.currentView.set("LANDING");
    this.showToast("Logged out successfully.");
  }

  switchDistrictMill(millId: string) {
    this.selectedMillId.set(millId);
    const mill = this.currentActiveMill();
    this.showToast(`Switched to ${mill.millName} (${mill.millId})`);
  }

  syncGovtDataFromApi() {
    this.isApiSyncing.set(true);
    
    setTimeout(() => {
      this.isApiSyncing.set(false);
      const msg = this.reconcileService.syncFromGovtApi(this.selectedMandiCenter());
      this.lastSyncSuccessMessage.set(msg);
      this.showToast("⚡ " + msg);
    }, 800);
  }

  // Farmer 360 Passbook Profile Open/Close
  openFarmerProfile(farmerNameOrId: string) {
    const profile = this.reconcileService.getFarmerProfile(farmerNameOrId);
    if (profile) {
      this.selectedFarmerProfile.set(profile);
    } else {
      // Dynamic fallback profile
      this.selectedFarmerProfile.set({
        farmerId: "TS-PPC-F-" + Math.floor(100000 + Math.random() * 900000),
        farmerName: farmerNameOrId,
        fatherHusbandName: "Verified Landholder",
        aadhaarMasked: "XXXX-XXXX-" + Math.floor(1000 + Math.random() * 9000),
        pattaPassbookNo: "T290800" + Math.floor(1000 + Math.random() * 9000),
        mobile: "+91 98490 " + Math.floor(10000 + Math.random() * 90000),
        village: "Local Mandi Jurisdiction",
        mandal: "Warangal Area",
        district: "Warangal Rural",
        bankName: "State Bank of India",
        accountNoMasked: "XXXXXX" + Math.floor(1000 + Math.random() * 9000),
        ifscCode: "SBIN0020188",
        totalLoadsDelivered: 1,
        totalPaddyQtyQtl: 1000.0,
        totalMspGrossAmount: 2320000.0,
        subsidiesApprovedAmount: 2320000.0,
        subsidiesInProcessAmount: 0.0,
        pendingPaymentAmount: 0.0,
        overallDbtStatus: "COMPLETED",
        loads: [
          {
            loadId: "LOAD-2025-01",
            transitPass: "TP-2025-8801",
            dispatchDate: "2025-11-04",
            ppcCenter: "PPC Mandi Center",
            truckNo: "TS-03-UB-4491",
            paddyType: "Common Grade-A",
            dispatchedQtyQtl: 1000.0,
            millWeighedQtyQtl: 1000.0,
            moisturePercent: 16.5,
            mspRatePerQtl: 2320.0,
            totalMspAmount: 2320000.0,
            loadStatus: "WEIGHED_MATCHED",
            dbtPaymentStatus: "PAID",
            pfmsTxnRef: "PFMS-TS-2025-998811",
            paymentDisbursedDate: "2025-11-06"
          }
        ]
      });
    }
  }

  closeFarmerProfile() {
    this.selectedFarmerProfile.set(null);
  }

  openNotificationModal() {
    this.showNotificationModal.set(true);
  }

  closeNotificationModal() {
    this.showNotificationModal.set(false);
  }

  printFarmerPassbook() {
    window.print();
  }

  // Open Discrepancy Resolution Modal
  openDiscrepancyModal(item: ReconciledItem) {
    this.selectedDiscrepancyItem.set(item);
    this.resolveAgreedQty.set(item.finalReconciledQty || item.govtQty || item.millQty);
    this.resolveNotes.set(
      item.discrepancyType === 'MOISTURE_CUT' 
        ? "Agreed to standard moisture cut deduction based on gate test." 
        : "Adjusted tare weight according to certified weighbridge calibration."
    );
  }

  closeDiscrepancyModal() {
    this.selectedDiscrepancyItem.set(null);
  }

  submitResolution() {
    const item = this.selectedDiscrepancyItem();
    if (!item) return;

    const user = this.authenticatedUser();
    this.reconcileService.resolveDiscrepancy(
      item.id,
      this.resolveAgreedQty(),
      user?.name || "Civil Supplies Officer",
      user?.role || "GOVT_OFFICER",
      this.resolveNotes()
    );

    this.showToast(`Lot ${item.id} reconciled to ${this.resolveAgreedQty()} Qtl.`);
    this.closeDiscrepancyModal();
  }

  // Statutory Decision Hub Actions
  executeApproveBatch() {
    const user = this.authenticatedUser();
    this.reconcileService.approveBatch(user?.name || "District Civil Supplies Officer", this.officerRemarksInput());
    this.showCertificateModal.set(true);
    this.showToast("📢 Batch Approved! Direct DBT SMS Payment Notifications dispatched to 6 verified Farmers via Telangana SMS Gateway.");
  }

  executeRejectBatch() {
    const user = this.authenticatedUser();
    this.reconcileService.rejectBatch(user?.name || "District Civil Supplies Officer", this.officerRemarksInput());
    this.showToast("Batch Rejected. Subsidy payment blocked pending Joint Physical Audit.");
  }

  executeRequestCorrection() {
    const user = this.authenticatedUser();
    this.reconcileService.requestCorrection(user?.name || "District Civil Supplies Officer", this.officerRemarksInput());
    this.showToast("Correction notice sent to Rice Miller for weighbridge recalibration.");
  }

  // Miller Weighbridge Scale Slip Submission
  submitManualScaleEntry() {
    if (!this.manualPass() || !this.manualTruck() || this.manualQty() <= 0) {
      this.showToast("Please enter valid Transit Pass, Truck No, and Mill Weight.");
      return;
    }

    const newSlip: MillGateRecord = {
      slipNo: "MILL-WB-" + Math.floor(600 + Math.random() * 400),
      transitPassRef: this.manualPass(),
      vehicleRegNo: this.manualTruck(),
      inwardDate: new Date().toISOString().split('T')[0],
      farmerName: this.manualFarmer(),
      grossWtKg: Math.round(this.manualQty() * 100 + 10000),
      tareWtKg: 10000,
      netPaddyQtl: this.manualQty(),
      moisturePercent: this.manualMoisture(),
      gunnyBags: this.manualBags(),
      driverName: "Scale Operator Entry",
      millerRemarks: "Scale slip entered at Mill weighbridge."
    };

    this.reconcileService.addMillGateRecord(newSlip);
    this.showToast(`Weighbridge Inward Slip ${newSlip.slipNo} recorded successfully!`);
    this.activeTab.set("auto-compare");
  }

  simulateCameraOcrScan() {
    this.isOcrScanning.set(true);
    this.ocrSuccessMsg.set(null);

    setTimeout(() => {
      this.isOcrScanning.set(false);
      this.manualFarmer.set("K. Venkatesh");
      this.manualPass.set("TP-2025-8806");
      this.manualTruck.set("TS-03-UC-5509");
      this.manualQty.set(650.00);
      this.manualMoisture.set(16.5);
      this.manualBags.set(1625);
      this.ocrSuccessMsg.set("OCR Extracted: TP-2025-8806 | TS-03-UC-5509 | 650.00 Qtl | 16.5% Moisture");
      this.showToast("📷 Slip OCR Extracted Successfully!");
    }, 1200);
  }

  // Helpers
  formatInr(val: number): string {
    return "₹" + (val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatNum(val: number): string {
    return (val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  showToast(msg: string) {
    this.showSuccessToast.set(msg);
    setTimeout(() => {
      this.showSuccessToast.set(null);
    }, 4500);
  }
}
