import { Injectable, signal, computed } from "@angular/core";
import { 
  GovtLotRecord, 
  MillGateRecord, 
  CMRDeliveryRecord, 
  ReconciledItem, 
  SettlementSummary, 
  AuditLogEntry 
} from "../models/cmr.model";

@Injectable({
  providedIn: "root"
})
export class ReconcileService {

  // Rates & Statutory Constants
  readonly RAW_RICE_OTR = 0.67; // 67% Raw Rice Norm
  readonly MILLING_CHARGES_PER_QTL = 10.00;
  readonly HANDLING_CHARGES_PER_QTL = 4.50;
  readonly GUNNY_DEPRECIATION_RATE = 2.20;
  readonly MAX_ALLOWED_MOISTURE = 17.0;

  // Live API Connection State
  isApiConnected = signal<boolean>(true);
  apiEndpoint = signal<string>("https://civilsupplies.telangana.gov.in/api/v2/cmr-procurement");
  lastApiSyncTime = signal<string>("15-Nov-2025 12:15 PM");

  // 1. Govt Records Dataset (Directly fetched from Govt Portal API)
  govtRecords = signal<GovtLotRecord[]>([
    {
      id: "GOVT-LOT-1001",
      transitPass: "TP-2025-8801",
      ppcCenter: "PPC Narsampet Mandi (Center #401)",
      dispatchDate: "2025-11-04",
      farmerName: "Ramesh (B. Venkanna)",
      truckNo: "TS-03-UB-4491",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 1000.00,
      moisturePercent: 16.5,
      gunnyBags: 2500,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Synced directly from Civil Supplies OPMS Mandi Gateway"
    },
    {
      id: "GOVT-LOT-1002",
      transitPass: "TP-2025-8802",
      ppcCenter: "PPC Parkal Center (Center #402)",
      dispatchDate: "2025-11-04",
      farmerName: "Suresh (K. Rameshwara)",
      truckNo: "TS-03-UC-1102",
      paddyType: "Fine Grade (BPT-5204)",
      paddyQtyQtl: 1500.00,
      moisturePercent: 17.0,
      gunnyBags: 3750,
      mspRatePerQtl: 2340.00,
      officialRemarks: "Passed PPC electronic quality grading"
    },
    {
      id: "GOVT-LOT-1025",
      transitPass: "TP-2025-8825",
      ppcCenter: "PPC Narsampet Mandi (Center #401)",
      dispatchDate: "2025-11-05",
      farmerName: "M. Thirupathi",
      truckNo: "AP-04-TX-9021",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 1000.00,
      moisturePercent: 18.2,
      gunnyBags: 2500,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Live API Tag: Moisture 18.2% flagged by Mandi Weighbridge"
    },
    {
      id: "GOVT-LOT-1004",
      transitPass: "TP-2025-8804",
      ppcCenter: "PPC Wardhannapet (Center #408)",
      dispatchDate: "2025-11-05",
      farmerName: "Ch. Srinivas",
      truckNo: "TS-04-TA-3390",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 800.00,
      moisturePercent: 16.8,
      gunnyBags: 2000,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Official electronic gate pass issued"
    },
    {
      id: "GOVT-LOT-1005",
      transitPass: "TP-2025-8805",
      ppcCenter: "PPC Chennaraopet (Center #412)",
      dispatchDate: "2025-11-06",
      farmerName: "G. Shankaraiah",
      truckNo: "TS-03-UB-7782",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 1200.00,
      moisturePercent: 16.4,
      gunnyBags: 3000,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Direct electronic transit feed"
    },
    {
      id: "GOVT-LOT-1006",
      transitPass: "TP-2025-8806",
      ppcCenter: "PPC Parkal Center (Center #402)",
      dispatchDate: "2025-11-06",
      farmerName: "T. Rajamouli",
      truckNo: "TS-03-UC-5509",
      paddyType: "Fine Grade (BPT-5204)",
      paddyQtyQtl: 650.00,
      moisturePercent: 16.5,
      gunnyBags: 1625,
      mspRatePerQtl: 2340.00,
      officialRemarks: "Department transit pass active"
    },
    {
      id: "GOVT-LOT-1007",
      transitPass: "TP-2025-8807",
      ppcCenter: "PPC Wardhannapet (Center #408)",
      dispatchDate: "2025-11-07",
      farmerName: "P. Laxman Rao",
      truckNo: "TS-04-TB-9912",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 900.00,
      moisturePercent: 16.9,
      gunnyBags: 2250,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Govt godown live dispatch"
    }
  ]);

  // 2. Mill Records Dataset (From Digital IoT Weighbridge Scale / Inward System)
  millRecords = signal<MillGateRecord[]>([
    {
      slipNo: "MILL-WB-501",
      transitPassRef: "TP-2025-8801",
      vehicleRegNo: "TS-03-UB-4491",
      inwardDate: "2025-11-04",
      farmerName: "Ramesh (B. Venkanna)",
      grossWtKg: 38200,
      tareWtKg: 10200,
      netPaddyQtl: 1000.00,
      moisturePercent: 16.5,
      gunnyBags: 2500,
      driverName: "Ramulu",
      millerRemarks: "Weighed on digital weighbridge #1. Clean match with Govt API feed."
    },
    {
      slipNo: "MILL-WB-502",
      transitPassRef: "TP-2025-8802",
      vehicleRegNo: "TS-03-UC-1102",
      inwardDate: "2025-11-04",
      farmerName: "Suresh (K. Rameshwara)",
      grossWtKg: 52100,
      tareWtKg: 10100,
      netPaddyQtl: 1450.00,
      moisturePercent: 17.0,
      gunnyBags: 3750,
      driverName: "K. Raju",
      millerRemarks: "50 Qtl tare weight difference noted on digital weighbridge."
    },
    {
      slipNo: "MILL-WB-525",
      transitPassRef: "TP-2025-8825",
      vehicleRegNo: "AP-04-TX-9021",
      inwardDate: "2025-11-05",
      farmerName: "M. Thirupathi",
      grossWtKg: 37500,
      tareWtKg: 10300,
      netPaddyQtl: 950.00,
      moisturePercent: 18.2,
      gunnyBags: 2500,
      driverName: "S. Mohan",
      millerRemarks: "High moisture 18.2%. 50 Qtl standard moisture cut deduction applied."
    },
    {
      slipNo: "MILL-WB-504",
      transitPassRef: "TP-2025-8804",
      vehicleRegNo: "TS-04-TA-3390",
      inwardDate: "2025-11-05",
      farmerName: "Ch. Srinivas",
      grossWtKg: 31000,
      tareWtKg: 10000,
      netPaddyQtl: 800.00,
      moisturePercent: 16.8,
      gunnyBags: 2000,
      driverName: "Yadagiri",
      millerRemarks: "Matched Govt pass accurately."
    },
    {
      slipNo: "MILL-WB-505",
      transitPassRef: "TP-2025-8805",
      vehicleRegNo: "TS-03-UB-7782",
      inwardDate: "2025-11-06",
      farmerName: "G. Shankaraiah",
      grossWtKg: 44200,
      tareWtKg: 10200,
      netPaddyQtl: 1200.00,
      moisturePercent: 16.4,
      gunnyBags: 3000,
      driverName: "B. Sambaiah",
      millerRemarks: "Weighment verified. Stacked in Silo #2."
    },
    {
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
      millerRemarks: "Digitized from physical slip #808 via Photo OCR."
    },
    {
      slipNo: "MILL-WB-599-UNREG",
      transitPassRef: "PENDING-PASS",
      vehicleRegNo: "TS-04-TC-8822",
      inwardDate: "2025-11-08",
      farmerName: "K. Lingaiah",
      grossWtKg: 25000,
      tareWtKg: 9500,
      netPaddyQtl: 300.00,
      moisturePercent: 16.2,
      gunnyBags: 750,
      driverName: "K. Lingaiah",
      millerRemarks: "Direct gate entry without online PPC pass. Held in quarantine."
    }
  ]);

  // CMR Deliveries
  cmrDeliveries = signal<CMRDeliveryRecord[]>([
    {
      ackNo: "FCI-ACK-2025-091",
      depotName: "FCI Godown Warangal Road",
      deliveryDate: "2025-11-12",
      riceVariety: "Raw Rice (Common)",
      riceDeliveredQtl: 1800.00,
      gunnyDelivered: 3600,
      qcGrade: "Grade A (Moisture 13.8%)",
      status: "ACCEPTED_BY_FCI"
    },
    {
      ackNo: "FCI-ACK-2025-092",
      depotName: "Civil Supplies MLS Point Kazipet",
      deliveryDate: "2025-11-15",
      riceVariety: "Raw Rice (Grade-A)",
      riceDeliveredQtl: 1250.00,
      gunnyDelivered: 2500,
      qcGrade: "Grade A (Moisture 13.9%)",
      status: "ACCEPTED_BY_FCI"
    }
  ]);

  // Overrides & Decisions
  resolvedOverrides = signal<{ [key: string]: any }>({});
  officerApprovalStatus = signal<"PENDING" | "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED">("PENDING");
  officerApprovalRemarks = signal<string>("");
  officerApprovedBy = signal<string>("");
  officerApprovedAt = signal<string>("");

  // Audit Logs
  auditLogs = signal<AuditLogEntry[]>([
    {
      id: "LOG-1",
      dateStr: "15 Sept 2025, 12:15 PM",
      changeDescription: "Live Govt API Data Synced (7 Procurement Lots)",
      oldValue: "Disconnected",
      newValue: "7 Lots Live Synced",
      changedBy: "Govt OPMS API Gateway",
      role: "System API Service",
      category: "UPLOAD"
    },
    {
      id: "LOG-2",
      dateStr: "12 Sept 2025, 10:30 AM",
      changeDescription: "Quantity adjusted for Record GOVT-LOT-1025",
      oldValue: "1000 Qtl",
      newValue: "950 Qtl",
      changedBy: "Officer A (R. Kumar, DCSO)",
      role: "Government Officer",
      category: "QUANTITY"
    }
  ]);

  normalizeVehicle(v: string): string {
    if (!v) return "";
    return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  // 3. AUTO COMPARE ENGINE
  reconciledItems = computed<ReconciledItem[]>(() => {
    const govts = this.govtRecords();
    const mills = this.millRecords();
    const overrides = this.resolvedOverrides();
    const results: ReconciledItem[] = [];
    const unmatchedMillSet = new Set(mills.map((m) => m.slipNo));

    govts.forEach((govt) => {
      const normGovtTruck = this.normalizeVehicle(govt.truckNo);
      
      const matchedMill = mills.find((m) => {
        if (m.transitPassRef && govt.transitPass && m.transitPassRef.trim().toUpperCase() === govt.transitPass.trim().toUpperCase()) {
          return true;
        }
        return this.normalizeVehicle(m.vehicleRegNo) === normGovtTruck;
      });

      if (matchedMill) {
        unmatchedMillSet.delete(matchedMill.slipNo);
        const qtyDiff = Number((matchedMill.netPaddyQtl - govt.paddyQtyQtl).toFixed(2));
        const override = overrides[govt.id];

        let status: ReconciledItem["status"] = "Match";
        let discrepancyType = "None";
        let aiReasoning = "Quantities match accurately between Mandi pass and Mill scale.";

        if (override) {
          status = "Match";
          discrepancyType = "Resolved";
          aiReasoning = `Resolved: ${override.notes || "Adjusted and agreed by joint inspection."}`;
        } else if (Math.abs(qtyDiff) > 0.05) {
          status = "Mismatch";
          if (govt.moisturePercent > this.MAX_ALLOWED_MOISTURE || matchedMill.moisturePercent > this.MAX_ALLOWED_MOISTURE) {
            discrepancyType = "Moisture Deduction";
            aiReasoning = `Moisture ${matchedMill.moisturePercent}%. ${Math.abs(qtyDiff)} Qtl difference due to standard moisture cut.`;
          } else {
            discrepancyType = "Weighbridge Tare Variance";
            aiReasoning = `Weight difference of ${Math.abs(qtyDiff)} Qtl between Mandi gross scale and Mill weighbridge.`;
          }
        }

        const finalQty = override ? override.agreedQty : (status === "Match" ? govt.paddyQtyQtl : matchedMill.netPaddyQtl);

        results.push({
          id: govt.id,
          farmerName: govt.farmerName,
          govtRecord: govt,
          millRecord: matchedMill,
          govtQty: govt.paddyQtyQtl,
          millQty: matchedMill.netPaddyQtl,
          qtyDiff,
          status,
          discrepancyType,
          aiReasoning,
          finalReconciledQty: finalQty,
          resolutionDetails: override || null
        });
      } else {
        const override = overrides[govt.id];
        results.push({
          id: govt.id,
          farmerName: govt.farmerName,
          govtRecord: govt,
          millRecord: null,
          govtQty: govt.paddyQtyQtl,
          millQty: 0,
          qtyDiff: -govt.paddyQtyQtl,
          status: override ? "Match" : "Missing In Mill",
          discrepancyType: "Missing Inward Gate Slip",
          aiReasoning: "Transit pass issued by Mandi officer, but no inward entry recorded in Mill register.",
          finalReconciledQty: override ? override.agreedQty : 0,
          resolutionDetails: override || null
        });
      }
    });

    mills.forEach((mill) => {
      if (unmatchedMillSet.has(mill.slipNo)) {
        const override = overrides[mill.slipNo];
        results.push({
          id: mill.slipNo,
          farmerName: mill.farmerName || "Direct Farmer Delivery",
          govtRecord: null,
          millRecord: mill,
          govtQty: 0,
          millQty: mill.netPaddyQtl,
          qtyDiff: mill.netPaddyQtl,
          status: override ? "Match" : "Missing In Govt",
          discrepancyType: "Unregistered PPC Pass",
          aiReasoning: "Weighbridge slip generated at Mill gate without corresponding Govt Mandi Transit Pass.",
          finalReconciledQty: override ? override.agreedQty : mill.netPaddyQtl,
          resolutionDetails: override || null
        });
      }
    });

    return results;
  });

  // 5. CALCULATION MODULE
  settlementSummary = computed<SettlementSummary>(() => {
    const items = this.reconciledItems();
    const deliveries = this.cmrDeliveries();

    const totalPaddyQtl = items.reduce((acc, i) => acc + (i.finalReconciledQty || 0), 0);
    const totalRiceQtl = Number((totalPaddyQtl * this.RAW_RICE_OTR).toFixed(2));
    const totalDeliveredRiceQtl = deliveries.reduce((acc, d) => acc + d.riceDeliveredQtl, 0);
    const totalPendingRiceQtl = Math.max(0, Number((totalRiceQtl - totalDeliveredRiceQtl).toFixed(2)));

    const millingCharges = totalPaddyQtl * this.MILLING_CHARGES_PER_QTL;
    const handlingCharges = totalPaddyQtl * this.HANDLING_CHARGES_PER_QTL;
    const totalBags = items.reduce((acc, i) => acc + (i.millRecord ? i.millRecord.gunnyBags : (i.govtRecord ? i.govtRecord.gunnyBags : 0)), 0);
    const gunnyCredit = totalBags * this.GUNNY_DEPRECIATION_RATE;
    const totalPayableAmount = millingCharges + handlingCharges + gunnyCredit;

    const matchedCount = items.filter((i) => i.status === "Match").length;
    const mismatchCount = items.filter((i) => i.status !== "Match").length;
    const matchPercentage = items.length ? ((matchedCount / items.length) * 100).toFixed(1) : "0";

    return {
      totalPaddyQtl,
      totalRiceQtl,
      totalDeliveredRiceQtl,
      totalPendingRiceQtl,
      totalPayableAmount,
      millingCharges,
      handlingCharges,
      gunnyCredit,
      matchedCount,
      mismatchCount,
      totalLots: items.length,
      matchPercentage,
      approvalStatus: this.officerApprovalStatus(),
      approvalRemarks: this.officerApprovalRemarks(),
      approvedBy: this.officerApprovedBy(),
      approvedAt: this.officerApprovedAt()
    };
  });

  // LIVE GOVT API FETCH & SYNC METHOD
  syncFromGovtApi(mandiCenterId: string = "WARANGAL-ALL") {
    const nowTime = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
    this.lastApiSyncTime.set(`${nowDate} ${nowTime}`);

    // Add to Audit Log
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      dateStr: `${nowDate}, ${nowTime}`,
      changeDescription: `Live Govt API Sync executed for Center ${mandiCenterId}`,
      oldValue: "Cached Feed",
      newValue: `${this.govtRecords().length} Mandi Lots Refreshed`,
      changedBy: "Govt OPMS Live Gateway API",
      role: "System API Service",
      category: "UPLOAD"
    };
    this.auditLogs.update((prev) => [newLog, ...prev]);
  }

  resolveDiscrepancy(itemId: string, agreedQty: number, notes: string, userRole: string, oldQty: number = 1000) {
    const current = this.resolvedOverrides();
    this.resolvedOverrides.set({
      ...current,
      [itemId]: {
        agreedQty,
        resolvedBy: userRole,
        notes,
        timestamp: new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      }
    });

    const nowFormatted = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
    const actorName = userRole === "GOVT_OFFICER" ? "Officer A (R. Kumar, DCSO)" : "S. Murthy (Mill Manager)";

    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      dateStr: `${nowFormatted}, ${new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}`,
      changeDescription: `Quantity changed for ${itemId}`,
      oldValue: `${oldQty} Qtl`,
      newValue: `${agreedQty} Qtl`,
      changedBy: actorName,
      role: userRole === "GOVT_OFFICER" ? "Government Officer" : "Rice Mill User",
      category: "QUANTITY"
    };

    this.auditLogs.update((prev) => [newLog, ...prev]);
  }

  setOfficerDecision(decision: "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED", remarks: string, officerName: string) {
    const nowStr = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });

    this.officerApprovalStatus.set(decision);
    this.officerApprovalRemarks.set(remarks);
    this.officerApprovedBy.set(officerName);
    this.officerApprovedAt.set(nowStr);

    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      dateStr: `${nowFormatted}, ${new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}`,
      changeDescription: `Officer Decision: ${decision}`,
      oldValue: "PENDING",
      newValue: decision,
      changedBy: officerName,
      role: "Government Officer",
      category: "APPROVAL"
    };

    this.auditLogs.update((prev) => [newLog, ...prev]);
  }

  addManualMillRecord(record: MillGateRecord) {
    this.millRecords.update((prev) => [record, ...prev]);
    const nowFormatted = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      dateStr: `${nowFormatted}, ${new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}`,
      changeDescription: `Weighbridge Inward Recorded: Slip #${record.slipNo}`,
      oldValue: "None",
      newValue: `${record.netPaddyQtl} Qtl (${record.farmerName || 'Farmer'})`,
      changedBy: "Digital Weighbridge Scale",
      role: "Rice Mill User",
      category: "UPLOAD"
    };
    this.auditLogs.update((prev) => [newLog, ...prev]);
  }

  resetDemoData() {
    this.resolvedOverrides.set({});
    this.officerApprovalStatus.set("PENDING");
    this.officerApprovalRemarks.set("");
    this.officerApprovedBy.set("");
    this.officerApprovedAt.set("");
  }
}
