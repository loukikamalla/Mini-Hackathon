import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ReconcileService } from "./services/reconcile.service";
import { ReconciledItem } from "./models/cmr.model";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  readonly reconcileService = inject(ReconcileService);

  // View Navigation: Landing Page vs Main App
  isLandingPage = signal<boolean>(true);

  // Active Role & Navigation
  currentRole = signal<"MILL_OPERATOR" | "GOVT_OFFICER">("MILL_OPERATOR");
  activeTab = signal<"matrix" | "ingestion" | "settlement">("matrix");
  
  // Table Filters & Search
  filterCategory = signal<"ALL" | "EXACT_MATCH" | "MISMATCH" | "MISSING_IN_MILL">("ALL");
  searchQuery = signal<string>("");

  // Modal States
  selectedDiscrepancyItem = signal<ReconciledItem | null>(null);
  showCertificateModal = signal<boolean>(false);
  showSuccessToast = signal<string | null>(null);
  
  // Resolution Modal Inputs
  resolveAgreedQty = signal<number>(0);
  resolveNotes = signal<string>("");

  // Ingestion States
  isOcrScanning = signal<boolean>(false);
  ocrNotification = signal<string | null>(null);

  // Filtered List
  filteredReconciledList = computed(() => {
    const items = this.reconcileService.reconciledItems();
    const cat = this.filterCategory();
    const query = this.searchQuery().toLowerCase().trim();

    return items.filter((item) => {
      // Category Match
      const matchesCategory = 
        cat === "ALL" ? true :
        cat === "EXACT_MATCH" ? (item.status === "EXACT_MATCH" || item.status === "RESOLVED") :
        cat === "MISMATCH" ? item.status === "MISMATCH" :
        cat === "MISSING_IN_MILL" ? (item.status === "MISSING_IN_MILL" || item.status === "MISSING_IN_GOVT") : true;

      if (!matchesCategory) return false;

      // Search Query Match
      if (!query) return true;

      const truck = (item.govtRecord?.truckNo || item.millRecord?.vehicleRegNo || "").toLowerCase();
      const pass = (item.govtRecord?.transitPass || item.millRecord?.transitPassRef || "").toLowerCase();
      const farmer = (item.govtRecord?.farmerName || "").toLowerCase();
      const lotId = item.id.toLowerCase();

      return truck.includes(query) || pass.includes(query) || farmer.includes(query) || lotId.includes(query);
    });
  });

  // Actions
  launchApp(role: "MILL_OPERATOR" | "GOVT_OFFICER" = "MILL_OPERATOR") {
    this.currentRole.set(role);
    this.isLandingPage.set(false);
  }

  setFilter(cat: any) {
    this.filterCategory.set(cat);
  }

  setRole(role: "MILL_OPERATOR" | "GOVT_OFFICER") {
    this.currentRole.set(role);
    this.showToast(`Switched to ${role === "MILL_OPERATOR" ? "🌾 Mill Operator View" : "🏛️ Govt Inspector View"}`);
  }

  openDiscrepancyModal(item: ReconciledItem) {
    this.selectedDiscrepancyItem.set(item);
    const defaultQty = item.govtRecord ? item.govtRecord.paddyQtyQtl : (item.millRecord ? item.millRecord.netPaddyQtl : 0);
    this.resolveAgreedQty.set(item.finalReconciledQty || defaultQty);
    this.resolveNotes.set(
      item.discrepancyType === "MOISTURE_CUT" 
        ? "Agreed to standard moisture cut deduction based on gate testing."
        : "Adjusted tare weight according to digital weighbridge calibration."
    );
  }

  closeDiscrepancyModal() {
    this.selectedDiscrepancyItem.set(null);
  }

  submitResolution() {
    const item = this.selectedDiscrepancyItem();
    if (!item) return;

    this.reconcileService.resolveDiscrepancy(
      item.id,
      Number(this.resolveAgreedQty()),
      this.resolveNotes(),
      this.currentRole()
    );

    this.showToast(`Lot #${item.id} resolved successfully!`);
    this.closeDiscrepancyModal();
  }

  runOcrScan() {
    this.isOcrScanning.set(true);
    this.ocrNotification.set(null);

    setTimeout(() => {
      this.isOcrScanning.set(false);
      const msg = this.reconcileService.scanHandwrittenRegister();
      this.ocrNotification.set(msg);
      this.showToast("Handwritten register page digitized!");
    }, 1200);
  }

  resetAll() {
    this.reconcileService.resetDemoData();
    this.filterCategory.set("ALL");
    this.searchQuery.set("");
    this.showToast("Demo records reset.");
  }

  showToast(msg: string) {
    this.showSuccessToast.set(msg);
    setTimeout(() => {
      this.showSuccessToast.set(null);
    }, 3000);
  }

  printCertificate() {
    window.print();
  }

  // Formatters
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
