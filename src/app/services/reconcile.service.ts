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
  readonly RAW_RICE_OTR = 0.67; // 67% Raw Rice
  readonly MILLING_CHARGES_PER_QTL = 10.00;
  readonly HANDLING_CHARGES_PER_QTL = 4.50;
  readonly GUNNY_DEPRECIATION_RATE = 2.20;
  readonly MAX_ALLOWED_MOISTURE = 17.0;

  // 1. Govt Records Dataset (govt_data.xlsx)
  govtRecords = signal<GovtLotRecord[]>([
    {
      id: "REC-01",
      transitPass: "TP-2025-8801",
      ppcCenter: "PPC Narsampet Mandi",
      dispatchDate: "2025-11-04",
      farmerName: "Ramesh (B. Venkanna)",
      truckNo: "TS-03-UB-4491",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 1000.00,
      moisturePercent: 16.5,
      gunnyBags: 2500,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Mandi weighbridge pass issued"
    },
    {
      id: "REC-02",
      transitPass: "TP-2025-8802",
      ppcCenter: "PPC Parkal Center",
      dispatchDate: "2025-11-04",
      farmerName: "Suresh (K. Rameshwara)",
      truckNo: "TS-03-UC-1102",
      paddyType: "Fine Grade (BPT-5204)",
      paddyQtyQtl: 1500.00,
      moisturePercent: 17.0,
      gunnyBags: 3750,
      mspRatePerQtl: 2340.00,
      officialRemarks: "Passed PPC inspection"
    },
    {
      id: "REC-25",
      transitPass: "TP-2025-8825",
      ppcCenter: "PPC Narsampet Mandi",
      dispatchDate: "2025-11-05",
      farmerName: "M. Thirupathi",
      truckNo: "AP-04-TX-9021",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 1000.00,
      moisturePercent: 18.2,
      gunnyBags: 2500,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Moisture 18.2% noted at Mandi"
    },
    {
      id: "REC-04",
      transitPass: "TP-2025-8804",
      ppcCenter: "PPC Wardhannapet",
      dispatchDate: "2025-11-05",
      farmerName: "Ch. Srinivas",
      truckNo: "TS-04-TA-3390",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 800.00,
      moisturePercent: 16.8,
      gunnyBags: 2000,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Verified gate pass"
    },
    {
      id: "REC-05",
      transitPass: "TP-2025-8805",
      ppcCenter: "PPC Chennaraopet",
      dispatchDate: "2025-11-06",
      farmerName: "G. Shankaraiah",
      truckNo: "TS-03-UB-7782",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 1200.00,
      moisturePercent: 16.4,
      gunnyBags: 3000,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Standard dispatch"
    },
    {
      id: "REC-06",
      transitPass: "TP-2025-8806",
      ppcCenter: "PPC Parkal Center",
      dispatchDate: "2025-11-06",
      farmerName: "T. Rajamouli",
      truckNo: "TS-03-UC-5509",
      paddyType: "Fine Grade",
      paddyQtyQtl: 650.00,
      moisturePercent: 16.5,
      gunnyBags: 1625,
      mspRatePerQtl: 2340.00,
      officialRemarks: "Direct transit issued"
    }
  ]);

  // 2. Mill Records Dataset (mill_data.xlsx)
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
      millerRemarks: "Weighed on digital weighbridge #1. Clean match."
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
      millerRemarks: "Weighbridge tare difference of 50 Qtl noted."
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
      millerRemarks: "High moisture 18.2%. 50 Qtl moisture cut deduction."
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
      millerRemarks: "Matched pass perfectly."
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
      millerRemarks: "Weighment verified."
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
      millerRemarks: "Direct gate entry without online PPC transit pass."
    }
  ]);

  // 3. CMR Rice Deliveries to FCI Depots
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

  // Overrides / Resolutions
  resolvedOverrides = signal<{ [key: string]: any }>({});

  // Officer Approval State
  officerApprovalStatus = signal<"PENDING" | "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED">("PENDING");
  officerApprovalRemarks = signal<string>("");
  officerApprovedBy = signal<string>("");
  officerApprovedAt = signal<string>("");

  // Audit History Log (Formatted as requested: Date - Change - Actor)
  auditLogs = signal<AuditLogEntry[]>([
    {
      id: "LOG-1",
      dateStr: "12 Sept 2025, 10:30 AM",
      changeDescription: "Quantity adjusted for Record 25",
      oldValue: "1000 Qtl",
      newValue: "950 Qtl",
      changedBy: "Officer A (R. Kumar, DCSO)",
      role: "Government Officer",
      category: "QUANTITY"
    },
    {
      id: "LOG-2",
      dateStr: "12 Sept 2025, 09:15 AM",
      changeDescription: "Imported govt_data.xlsx & mill_data.xlsx datasets",
      oldValue: "0 records",
      newValue: "6 lots synced",
      changedBy: "System Ingestion Engine",
      role: "System Core",
      category: "UPLOAD"
    }
  ]);

  // Helper to normalize vehicle registration strings
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

    // 1. Total Paddy
    const totalPaddyQtl = items.reduce((acc, i) => acc + (i.finalReconciledQty || 0), 0);
    
    // 2. Total Rice (67% Raw Rice norm)
    const totalRiceQtl = Number((totalPaddyQtl * this.RAW_RICE_OTR).toFixed(2));
    
    // Delivered Rice
    const totalDeliveredRiceQtl = deliveries.reduce((acc, d) => acc + d.riceDeliveredQtl, 0);
    
    // 3. Total Pending Rice
    const totalPendingRiceQtl = Math.max(0, Number((totalRiceQtl - totalDeliveredRiceQtl).toFixed(2)));

    // 4. Total Payable Amount (Milling ₹10/Qtl + Handling ₹4.50/Qtl + Gunny ₹2.20/bag)
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

  // 4. DISCREPANCY RESOLUTION
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

    // 7. Audit History Entry
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

  // 6. OFFICER APPROVAL MODULE (Approve / Reject / Request Correction)
  setOfficerDecision(decision: "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED", remarks: string, officerName: string) {
    const nowStr = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });

    this.officerApprovalStatus.set(decision);
    this.officerApprovalRemarks.set(remarks);
    this.officerApprovedBy.set(officerName);
    this.officerApprovedAt.set(nowStr);

    const actionText = 
      decision === "APPROVED" ? "Approved Reconciliation & Subsidy Release" :
      decision === "REJECTED" ? "Rejected Reconciliation Batch" : "Requested Corrections on Tare Variances";

    // Add to Audit History
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

  // 2. UPLOAD DATA HANDLERS
  uploadGovtData(newLots: GovtLotRecord[], fileName: string = "govt_data.xlsx") {
    this.govtRecords.set(newLots);
    const nowFormatted = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      dateStr: `${nowFormatted}, ${new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}`,
      changeDescription: `Govt Data Uploaded (${fileName})`,
      oldValue: "Previous Lots",
      newValue: `${newLots.length} Lots Synced`,
      changedBy: "Civil Supplies Portal / Officer",
      role: "Government Officer",
      category: "UPLOAD"
    };
    this.auditLogs.update((prev) => [newLog, ...prev]);
  }

  uploadMillData(newSlips: MillGateRecord[], fileName: string = "mill_data.xlsx") {
    this.millRecords.set(newSlips);
    const nowFormatted = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      dateStr: `${nowFormatted}, ${new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}`,
      changeDescription: `Mill Data Uploaded (${fileName})`,
      oldValue: "Previous Slips",
      newValue: `${newSlips.length} Slips Synced`,
      changedBy: "Rice Mill Operator",
      role: "Rice Mill User",
      category: "UPLOAD"
    };
    this.auditLogs.update((prev) => [newLog, ...prev]);
  }

  // Manual Single Mill Entry
  addManualMillRecord(record: MillGateRecord) {
    this.millRecords.update((prev) => [record, ...prev]);
    const nowFormatted = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      dateStr: `${nowFormatted}, ${new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}`,
      changeDescription: `Manual Mill Record Added: Slip #${record.slipNo}`,
      oldValue: "None",
      newValue: `${record.netPaddyQtl} Qtl (${record.farmerName || 'Farmer'})`,
      changedBy: "Rice Mill Operator",
      role: "Rice Mill User",
      category: "UPLOAD"
    };
    this.auditLogs.update((prev) => [newLog, ...prev]);
  }

  // Reset Demo
  resetDemoData() {
    this.resolvedOverrides.set({});
    this.officerApprovalStatus.set("PENDING");
    this.officerApprovalRemarks.set("");
    this.officerApprovedBy.set("");
    this.officerApprovedAt.set("");
  }
}
