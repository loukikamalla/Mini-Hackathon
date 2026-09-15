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

  // Default norms
  readonly RAW_RICE_OTR = 0.67; // 67% Raw Rice per 100 kg Paddy
  readonly MILLING_CHARGES_PER_QTL = 10.00;
  readonly HANDLING_CHARGES_PER_QTL = 4.50;
  readonly GUNNY_DEPRECIATION_RATE = 2.20;
  readonly MAX_ALLOWED_MOISTURE = 17.0;

  // Signals for state management
  govtRecords = signal<GovtLotRecord[]>([
    {
      id: "GOVT-LOT-1001",
      transitPass: "TP-2025-8801",
      ppcCenter: "PPC Narsampet Mandi",
      dispatchDate: "2025-11-04",
      farmerName: "B. Venkanna",
      truckNo: "TS-03-UB-4491",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 280.00,
      moisturePercent: 16.5,
      gunnyBags: 700,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Dispatched from Mandi Weighbridge A"
    },
    {
      id: "GOVT-LOT-1002",
      transitPass: "TP-2025-8802",
      ppcCenter: "PPC Parkal Center",
      dispatchDate: "2025-11-04",
      farmerName: "K. Rameshwara Rao",
      truckNo: "TS-03-UC-1102",
      paddyType: "Fine Grade (BPT-5204)",
      paddyQtyQtl: 320.50,
      moisturePercent: 17.0,
      gunnyBags: 801,
      mspRatePerQtl: 2340.00,
      officialRemarks: "Passed quality specs"
    },
    {
      id: "GOVT-LOT-1003",
      transitPass: "TP-2025-8803",
      ppcCenter: "PPC Narsampet Mandi",
      dispatchDate: "2025-11-05",
      farmerName: "M. Thirupathi",
      truckNo: "AP-04-TX-9021",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 245.00,
      moisturePercent: 18.2,
      gunnyBags: 612,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Moisture slightly elevated (18.2%)"
    },
    {
      id: "GOVT-LOT-1004",
      transitPass: "TP-2025-8804",
      ppcCenter: "PPC Wardhannapet",
      dispatchDate: "2025-11-05",
      farmerName: "Ch. Srinivas",
      truckNo: "TS-04-TA-3390",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 195.00,
      moisturePercent: 16.8,
      gunnyBags: 488,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Regular transit pass issued"
    },
    {
      id: "GOVT-LOT-1005",
      transitPass: "TP-2025-8805",
      ppcCenter: "PPC Narsampet Mandi",
      dispatchDate: "2025-11-06",
      farmerName: "G. Shankaraiah",
      truckNo: "TS-03-UB-7782",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 310.00,
      moisturePercent: 16.4,
      gunnyBags: 775,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Clear gate dispatch"
    },
    {
      id: "GOVT-LOT-1006",
      transitPass: "TP-2025-8806",
      ppcCenter: "PPC Parkal Center",
      dispatchDate: "2025-11-06",
      farmerName: "T. Rajamouli",
      truckNo: "TS-03-UC-5509",
      paddyType: "Fine Grade (BPT-5204)",
      paddyQtyQtl: 260.00,
      moisturePercent: 16.5,
      gunnyBags: 650,
      mspRatePerQtl: 2340.00,
      officialRemarks: "Gate pass issued online"
    },
    {
      id: "GOVT-LOT-1007",
      transitPass: "TP-2025-8807",
      ppcCenter: "PPC Chennaraopet",
      dispatchDate: "2025-11-07",
      farmerName: "V. Mallesh",
      truckNo: "AP-04-TX-1188",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 220.00,
      moisturePercent: 16.6,
      gunnyBags: 550,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Direct farmer delivery"
    },
    {
      id: "GOVT-LOT-1008",
      transitPass: "TP-2025-8808",
      ppcCenter: "PPC Wardhannapet",
      dispatchDate: "2025-11-07",
      farmerName: "P. Laxman Rao",
      truckNo: "TS-04-TB-9912",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 340.00,
      moisturePercent: 16.9,
      gunnyBags: 850,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Dispatched from warehouse godown"
    }
  ]);

  millRecords = signal<MillGateRecord[]>([
    {
      slipNo: "MILL-WB-501",
      transitPassRef: "TP-2025-8801",
      vehicleRegNo: "TS03UB4491",
      inwardDate: "2025-11-04",
      grossWtKg: 38200,
      tareWtKg: 10200,
      netPaddyQtl: 280.00,
      moisturePercent: 16.5,
      gunnyBags: 700,
      driverName: "Ramulu",
      millerRemarks: "Weighed on digital weighbridge #1. Clean delivery."
    },
    {
      slipNo: "MILL-WB-502",
      transitPassRef: "TP-2025-8802",
      vehicleRegNo: "TS-03-UC-1102",
      inwardDate: "2025-11-04",
      grossWtKg: 42150,
      tareWtKg: 10100,
      netPaddyQtl: 320.50,
      moisturePercent: 17.0,
      gunnyBags: 801,
      driverName: "K. Raju",
      millerRemarks: "BPT-5204 fine paddy stacked in Silo #3."
    },
    {
      slipNo: "MILL-WB-503",
      transitPassRef: "TP-2025-8803",
      vehicleRegNo: "AP-04-TX-9021",
      inwardDate: "2025-11-05",
      grossWtKg: 34500,
      tareWtKg: 10300,
      netPaddyQtl: 242.00,
      moisturePercent: 18.2,
      gunnyBags: 612,
      driverName: "S. Mohan",
      millerRemarks: "High moisture 18.2%. 3.00 Qtl cut applied as per CS norms."
    },
    {
      slipNo: "MILL-WB-504",
      transitPassRef: "TP-2025-8804",
      vehicleRegNo: "TS-04-TA-3390",
      inwardDate: "2025-11-05",
      grossWtKg: 29500,
      tareWtKg: 10000,
      netPaddyQtl: 195.00,
      moisturePercent: 16.8,
      gunnyBags: 488,
      driverName: "Yadagiri",
      millerRemarks: "Physical slip matched gate entry."
    },
    {
      slipNo: "MILL-WB-505",
      transitPassRef: "TP-2025-8805",
      vehicleRegNo: "TS03-UB-7782",
      inwardDate: "2025-11-06",
      grossWtKg: 41200,
      tareWtKg: 10200,
      netPaddyQtl: 310.00,
      moisturePercent: 16.4,
      gunnyBags: 775,
      driverName: "B. Sambaiah",
      millerRemarks: "Common paddy stored in Batch #12."
    },
    {
      slipNo: "MILL-WB-506",
      transitPassRef: "TP-2025-8806",
      vehicleRegNo: "TS-03-UC-5509",
      inwardDate: "2025-11-06",
      grossWtKg: 35850,
      tareWtKg: 10000,
      netPaddyQtl: 258.50,
      moisturePercent: 16.5,
      gunnyBags: 650,
      driverName: "G. Ravi",
      millerRemarks: "Tare weight variation noted on weighbridge."
    },
    {
      slipNo: "MILL-WB-507",
      transitPassRef: "TP-2025-8807",
      vehicleRegNo: "AP-04-TX-1188",
      inwardDate: "2025-11-07",
      grossWtKg: 32000,
      tareWtKg: 10000,
      netPaddyQtl: 220.00,
      moisturePercent: 16.6,
      gunnyBags: 550,
      driverName: "N. Suresh",
      millerRemarks: "Verified with farmer slip."
    },
    {
      slipNo: "MILL-WB-510-UNOFFICIAL",
      transitPassRef: "PENDING-DIRECT",
      vehicleRegNo: "TS-04-TC-8822",
      inwardDate: "2025-11-09",
      grossWtKg: 25000,
      tareWtKg: 9500,
      netPaddyQtl: 155.00,
      moisturePercent: 16.2,
      gunnyBags: 388,
      driverName: "K. Lingaiah",
      millerRemarks: "Direct gate entry by farmer without online transit pass. Held in Quarantine."
    }
  ]);

  cmrDeliveries = signal<CMRDeliveryRecord[]>([
    {
      ackNo: "FCI-ACK-2025-091",
      depotName: "FCI Godown Warangal Road",
      deliveryDate: "2025-11-12",
      riceVariety: "Raw Rice (Common)",
      riceDeliveredQtl: 850.00,
      gunnyDelivered: 1700,
      qcGrade: "Grade A (Moisture 13.8%)",
      status: "ACCEPTED_BY_FCI"
    },
    {
      ackNo: "FCI-ACK-2025-092",
      depotName: "Civil Supplies MLS Point Kazipet",
      deliveryDate: "2025-11-15",
      riceVariety: "Raw Rice (Grade-A)",
      riceDeliveredQtl: 620.00,
      gunnyDelivered: 1240,
      qcGrade: "Grade A (Moisture 13.9%)",
      status: "ACCEPTED_BY_FCI"
    }
  ]);

  resolvedOverrides = signal<{ [key: string]: any }>({});

  auditLogs = signal<AuditLogEntry[]>([
    {
      id: "LOG-1",
      timestamp: "15-Nov-2025 09:30 AM",
      actor: "System Engine",
      role: "AI Core",
      action: "Batch Auto-Reconciliation Executed",
      details: "Matched 5 of 8 procurement lots with 0 variance. 2 moisture/tare variances detected.",
      badgeColor: "emerald"
    },
    {
      id: "LOG-2",
      timestamp: "15-Nov-2025 10:15 AM",
      actor: "S. Murthy (Mill Manager)",
      role: "Mill Operator",
      action: "Dispute Flag Raised for Lot #1003",
      details: "Attached weighbridge moisture meter certificate (18.2%). Requested 3.00 Qtl cut acceptance.",
      badgeColor: "amber"
    }
  ]);

  // Normalize vehicle helper
  normalizeVehicle(v: string): string {
    if (!v) return "";
    return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  // Computed Reconciled Items
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
        const moistureDiff = Number((matchedMill.moisturePercent - govt.moisturePercent).toFixed(1));
        const bagDiff = matchedMill.gunnyBags - govt.gunnyBags;

        let status: ReconciledItem["status"] = "EXACT_MATCH";
        let discrepancyType = "NONE";
        let aiReasoning = "Weighment, truck details, and bag count align within allowable tolerance.";

        const override = overrides[govt.id];

        if (override) {
          status = "RESOLVED";
          discrepancyType = override.type || "RESOLVED_BY_INSPECTOR";
          aiReasoning = `Resolved: ${override.notes || "Approved adjustment with attached evidence."}`;
        } else if (Math.abs(qtyDiff) > 0.05) {
          status = "MISMATCH";
          if (govt.moisturePercent > this.MAX_ALLOWED_MOISTURE || matchedMill.moisturePercent > this.MAX_ALLOWED_MOISTURE) {
            discrepancyType = "MOISTURE_CUT";
            aiReasoning = `Moisture recorded at ${matchedMill.moisturePercent}% (limit ${this.MAX_ALLOWED_MOISTURE}%). Expected moisture cut aligns with ${Math.abs(qtyDiff)} Qtl variance.`;
          } else {
            discrepancyType = "WEIGHBRIDGE_VARIANCE";
            aiReasoning = `Tare weight variation of ${Math.abs(qtyDiff)} Qtl between Mandi scale and Mill weighbridge.`;
          }
        } else if (Math.abs(bagDiff) > 0) {
          status = "MISMATCH";
          discrepancyType = "BAG_COUNT_DIFF";
          aiReasoning = `Variance of ${Math.abs(bagDiff)} gunny bags between dispatch pass and inward slip.`;
        }

        const finalQty = override ? override.agreedQty : (status === "EXACT_MATCH" ? govt.paddyQtyQtl : matchedMill.netPaddyQtl);

        results.push({
          id: govt.id,
          govtRecord: govt,
          millRecord: matchedMill,
          status,
          discrepancyType,
          qtyDiff,
          moistureDiff,
          bagDiff,
          aiReasoning,
          finalReconciledQty: finalQty,
          resolutionDetails: override || null,
          sourceCategory: "MATCHED_PAIR"
        });
      } else {
        const override = overrides[govt.id];
        results.push({
          id: govt.id,
          govtRecord: govt,
          millRecord: null,
          status: override ? "RESOLVED" : "MISSING_IN_MILL",
          discrepancyType: "MISSING_GATE_INWARD",
          qtyDiff: -govt.paddyQtyQtl,
          moistureDiff: 0,
          bagDiff: -govt.gunnyBags,
          aiReasoning: "Transit Pass issued online by Mandi official, but no inward entry recorded in Mill register.",
          finalReconciledQty: override ? override.agreedQty : 0,
          resolutionDetails: override || null,
          sourceCategory: "GOVT_ONLY"
        });
      }
    });

    mills.forEach((mill) => {
      if (unmatchedMillSet.has(mill.slipNo)) {
        const override = overrides[mill.slipNo];
        results.push({
          id: mill.slipNo,
          govtRecord: null,
          millRecord: mill,
          status: override ? "RESOLVED" : "MISSING_IN_GOVT",
          discrepancyType: "UNAUTHORIZED_OR_PENDING_PASS",
          qtyDiff: mill.netPaddyQtl,
          moistureDiff: 0,
          bagDiff: mill.gunnyBags,
          aiReasoning: "Weighbridge slip generated at Mill gate without corresponding Department Transit Pass.",
          finalReconciledQty: override ? override.agreedQty : mill.netPaddyQtl,
          resolutionDetails: override || null,
          sourceCategory: "MILL_ONLY"
        });
      }
    });

    return results;
  });

  // Computed Settlement Summary
  settlementSummary = computed<SettlementSummary>(() => {
    const items = this.reconciledItems();
    const deliveries = this.cmrDeliveries();

    const totalGovtPaddyQtl = items.reduce((acc, i) => acc + (i.govtRecord ? i.govtRecord.paddyQtyQtl : 0), 0);
    const totalMillPaddyQtl = items.reduce((acc, i) => acc + (i.millRecord ? i.millRecord.netPaddyQtl : 0), 0);
    const totalReconciledPaddyQtl = items.reduce((acc, i) => acc + (i.finalReconciledQty || 0), 0);

    const matchedCount = items.filter((i) => i.status === "EXACT_MATCH" || i.status === "RESOLVED").length;
    const mismatchCount = items.filter((i) => i.status === "MISMATCH").length;
    const missingInMillCount = items.filter((i) => i.status === "MISSING_IN_MILL").length;
    const missingInGovtCount = items.filter((i) => i.status === "MISSING_IN_GOVT").length;

    const targetRiceRequiredQtl = Number((totalReconciledPaddyQtl * this.RAW_RICE_OTR).toFixed(2));
    const totalRiceDeliveredQtl = deliveries.reduce((acc, d) => acc + d.riceDeliveredQtl, 0);
    const pendingRiceDeliveryQtl = Math.max(0, Number((targetRiceRequiredQtl - totalRiceDeliveredQtl).toFixed(2)));

    const millingChargesPayable = totalReconciledPaddyQtl * this.MILLING_CHARGES_PER_QTL;
    const handlingChargesPayable = totalReconciledPaddyQtl * this.HANDLING_CHARGES_PER_QTL;
    
    const totalBags = items.reduce((acc, i) => acc + (i.millRecord ? i.millRecord.gunnyBags : (i.govtRecord ? i.govtRecord.gunnyBags : 0)), 0);
    const gunnyDepreciationCredit = totalBags * this.GUNNY_DEPRECIATION_RATE;

    const grossPayableAmount = millingChargesPayable + handlingChargesPayable + gunnyDepreciationCredit;
    const hasUnresolvedIssues = mismatchCount > 0 || missingInMillCount > 0;
    const netApprovedAmount = hasUnresolvedIssues ? grossPayableAmount * 0.85 : grossPayableAmount;

    return {
      totalGovtPaddyQtl,
      totalMillPaddyQtl,
      totalReconciledPaddyQtl,
      matchedCount,
      mismatchCount,
      missingInMillCount,
      missingInGovtCount,
      totalLots: items.length,
      matchPercentage: items.length ? ((matchedCount / items.length) * 100).toFixed(1) : "0",

      targetRiceRequiredQtl,
      totalRiceDeliveredQtl,
      pendingRiceDeliveryQtl,
      otrCompliancePercent: targetRiceRequiredQtl > 0 ? Math.min(100, (totalRiceDeliveredQtl / targetRiceRequiredQtl) * 100).toFixed(1) : "0",

      millingChargesPayable,
      handlingChargesPayable,
      gunnyDepreciationCredit,
      grossPayableAmount,
      netApprovedAmount,
      withheldAmount: grossPayableAmount - netApprovedAmount
    };
  });

  // Resolve Discrepancy Action
  resolveDiscrepancy(itemId: string, agreedQty: number, notes: string, userRole: string) {
    const current = this.resolvedOverrides();
    this.resolvedOverrides.set({
      ...current,
      [itemId]: {
        agreedQty,
        resolvedBy: userRole,
        notes,
        timestamp: new Date().toLocaleString("en-IN")
      }
    });

    // Add Audit Log
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString("en-IN"),
      actor: userRole === "GOVT_OFFICER" ? "R. Kumar (CS Inspector)" : "S. Murthy (Mill Manager)",
      role: userRole === "GOVT_OFFICER" ? "Govt Civil Supplies" : "Mill Operator",
      action: `Resolved Lot #${itemId} with Agreed Qty ${agreedQty} Qtl`,
      details: notes,
      badgeColor: "teal"
    };
    this.auditLogs.update((prev) => [newLog, ...prev]);
  }

  // Simulate OCR scan
  scanHandwrittenRegister(): string {
    const newSlip: MillGateRecord = {
      slipNo: "MILL-OCR-808",
      transitPassRef: "TP-2025-8808",
      vehicleRegNo: "TS-04-TB-9912",
      inwardDate: "2025-11-07",
      grossWtKg: 44000,
      tareWtKg: 10000,
      netPaddyQtl: 340.00,
      moisturePercent: 16.9,
      gunnyBags: 850,
      driverName: "P. Laxman Rao",
      millerRemarks: "Digitized via AI Vision OCR from Physical Notebook Slip #808."
    };

    this.millRecords.update((prev) => [newSlip, ...prev]);

    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString("en-IN"),
      actor: "AI Vision Scanner",
      role: "System OCR",
      action: "Digitized Physical Register Entry (Lot TS-04-TB-9912)",
      details: "Extracted Net Weight 340.00 Qtl, Tare Wt 10000 kg from handwritten weigh slip.",
      badgeColor: "cyan"
    };
    this.auditLogs.update((prev) => [newLog, ...prev]);

    return "Successfully digitized Lot TS-04-TB-9912 (340.00 Qtl) from physical register page!";
  }

  // Reset to default data
  resetDemoData() {
    this.resolvedOverrides.set({});
  }
}
