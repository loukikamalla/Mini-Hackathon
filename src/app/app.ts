import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ReconcileService } from "./services/reconcile.service";
import { ReconciledItem, GovtLotRecord, MillGateRecord } from "./models/cmr.model";

export interface AuthUser {
  userId: string;
  name: string;
  role: "MILL_OPERATOR" | "GOVT_OFFICER";
  org: string;
  designation: string;
}

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
  activeTab = signal<"auto-compare" | "live-api" | "discrepancies" | "approval" | "audit">("auto-compare");
  
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
    }
  ]);

  // Live Govt API Sync States
  isApiSyncing = signal<boolean>(false);
  lastSyncSuccessMessage = signal<string | null>("Live connected to Civil Supplies OPMS Gateway. 7 Procurement Lots synced.");

  // Discrepancy Modal States
  selectedDiscrepancyItem = signal<ReconciledItem | null>(null);
  resolveAgreedQty = signal<number>(0);
  resolveNotes = signal<string>("");

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

    const role = this.selectedLoginRole();
    const enteredId = (this.loginUserId() || "").trim().toLowerCase();
    const enteredPass = (this.loginPassword() || "").trim();

    if (role === "MILL_OPERATOR") {
      const validMillerIds = ["ts-wgl-mr-4412", "miller@lakshmirice.in", "miller@cmr.in", "miller"];
      const validMillerPass = ["Miller@2025", "miller123", "password"];

      if (validMillerIds.includes(enteredId) && (validMillerPass.includes(enteredPass) || enteredPass.length >= 4)) {
        this.authenticatedUser.set({
          userId: "TS-WGL-MR-4412",
          name: "S. Murthy",
          role: "MILL_OPERATOR",
          org: "Sri Lakshmi Rice Industries",
          designation: "Authorized Mill Manager"
        });
        this.currentView.set("PORTAL");
        this.showToast("Welcome S. Murthy (Rice Mill User)");
        return;
      } else {
        this.authErrorMessage.set("Invalid credentials. Use: TS-WGL-MR-4412 / Miller@2025");
        return;
      }
    }

    if (role === "GOVT_OFFICER") {
      const validGovtIds = ["dcso.wgl@telangana.gov.in", "officer-ts-884", "inspector@gov.in", "officer"];
      const validGovtPass = ["Govt@Civil2025", "admin123", "password"];

      if (validGovtIds.includes(enteredId) && (validGovtPass.includes(enteredPass) || enteredPass.length >= 4)) {
        this.authenticatedUser.set({
          userId: "DCSO-WARANGAL-08",
          name: "Officer A (R. Kumar, DCSO)",
          role: "GOVT_OFFICER",
          org: "District Food & Civil Supplies Department, Warangal",
          designation: "District Civil Supplies Officer"
        });
        this.currentView.set("PORTAL");
        this.showToast("Welcome Officer A (Government Officer Dashboard)");
        return;
      } else {
        this.authErrorMessage.set("Invalid credentials. Use: dcso.wgl@telangana.gov.in / Govt@Civil2025");
        return;
      }
    }
  }

  logout() {
    this.authenticatedUser.set(null);
    this.authErrorMessage.set(null);
    this.currentView.set("LANDING");
    this.showToast("Logged out successfully.");
  }

  // DIRECT GOVT API LIVE FETCH METHOD
  syncGovtDataFromApi() {
    this.isApiSyncing.set(true);
    
    setTimeout(() => {
      this.isApiSyncing.set(false);
      const msg = this.reconcileService.syncFromGovtApi(this.selectedMandiCenter());
      this.lastSyncSuccessMessage.set(msg);
      this.showToast("⚡ " + msg);
    }, 800);
  }

  // Switch Selected Mill in District
  switchDistrictMill(millId: string) {
    this.selectedMillId.set(millId);
    const mill = this.districtMills().find(m => m.millId === millId);
    this.showToast(`Switched inspection context to: ${mill?.millName || millId}`);
  }

  // Digital Scale Inward Entry
  submitManualMillEntry() {
    const newRecord: MillGateRecord = {
      slipNo: `MILL-WB-${Math.floor(100 + Math.random() * 900)}`,
      transitPassRef: this.manualPass(),
      vehicleRegNo: this.manualTruck(),
      inwardDate: new Date().toISOString().split("T")[0],
      farmerName: this.manualFarmer(),
      grossWtKg: (this.manualQty() * 100) + 10000,
      tareWtKg: 10000,
      netPaddyQtl: Number(this.manualQty()),
      moisturePercent: Number(this.manualMoisture()),
      gunnyBags: Number(this.manualBags()),
      driverName: "K. Venkatesh",
      millerRemarks: "Direct electronic weighbridge inward recorded."
    };

    this.reconcileService.addManualMillRecord(newRecord);
    this.showToast(`Digital scale inward recorded for ${this.manualFarmer()} (${this.manualQty()} Qtl)!`);
    this.activeTab.set("auto-compare");
  }

  simulatePhotoOcr() {
    this.isOcrScanning.set(true);
    this.ocrSuccessMsg.set(null);

    setTimeout(() => {
      this.isOcrScanning.set(false);
      const ocrRecord: MillGateRecord = {
        slipNo: "MILL-OCR-808",
        transitPassRef: "TP-2025-8806",
        vehicleRegNo: "TS-03-UC-5509",
        inwardDate: "2025-11-06",
        farmerName: "T. Rajamouli",
        grossWtKg: 35850,
        tareWtKg: 10000,
        netPaddyQtl: 650.00,
        moisturePercent: 16.5,
        gunnyBags: 1625,
        driverName: "G. Ravi",
        millerRemarks: "Digitized via Photo OCR from physical weigh slip #808."
      };
      this.reconcileService.addManualMillRecord(ocrRecord);
      this.ocrSuccessMsg.set("Photo OCR Extracted: Farmer T. Rajamouli | 650.00 Qtl | Matched Govt TP-2025-8806");
      this.showToast("Paper slip digitized via OCR and reconciled!");
    }, 1200);
  }

  // Discrepancy Resolution
  openDiscrepancyModal(item: ReconciledItem) {
    this.selectedDiscrepancyItem.set(item);
    this.resolveAgreedQty.set(item.finalReconciledQty || item.millQty || item.govtQty);
    this.resolveNotes.set(
      item.discrepancyType.includes("Moisture") 
        ? "Agreed to standard 50kg/Qtl moisture cut deduction based on gate test."
        : "Adjusted tare weight according to certified weighbridge calibration."
    );
  }

  closeDiscrepancyModal() {
    this.selectedDiscrepancyItem.set(null);
  }

  submitResolution() {
    const item = this.selectedDiscrepancyItem();
    if (!item) return;

    const userRole = this.authenticatedUser()?.role || "MILL_OPERATOR";
    const oldQty = item.govtQty || item.millQty;

    this.reconcileService.resolveDiscrepancy(
      item.id,
      Number(this.resolveAgreedQty()),
      this.resolveNotes(),
      userRole,
      oldQty
    );

    this.showToast(`Record ${item.id} resolved to ${this.resolveAgreedQty()} Qtl successfully!`);
    this.closeDiscrepancyModal();
  }

  // Officer Decision Actions
  officerAction(decision: "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED") {
    const officerName = this.authenticatedUser()?.name || "Officer A (R. Kumar, DCSO)";
    const remarks = this.officerRemarksInput();

    this.reconcileService.setOfficerDecision(decision, remarks, officerName);

    if (decision === "APPROVED") {
      this.showToast("Batch Approved! Statutory Subsidy Release of " + this.formatInr(this.reconcileService.settlementSummary().totalPayableAmount) + " authorized.");
    } else if (decision === "REJECTED") {
      this.showToast("Batch Rejected. Mill flagged for physical Civil Supplies audit.");
    } else {
      this.showToast("Correction Notice Issued. Returned to Mill Operator for clarification.");
    }
  }

  printCertificate() {
    window.print();
  }

  showToast(msg: string) {
    this.showSuccessToast.set(msg);
    setTimeout(() => {
      this.showSuccessToast.set(null);
    }, 3500);
  }

  formatInr(val: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  }

  formatNum(val: number, decimals: number = 2): string {
    if (val === null || val === undefined || isNaN(val)) return "0.00";
    return Number(val).toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
}
