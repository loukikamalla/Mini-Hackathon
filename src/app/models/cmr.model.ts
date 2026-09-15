export interface GovtLotRecord {
  id: string;
  transitPass: string;
  ppcCenter: string;
  dispatchDate: string;
  farmerName: string;
  truckNo: string;
  paddyType: string;
  paddyQtyQtl: number;
  moisturePercent: number;
  gunnyBags: number;
  mspRatePerQtl: number;
  officialRemarks: string;
}

export interface MillGateRecord {
  slipNo: string;
  transitPassRef: string;
  vehicleRegNo: string;
  inwardDate: string;
  grossWtKg: number;
  tareWtKg: number;
  netPaddyQtl: number;
  moisturePercent: number;
  gunnyBags: number;
  driverName: string;
  millerRemarks: string;
}

export interface CMRDeliveryRecord {
  ackNo: string;
  depotName: string;
  deliveryDate: string;
  riceVariety: string;
  riceDeliveredQtl: number;
  gunnyDelivered: number;
  qcGrade: string;
  status: string;
}

export interface ReconciledItem {
  id: string;
  govtRecord: GovtLotRecord | null;
  millRecord: MillGateRecord | null;
  status: "EXACT_MATCH" | "MISMATCH" | "MISSING_IN_MILL" | "MISSING_IN_GOVT" | "RESOLVED";
  discrepancyType: string;
  qtyDiff: number;
  moistureDiff: number;
  bagDiff: number;
  aiReasoning: string;
  finalReconciledQty: number;
  resolutionDetails?: {
    agreedQty: number;
    resolvedBy: string;
    notes: string;
    timestamp: string;
  } | null;
  sourceCategory: "MATCHED_PAIR" | "GOVT_ONLY" | "MILL_ONLY";
}

export interface SettlementSummary {
  totalGovtPaddyQtl: number;
  totalMillPaddyQtl: number;
  totalReconciledPaddyQtl: number;
  matchedCount: number;
  mismatchCount: number;
  missingInMillCount: number;
  missingInGovtCount: number;
  totalLots: number;
  matchPercentage: string;
  
  targetRiceRequiredQtl: number;
  totalRiceDeliveredQtl: number;
  pendingRiceDeliveryQtl: number;
  otrCompliancePercent: string;

  millingChargesPayable: number;
  handlingChargesPayable: number;
  gunnyDepreciationCredit: number;
  grossPayableAmount: number;
  netApprovedAmount: number;
  withheldAmount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
  badgeColor: string;
}
