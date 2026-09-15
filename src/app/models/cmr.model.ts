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
  farmerName?: string;
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
  farmerName: string;
  govtRecord: GovtLotRecord | null;
  millRecord: MillGateRecord | null;
  govtQty: number;
  millQty: number;
  qtyDiff: number;
  status: "Match" | "Mismatch" | "Missing In Mill" | "Missing In Govt";
  discrepancyType: string;
  aiReasoning: string;
  finalReconciledQty: number;
  resolutionDetails?: {
    agreedQty: number;
    resolvedBy: string;
    notes: string;
    timestamp: string;
  } | null;
}

export interface SettlementSummary {
  totalPaddyQtl: number;
  totalRiceQtl: number;
  totalDeliveredRiceQtl: number;
  totalPendingRiceQtl: number;
  totalPayableAmount: number;
  millingCharges: number;
  handlingCharges: number;
  gunnyCredit: number;
  matchedCount: number;
  mismatchCount: number;
  totalLots: number;
  matchPercentage: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED";
  approvalRemarks: string;
  approvedBy: string;
  approvedAt: string;
}

export interface AuditLogEntry {
  id: string;
  dateStr: string;
  changeDescription: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  role: string;
  category: "QUANTITY" | "APPROVAL" | "UPLOAD" | "DISPUTE";
}

export interface FarmerLoadRecord {
  loadId: string;
  transitPass: string;
  dispatchDate: string;
  ppcCenter: string;
  truckNo: string;
  paddyType: string;
  dispatchedQtyQtl: number;
  millWeighedQtyQtl: number;
  moisturePercent: number;
  mspRatePerQtl: number;
  totalMspAmount: number;
  loadStatus: "WEIGHED_MATCHED" | "DISPUTE_ADJUSTED" | "IN_TRANSIT" | "UNREGISTERED";
  dbtPaymentStatus: "PAID" | "PROCESSING" | "PENDING_RECONCILIATION";
  pfmsTxnRef?: string;
  paymentDisbursedDate?: string;
}

export interface FarmerProfile {
  farmerId: string;
  farmerName: string;
  fatherHusbandName: string;
  aadhaarMasked: string;
  pattaPassbookNo: string;
  mobile: string;
  village: string;
  mandal: string;
  district: string;
  bankName: string;
  accountNoMasked: string;
  ifscCode: string;
  totalLoadsDelivered: number;
  totalPaddyQtyQtl: number;
  totalMspGrossAmount: number;
  subsidiesApprovedAmount: number;
  subsidiesInProcessAmount: number;
  pendingPaymentAmount: number;
  overallDbtStatus: "COMPLETED" | "PARTIAL_PROCESSED" | "ON_HOLD";
  loads: FarmerLoadRecord[];
}

export interface FarmerNotification {
  id: string;
  farmerName: string;
  mobile: string;
  transitPass: string;
  quantityQtl: number;
  mspAmount: number;
  bankAccountMasked: string;
  bankName: string;
  pfmsTxnRef: string;
  sentTimestamp: string;
  status: "DELIVERED_SMS" | "DISPATCHING";
  messageText: string;
}
