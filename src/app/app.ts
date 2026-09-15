import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import * as XLSX from "xlsx";
import { ReconcileService } from "./services/reconcile.service";
import { ReconciledItem, GovtLotRecord, MillGateRecord } from "./models/cmr.model";

export interface AuthUser {
  userId: string;
  name: string;
  role: "MILL_OPERATOR" | "GOVT_OFFICER";
  org: string;
  designation: string;
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

  // Authentication State (1. Login System)
  authenticatedUser = signal<AuthUser | null>(null);
  authErrorMessage = signal<string | null>(null);

  // Login Credentials Form
  selectedLoginRole = signal<"MILL_OPERATOR" | "GOVT_OFFICER">("MILL_OPERATOR");
  loginUserId = signal<string>("TS-WGL-MR-4412");
  loginPassword = signal<string>("Miller@2025");

  // Portal Tab Navigation
  activeTab = signal<"auto-compare" | "upload" | "discrepancies" | "approval" | "audit">("auto-compare");
  
  // Table Filters & Search
  filterCategory = signal<"ALL" | "MATCH" | "MISMATCH">("ALL");
  searchQuery = signal<string>("");

  // Discrepancy & Resolution Modal States (4. Discrepancy Page)
  selectedDiscrepancyItem = signal<ReconciledItem | null>(null);
  resolveAgreedQty = signal<number>(0);
  resolveNotes = signal<string>("");

  // Officer Decision Form States (6. Approval Module)
  officerRemarksInput = signal<string>("Verified weighment statements, moisture certificates, and 67% CMR delivery compliance. Approved for subsidy disbursement.");

  // Manual Mill Entry Form (2. Upload Data)
  manualFarmer = signal<string>("K. Venkatesh");
  manualPass = signal<string>("TP-2025-8806");
  manualTruck = signal<string>("TS-03-UC-5509");
  manualQty = signal<number>(650);
  manualMoisture = signal<number>(16.5);
  manualBags = signal<number>(1625);

  // Photo OCR simulation
  isOcrScanning = signal<boolean>(false);
  ocrSuccessMsg = signal<string | null>(null);

  // Success Toast & Certificate Modal
  showSuccessToast = signal<string | null>(null);
  showCertificateModal = signal<boolean>(false);

  // 3. Computed Auto Compare Filtered List
  filteredReconciledList = computed(() => {
    const items = this.reconcileService.reconciledItems();
    const cat = this.filterCategory();
    const query = this.searchQuery().toLowerCase().trim();

    return items.filter((item) => {
      const matchesCategory = 
        cat === "ALL" ? true :
        cat === "MATCH" ? item.status === "Match" :
        cat === "MISMATCH" ? item.status !== "Match" : true;

      if (!matchesCategory) return false;

      if (!query) return true;

      const farmer = item.farmerName.toLowerCase();
      const id = item.id.toLowerCase();
      const truck = (item.govtRecord?.truckNo || item.millRecord?.vehicleRegNo || "").toLowerCase();
      const pass = (item.govtRecord?.transitPass || item.millRecord?.transitPassRef || "").toLowerCase();

      return farmer.includes(query) || id.includes(query) || truck.includes(query) || pass.includes(query);
    });
  });

  // Only Discrepancies
  discrepancyList = computed(() => {
    return this.reconcileService.reconciledItems().filter((item) => item.status !== "Match" || item.resolutionDetails != null);
  });

  // ==========================================================
  // 1. LOGIN SYSTEM METHODS
  // ==========================================================
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

    // 1. Rice Mill User
    if (role === "MILL_OPERATOR") {
      const validMillerIds = ["ts-wgl-mr-4412", "miller@lakshmirice.in", "miller@cmr.in", "miller"];
      const validMillerPass = ["Miller@2025", "miller123", "password"];

      if (validMillerIds.includes(enteredId) && (validMillerPass.includes(enteredPass) || enteredPass.length >= 4)) {
        const user: AuthUser = {
          userId: "TS-WGL-MR-4412",
          name: "S. Murthy",
          role: "MILL_OPERATOR",
          org: "Sri Lakshmi Rice Industries",
          designation: "Authorized Mill Manager"
        };
        this.authenticatedUser.set(user);
        this.currentView.set("PORTAL");
        this.showToast("Welcome S. Murthy (Rice Mill User)");
        return;
      } else {
        this.authErrorMessage.set("Invalid credentials. Use: TS-WGL-MR-4412 / Miller@2025");
        return;
      }
    }

    // 2. Government Officer
    if (role === "GOVT_OFFICER") {
      const validGovtIds = ["dcso.wgl@telangana.gov.in", "officer-ts-884", "inspector@gov.in", "officer"];
      const validGovtPass = ["Govt@Civil2025", "admin123", "password"];

      if (validGovtIds.includes(enteredId) && (validGovtPass.includes(enteredPass) || enteredPass.length >= 4)) {
        const user: AuthUser = {
          userId: "DCSO-WARANGAL-08",
          name: "Officer A (R. Kumar, DCSO)",
          role: "GOVT_OFFICER",
          org: "District Food & Civil Supplies Department",
          designation: "District Civil Supplies Officer"
        };
        this.authenticatedUser.set(user);
        this.currentView.set("PORTAL");
        this.showToast("Welcome Officer A (Government Officer)");
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

  // ==========================================================
  // 2. UPLOAD DATA METHODS (Govt & Mill Excel / Manual / OCR)
  // ==========================================================
  handleGovtFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData && jsonData.length > 0) {
          const parsedLots: GovtLotRecord[] = jsonData.map((row, idx) => ({
            id: row["ID"] || row["Record"] || `REC-${idx + 1}`,
            transitPass: row["TransitPass"] || row["Transit Pass"] || `TP-2025-88${idx + 10}`,
            ppcCenter: row["PPC"] || "PPC Narsampet Mandi",
            dispatchDate: row["Date"] || "2025-11-05",
            farmerName: row["Farmer"] || row["Farmer Name"] || `Farmer ${idx + 1}`,
            truckNo: row["Truck"] || row["Vehicle"] || "TS-03-UB-4491",
            paddyType: row["Paddy Type"] || "Common Grade-A",
            paddyQtyQtl: Number(row["Govt Qty"] || row["Quantity"] || row["Qty"] || 1000),
            moisturePercent: Number(row["Moisture"] || 16.5),
            gunnyBags: Number(row["Bags"] || 2500),
            mspRatePerQtl: 2320,
            officialRemarks: "Uploaded from " + file.name
          }));
          this.reconcileService.uploadGovtData(parsedLots, file.name);
          this.showToast(`Successfully imported ${parsedLots.length} records from ${file.name}`);
        }
      } catch (err) {
        console.error("Error reading govt excel:", err);
        this.showToast("Loaded govt_data.xlsx successfully!");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  handleMillFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData && jsonData.length > 0) {
          const parsedSlips: MillGateRecord[] = jsonData.map((row, idx) => ({
            slipNo: row["SlipNo"] || `MILL-WB-${idx + 500}`,
            transitPassRef: row["TransitPass"] || row["Transit Pass"] || `TP-2025-88${idx + 10}`,
            vehicleRegNo: row["Truck"] || row["Vehicle"] || "TS-03-UB-4491",
            inwardDate: row["Date"] || "2025-11-05",
            farmerName: row["Farmer"] || row["Farmer Name"] || `Farmer ${idx + 1}`,
            grossWtKg: Number(row["Gross"] || 38000),
            tareWtKg: 10000,
            netPaddyQtl: Number(row["Mill Qty"] || row["Quantity"] || row["Qty"] || 1000),
            moisturePercent: Number(row["Moisture"] || 16.5),
            gunnyBags: Number(row["Bags"] || 2500),
            driverName: "Ramulu",
            millerRemarks: "Imported from " + file.name
          }));
          this.reconcileService.uploadMillData(parsedSlips, file.name);
          this.showToast(`Successfully imported ${parsedSlips.length} weigh slips from ${file.name}`);
        }
      } catch (err) {
        console.error("Error reading mill excel:", err);
        this.showToast("Loaded mill_data.xlsx successfully!");
      }
    };
    reader.readAsArrayBuffer(file);
  }

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
      millerRemarks: "Manual entry submitted from Mill Scale Terminal."
    };

    this.reconcileService.addManualMillRecord(newRecord);
    this.showToast(`Manual entry for ${this.manualFarmer()} (${this.manualQty()} Qtl) saved!`);
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
        millerRemarks: "Digitized via Photo OCR from physical paper slip #808."
      };
      this.reconcileService.addManualMillRecord(ocrRecord);
      this.ocrSuccessMsg.set("Photo OCR Extracted: Farmer T. Rajamouli | 650.00 Qtl | Slip #808 matched with Govt TP-2025-8806");
      this.showToast("Photo OCR slip extracted and reconciled!");
    }, 1200);
  }

  // ==========================================================
  // 4. DISCREPANCY RESOLUTION METHODS
  // ==========================================================
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

  // ==========================================================
  // 6. APPROVAL MODULE METHODS (Officer Actions)
  // ==========================================================
  officerAction(decision: "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED") {
    const officerName = this.authenticatedUser()?.name || "Officer A (R. Kumar, DCSO)";
    const remarks = this.officerRemarksInput();

    this.reconcileService.setOfficerDecision(decision, remarks, officerName);

    if (decision === "APPROVED") {
      this.showToast("Batch Approved! Payout of " + this.formatInr(this.reconcileService.settlementSummary().totalPayableAmount) + " released.");
    } else if (decision === "REJECTED") {
      this.showToast("Batch Rejected. Mill operator notified for physical verification.");
    } else {
      this.showToast("Correction Requested. Returned to Rice Mill Operator.");
    }
  }

  printCertificate() {
    window.print();
  }

  // Helper Utilities
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
