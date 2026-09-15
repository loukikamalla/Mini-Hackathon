import { Injectable, signal, computed } from "@angular/core";
import { 
  GovtLotRecord, 
  MillGateRecord, 
  CMRDeliveryRecord, 
  ReconciledItem, 
  SettlementSummary, 
  AuditLogEntry,
  FarmerProfile,
  FarmerNotification,
  FarmerLoadRecord
} from "../models/cmr.model";

export interface MillDataset {
  millId: string;
  millName: string;
  location: string;
  govtLots: GovtLotRecord[];
  millSlips: MillGateRecord[];
  cmrDeliveries: CMRDeliveryRecord[];
  farmerProfiles: FarmerProfile[];
}

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
  lastApiSyncTime = signal<string>("Just now (Live Feed)");
  syncCount = signal<number>(1);
  activeMillId = signal<string>("TS-WGL-MR-4412");

  // =========================================================================
  // 1. UNIQUE DATASET PER RICE MILL INDUSTRY
  // =========================================================================
  private readonly millDatabases: Record<string, MillDataset> = {
    // -----------------------------------------------------------------------
    // MILL 1: SRI LAKSHMI RICE INDUSTRIES (Narsampet Road, Warangal Urban)
    // -----------------------------------------------------------------------
    "TS-WGL-MR-4412": {
      millId: "TS-WGL-MR-4412",
      millName: "Sri Lakshmi Rice Industries",
      location: "Narsampet Road, Warangal Urban",
      govtLots: [
        { id: "GOVT-LOT-1001", transitPass: "TP-2025-8801", ppcCenter: "PPC Narsampet Mandi (#401)", dispatchDate: "2025-11-04", farmerName: "Ramesh (B. Venkanna)", truckNo: "TS-03-UB-4491", paddyType: "Common Grade-A", paddyQtyQtl: 1000.00, moisturePercent: 16.5, gunnyBags: 2500, mspRatePerQtl: 2320.00, officialRemarks: "Electronic gate pass verified" },
        { id: "GOVT-LOT-1002", transitPass: "TP-2025-8802", ppcCenter: "PPC Parkal Center (#402)", dispatchDate: "2025-11-04", farmerName: "Suresh (K. Rameshwara)", truckNo: "TS-03-UC-1102", paddyType: "Fine Grade (BPT-5204)", paddyQtyQtl: 1500.00, moisturePercent: 17.0, gunnyBags: 3750, mspRatePerQtl: 2340.00, officialRemarks: "Passed PPC quality grading" },
        { id: "GOVT-LOT-1025", transitPass: "TP-2025-8825", ppcCenter: "PPC Narsampet Mandi (#401)", dispatchDate: "2025-11-05", farmerName: "M. Thirupathi", truckNo: "AP-04-TX-9021", paddyType: "Common Grade-A", paddyQtyQtl: 1000.00, moisturePercent: 18.2, gunnyBags: 2500, mspRatePerQtl: 2320.00, officialRemarks: "Moisture 18.2% flagged at PPC" },
        { id: "GOVT-LOT-1006", transitPass: "TP-2025-8806", ppcCenter: "PPC Narsampet Mandi (#401)", dispatchDate: "2025-11-06", farmerName: "K. Venkatesh", truckNo: "TS-03-UC-5509", paddyType: "Common Grade-A", paddyQtyQtl: 650.00, moisturePercent: 16.5, gunnyBags: 1625, mspRatePerQtl: 2320.00, officialRemarks: "OPMS Gate dispatch confirmed" },
        { id: "GOVT-LOT-1007", transitPass: "TP-2025-8807", ppcCenter: "PPC Parkal Center (#402)", dispatchDate: "2025-11-07", farmerName: "P. Laxman Rao", truckNo: "TS-03-UB-8812", paddyType: "Common Grade-A", paddyQtyQtl: 900.00, moisturePercent: 16.9, gunnyBags: 2250, mspRatePerQtl: 2320.00, officialRemarks: "Transit pass issued, pending scale inward" },
        { id: "GOVT-LOT-1008", transitPass: "TP-2025-8808", ppcCenter: "PPC Narsampet Mandi (#401)", dispatchDate: "2025-11-07", farmerName: "V. Narsimha", truckNo: "TS-03-UB-9910", paddyType: "Common Grade-A", paddyQtyQtl: 1300.00, moisturePercent: 16.2, gunnyBags: 3250, mspRatePerQtl: 2320.00, officialRemarks: "Direct electronic dispatch" }
      ],
      millSlips: [
        { slipNo: "MILL-WB-501", transitPassRef: "TP-2025-8801", vehicleRegNo: "TS-03-UB-4491", inwardDate: "2025-11-04", farmerName: "Ramesh (B. Venkanna)", grossWtKg: 42500, tareWtKg: 12500, netPaddyQtl: 1000.00, moisturePercent: 16.5, gunnyBags: 2500, driverName: "S. Raju", millerRemarks: "Exact weight match." },
        { slipNo: "MILL-WB-502", transitPassRef: "TP-2025-8802", vehicleRegNo: "TS-03-UC-1102", inwardDate: "2025-11-04", farmerName: "Suresh (K. Rameshwara)", grossWtKg: 58500, tareWtKg: 15000, netPaddyQtl: 1450.00, moisturePercent: 17.0, gunnyBags: 3750, driverName: "M. Satyam", millerRemarks: "50 Qtl tare calibration variance." },
        { slipNo: "MILL-WB-525", transitPassRef: "TP-2025-8825", vehicleRegNo: "AP-04-TX-9021", inwardDate: "2025-11-05", farmerName: "M. Thirupathi", grossWtKg: 41000, tareWtKg: 12500, netPaddyQtl: 950.00, moisturePercent: 18.2, gunnyBags: 2500, driverName: "K. Mohan", millerRemarks: "High moisture 18.2%. 50 Qtl cut deducted." },
        { slipNo: "MILL-WB-506", transitPassRef: "TP-2025-8806", vehicleRegNo: "TS-03-UC-5509", inwardDate: "2025-11-06", farmerName: "K. Venkatesh", grossWtKg: 28000, tareWtKg: 8500, netPaddyQtl: 650.00, moisturePercent: 16.5, gunnyBags: 1625, driverName: "P. Ganesh", millerRemarks: "Scale slip entered at gate." },
        { slipNo: "MILL-WB-508", transitPassRef: "TP-2025-8808", vehicleRegNo: "TS-03-UB-9910", inwardDate: "2025-11-07", farmerName: "V. Narsimha", grossWtKg: 52000, tareWtKg: 13000, netPaddyQtl: 1300.00, moisturePercent: 16.2, gunnyBags: 3250, driverName: "K. Ravi", millerRemarks: "Weighed and verified." },
        { slipNo: "MILL-WB-599-UNREG", transitPassRef: "UNREG-NO-TP", vehicleRegNo: "TS-03-UD-9999", inwardDate: "2025-11-07", farmerName: "K. Lingaiah", grossWtKg: 18000, tareWtKg: 6000, netPaddyQtl: 300.00, moisturePercent: 17.5, gunnyBags: 750, driverName: "G. Mahesh", millerRemarks: "Emergency offload without Mandi pass." }
      ],
      cmrDeliveries: [
        { ackNo: "FCI-CMR-ACK-901", depotName: "Civil Supplies MLS Point Depot #12, Warangal", deliveryDate: "2025-11-08", riceVariety: "Raw Rice Grade-A (FAQ)", riceDeliveredQtl: 1500.00, gunnyDelivered: 3000, qcGrade: "FAQ Grade A (Passed 100%)", status: "VERIFIED_ACCEPTED" },
        { ackNo: "FCI-CMR-ACK-902", depotName: "State Warehousing Corp Depot #04, Narsampet", deliveryDate: "2025-11-10", riceVariety: "Raw Rice Grade-A (FAQ)", riceDeliveredQtl: 1550.00, gunnyDelivered: 3100, qcGrade: "FAQ Grade A (Passed 100%)", status: "VERIFIED_ACCEPTED" }
      ],
      farmerProfiles: [
        {
          farmerId: "TS-PPC-F-882190", farmerName: "Ramesh (B. Venkanna)", fatherHusbandName: "B. Venkanna", aadhaarMasked: "XXXX-XXXX-4812", pattaPassbookNo: "T2908004128", mobile: "+91 98480 11234", village: "Maheshwaram", mandal: "Narsampet", district: "Warangal Rural", bankName: "State Bank of India", accountNoMasked: "XXXXXX8890", ifscCode: "SBIN0020188", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1000.00, totalMspGrossAmount: 2320000.00, subsidiesApprovedAmount: 2320000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-8801", dispatchDate: "2025-11-04", ppcCenter: "PPC Narsampet (#401)", truckNo: "TS-03-UB-4491", paddyType: "Common Grade-A", dispatchedQtyQtl: 1000.00, millWeighedQtyQtl: 1000.00, moisturePercent: 16.5, mspRatePerQtl: 2320.00, totalMspAmount: 2320000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-899120", paymentDisbursedDate: "2025-11-06" }]
        },
        {
          farmerId: "TS-PPC-F-882191", farmerName: "Suresh (K. Rameshwara)", fatherHusbandName: "K. Rameshwara", aadhaarMasked: "XXXX-XXXX-9934", pattaPassbookNo: "T2908005519", mobile: "+91 94401 22890", village: "Kistampet", mandal: "Parkal", district: "Warangal Rural", bankName: "Union Bank of India", accountNoMasked: "XXXXXX4419", ifscCode: "UBIN0544190", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1450.00, totalMspGrossAmount: 3393000.00, subsidiesApprovedAmount: 3393000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-8802", dispatchDate: "2025-11-04", ppcCenter: "PPC Parkal (#402)", truckNo: "TS-03-UC-1102", paddyType: "Fine Grade (BPT-5204)", dispatchedQtyQtl: 1500.00, millWeighedQtyQtl: 1450.00, moisturePercent: 17.0, mspRatePerQtl: 2340.00, totalMspAmount: 3393000.00, loadStatus: "DISPUTE_ADJUSTED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-992104", paymentDisbursedDate: "2025-11-07" }]
        },
        {
          farmerId: "TS-PPC-F-882192", farmerName: "M. Thirupathi", fatherHusbandName: "M. Ramulu", aadhaarMasked: "XXXX-XXXX-6671", pattaPassbookNo: "T2908007781", mobile: "+91 97011 55667", village: "Dharmaraopet", mandal: "Narsampet", district: "Warangal Rural", bankName: "Telangana Grameena Bank", accountNoMasked: "XXXXXX1104", ifscCode: "TGB0001104", totalLoadsDelivered: 1, totalPaddyQtyQtl: 950.00, totalMspGrossAmount: 2204000.00, subsidiesApprovedAmount: 2204000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-8825", dispatchDate: "2025-11-05", ppcCenter: "PPC Narsampet (#401)", truckNo: "AP-04-TX-9021", paddyType: "Common Grade-A", dispatchedQtyQtl: 1000.00, millWeighedQtyQtl: 950.00, moisturePercent: 18.2, mspRatePerQtl: 2320.00, totalMspAmount: 2204000.00, loadStatus: "DISPUTE_ADJUSTED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-INPR-881", paymentDisbursedDate: "2025-11-08" }]
        },
        {
          farmerId: "TS-PPC-F-882195", farmerName: "K. Venkatesh", fatherHusbandName: "K. Satyanarayana", aadhaarMasked: "XXXX-XXXX-1150", pattaPassbookNo: "T2908006629", mobile: "+91 93902 33441", village: "Kammarpally", mandal: "Narsampet", district: "Warangal Rural", bankName: "AP Grameena Vikas Bank", accountNoMasked: "XXXXXX3390", ifscCode: "APGV0004109", totalLoadsDelivered: 1, totalPaddyQtyQtl: 650.00, totalMspGrossAmount: 1508000.00, subsidiesApprovedAmount: 1508000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-8806", dispatchDate: "2025-11-06", ppcCenter: "PPC Narsampet (#401)", truckNo: "TS-03-UC-5509", paddyType: "Common Grade-A", dispatchedQtyQtl: 650.00, millWeighedQtyQtl: 650.00, moisturePercent: 16.5, mspRatePerQtl: 2320.00, totalMspAmount: 1508000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-994411", paymentDisbursedDate: "2025-11-09" }]
        },
        {
          farmerId: "TS-PPC-F-882196", farmerName: "P. Laxman Rao", fatherHusbandName: "P. Veerabhadram", aadhaarMasked: "XXXX-XXXX-8840", pattaPassbookNo: "T2908001190", mobile: "+91 99490 88771", village: "Shayampet", mandal: "Parkal", district: "Warangal Rural", bankName: "HDFC Bank", accountNoMasked: "XXXXXX9901", ifscCode: "HDFC0001920", totalLoadsDelivered: 1, totalPaddyQtyQtl: 900.00, totalMspGrossAmount: 2088000.00, subsidiesApprovedAmount: 0, subsidiesInProcessAmount: 0, pendingPaymentAmount: 2088000.00, overallDbtStatus: "ON_HOLD",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-8807", dispatchDate: "2025-11-07", ppcCenter: "PPC Parkal (#402)", truckNo: "TS-03-UB-8812", paddyType: "Common Grade-A", dispatchedQtyQtl: 900.00, millWeighedQtyQtl: 0, moisturePercent: 16.9, mspRatePerQtl: 2320.00, totalMspAmount: 2088000.00, loadStatus: "IN_TRANSIT", dbtPaymentStatus: "PENDING_RECONCILIATION", pfmsTxnRef: "AWAITING_SCALE", paymentDisbursedDate: "Awaiting Gate Weighment" }]
        },
        {
          farmerId: "TS-PPC-F-882197", farmerName: "K. Lingaiah", fatherHusbandName: "K. Mallesh", aadhaarMasked: "XXXX-XXXX-5521", pattaPassbookNo: "T2908008832", mobile: "+91 91210 44990", village: "Duggondi", mandal: "Narsampet", district: "Warangal Rural", bankName: "State Bank of India", accountNoMasked: "XXXXXX4481", ifscCode: "SBIN0020188", totalLoadsDelivered: 1, totalPaddyQtyQtl: 300.00, totalMspGrossAmount: 696000.00, subsidiesApprovedAmount: 0, subsidiesInProcessAmount: 696000.00, pendingPaymentAmount: 0, overallDbtStatus: "PARTIAL_PROCESSED",
          loads: [{ loadId: "LOAD-01", transitPass: "UNREG-NO-TP", dispatchDate: "2025-11-07", ppcCenter: "Direct Mill Gate", truckNo: "TS-03-UD-9999", paddyType: "Common Grade-A", dispatchedQtyQtl: 0, millWeighedQtyQtl: 300.00, moisturePercent: 17.5, mspRatePerQtl: 2320.00, totalMspAmount: 696000.00, loadStatus: "UNREGISTERED", dbtPaymentStatus: "PROCESSING", pfmsTxnRef: "AWAIT_AUTH", paymentDisbursedDate: "Awaiting Transit Authorization" }]
        },
        {
          farmerId: "TS-PPC-F-882198", farmerName: "V. Narsimha", fatherHusbandName: "V. Lingaiah", aadhaarMasked: "XXXX-XXXX-3312", pattaPassbookNo: "T2908002290", mobile: "+91 98491 55667", village: "Nallabelli", mandal: "Narsampet", district: "Warangal Rural", bankName: "Canara Bank", accountNoMasked: "XXXXXX9012", ifscCode: "CNRB0002290", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1300.00, totalMspGrossAmount: 3016000.00, subsidiesApprovedAmount: 3016000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-8808", dispatchDate: "2025-11-07", ppcCenter: "PPC Narsampet (#401)", truckNo: "TS-03-UB-9910", paddyType: "Common Grade-A", dispatchedQtyQtl: 1300.00, millWeighedQtyQtl: 1300.00, moisturePercent: 16.2, mspRatePerQtl: 2320.00, totalMspAmount: 3016000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-998844", paymentDisbursedDate: "2025-11-09" }]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // MILL 2: KAKATIYA MODERN AGRO MILLS (Parkal Highway, Warangal Rural)
    // -----------------------------------------------------------------------
    "TS-WGL-MR-1108": {
      millId: "TS-WGL-MR-1108",
      millName: "Kakatiya Modern Agro Mills",
      location: "Parkal Highway, Warangal Rural",
      govtLots: [
        { id: "GOVT-LOT-2001", transitPass: "TP-2025-9101", ppcCenter: "PPC Parkal Mandi (#402)", dispatchDate: "2025-11-03", farmerName: "B. Sudhakar Rao", truckNo: "TS-03-TA-1122", paddyType: "Fine Grade (BPT-5204)", paddyQtyQtl: 1200.00, moisturePercent: 16.0, gunnyBags: 3000, mspRatePerQtl: 2340.00, officialRemarks: "Passed 100% electronic QC" },
        { id: "GOVT-LOT-2002", transitPass: "TP-2025-9102", ppcCenter: "PPC Atmakur Center (#406)", dispatchDate: "2025-11-04", farmerName: "V. Malleshwar", truckNo: "TS-03-TA-3344", paddyType: "Common Grade-A", paddyQtyQtl: 1000.00, moisturePercent: 16.4, gunnyBags: 2500, mspRatePerQtl: 2320.00, officialRemarks: "Electronic gate pass issued" },
        { id: "GOVT-LOT-2003", transitPass: "TP-2025-9103", ppcCenter: "PPC Parkal Mandi (#402)", dispatchDate: "2025-11-04", farmerName: "T. Komaraiah", truckNo: "TS-03-TA-5566", paddyType: "Common Grade-A", paddyQtyQtl: 800.00, moisturePercent: 15.8, gunnyBags: 2000, mspRatePerQtl: 2320.00, officialRemarks: "Passed PPC weighbridge" },
        { id: "GOVT-LOT-2004", transitPass: "TP-2025-9104", ppcCenter: "PPC Atmakur Center (#406)", dispatchDate: "2025-11-05", farmerName: "P. Lakshmi Narayana", truckNo: "TS-03-TA-7788", paddyType: "Common Grade-A", paddyQtyQtl: 1000.00, moisturePercent: 16.2, gunnyBags: 2500, mspRatePerQtl: 2320.00, officialRemarks: "Direct gate transit pass" },
        { id: "GOVT-LOT-2005", transitPass: "TP-2025-9105", ppcCenter: "PPC Parkal Mandi (#402)", dispatchDate: "2025-11-06", farmerName: "K. Prabhakar", truckNo: "TS-03-TA-9900", paddyType: "Common Grade-A", paddyQtyQtl: 800.00, moisturePercent: 16.1, gunnyBags: 2000, mspRatePerQtl: 2320.00, officialRemarks: "Weighment synchronized" }
      ],
      millSlips: [
        { slipNo: "MILL-KM-101", transitPassRef: "TP-2025-9101", vehicleRegNo: "TS-03-TA-1122", inwardDate: "2025-11-03", farmerName: "B. Sudhakar Rao", grossWtKg: 50000, tareWtKg: 14000, netPaddyQtl: 1200.00, moisturePercent: 16.0, gunnyBags: 3000, driverName: "G. Srinivas", millerRemarks: "Exact 100% weight match." },
        { slipNo: "MILL-KM-102", transitPassRef: "TP-2025-9102", vehicleRegNo: "TS-03-TA-3344", inwardDate: "2025-11-04", farmerName: "V. Malleshwar", grossWtKg: 42000, tareWtKg: 12000, netPaddyQtl: 1000.00, moisturePercent: 16.4, gunnyBags: 2500, driverName: "B. Raju", millerRemarks: "Exact weight match." },
        { slipNo: "MILL-KM-103", transitPassRef: "TP-2025-9103", vehicleRegNo: "TS-03-TA-5566", inwardDate: "2025-11-04", farmerName: "T. Komaraiah", grossWtKg: 34000, tareWtKg: 10000, netPaddyQtl: 800.00, moisturePercent: 15.8, gunnyBags: 2000, driverName: "M. Kumar", millerRemarks: "Verified and accepted." },
        { slipNo: "MILL-KM-104", transitPassRef: "TP-2025-9104", vehicleRegNo: "TS-03-TA-7788", inwardDate: "2025-11-05", farmerName: "P. Lakshmi Narayana", grossWtKg: 42000, tareWtKg: 12000, netPaddyQtl: 1000.00, moisturePercent: 16.2, gunnyBags: 2500, driverName: "D. Sammaiah", millerRemarks: "Verified and matched." },
        { slipNo: "MILL-KM-105", transitPassRef: "TP-2025-9105", vehicleRegNo: "TS-03-TA-9900", inwardDate: "2025-11-06", farmerName: "K. Prabhakar", grossWtKg: 34000, tareWtKg: 10000, netPaddyQtl: 800.00, moisturePercent: 16.1, gunnyBags: 2000, driverName: "S. Mogili", millerRemarks: "Exact weight match." }
      ],
      cmrDeliveries: [
        { ackNo: "FCI-KM-ACK-401", depotName: "Central Warehousing Corp Depot #01, Parkal", deliveryDate: "2025-11-07", riceVariety: "Raw Rice Grade-A (FAQ)", riceDeliveredQtl: 1800.00, gunnyDelivered: 3600, qcGrade: "FAQ Grade A (Passed 100%)", status: "VERIFIED_ACCEPTED" },
        { ackNo: "FCI-KM-ACK-402", depotName: "Civil Supplies MLS Point Depot #12, Warangal", deliveryDate: "2025-11-09", riceVariety: "Raw Rice Grade-A (FAQ)", riceDeliveredQtl: 1416.00, gunnyDelivered: 2832, qcGrade: "FAQ Grade A (Passed 100%)", status: "VERIFIED_ACCEPTED" }
      ],
      farmerProfiles: [
        {
          farmerId: "TS-PPC-F-771101", farmerName: "B. Sudhakar Rao", fatherHusbandName: "B. Mohan Rao", aadhaarMasked: "XXXX-XXXX-1144", pattaPassbookNo: "T2908008811", mobile: "+91 94405 66778", village: "Geesugonda", mandal: "Parkal", district: "Warangal Rural", bankName: "State Bank of India", accountNoMasked: "XXXXXX2211", ifscCode: "SBIN0020119", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1200.00, totalMspGrossAmount: 2808000.00, subsidiesApprovedAmount: 2808000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9101", dispatchDate: "2025-11-03", ppcCenter: "PPC Parkal (#402)", truckNo: "TS-03-TA-1122", paddyType: "Fine Grade (BPT-5204)", dispatchedQtyQtl: 1200.00, millWeighedQtyQtl: 1200.00, moisturePercent: 16.0, mspRatePerQtl: 2340.00, totalMspAmount: 2808000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-771101", paymentDisbursedDate: "2025-11-05" }]
        },
        {
          farmerId: "TS-PPC-F-771102", farmerName: "V. Malleshwar", fatherHusbandName: "V. Shankaraiah", aadhaarMasked: "XXXX-XXXX-2255", pattaPassbookNo: "T2908009922", mobile: "+91 98492 33445", village: "Atmakur", mandal: "Atmakur", district: "Warangal Rural", bankName: "Andhra Pradesh Grameena Vikas Bank", accountNoMasked: "XXXXXX3322", ifscCode: "APGV0004108", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1000.00, totalMspGrossAmount: 2320000.00, subsidiesApprovedAmount: 2320000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9102", dispatchDate: "2025-11-04", ppcCenter: "PPC Atmakur (#406)", truckNo: "TS-03-TA-3344", paddyType: "Common Grade-A", dispatchedQtyQtl: 1000.00, millWeighedQtyQtl: 1000.00, moisturePercent: 16.4, mspRatePerQtl: 2320.00, totalMspAmount: 2320000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-771102", paymentDisbursedDate: "2025-11-06" }]
        },
        {
          farmerId: "TS-PPC-F-771103", farmerName: "T. Komaraiah", fatherHusbandName: "T. Yellaiah", aadhaarMasked: "XXXX-XXXX-3366", pattaPassbookNo: "T2908001133", mobile: "+91 97014 55667", village: "Kistampet", mandal: "Parkal", district: "Warangal Rural", bankName: "Union Bank of India", accountNoMasked: "XXXXXX4433", ifscCode: "UBIN0544190", totalLoadsDelivered: 1, totalPaddyQtyQtl: 800.00, totalMspGrossAmount: 1856000.00, subsidiesApprovedAmount: 1856000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9103", dispatchDate: "2025-11-04", ppcCenter: "PPC Parkal (#402)", truckNo: "TS-03-TA-5566", paddyType: "Common Grade-A", dispatchedQtyQtl: 800.00, millWeighedQtyQtl: 800.00, moisturePercent: 15.8, mspRatePerQtl: 2320.00, totalMspAmount: 1856000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-771103", paymentDisbursedDate: "2025-11-06" }]
        },
        {
          farmerId: "TS-PPC-F-771104", farmerName: "P. Lakshmi Narayana", fatherHusbandName: "P. Narayana", aadhaarMasked: "XXXX-XXXX-4477", pattaPassbookNo: "T2908002244", mobile: "+91 99893 22110", village: "Neerukulla", mandal: "Atmakur", district: "Warangal Rural", bankName: "State Bank of India", accountNoMasked: "XXXXXX5544", ifscCode: "SBIN0020119", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1000.00, totalMspGrossAmount: 2320000.00, subsidiesApprovedAmount: 2320000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9104", dispatchDate: "2025-11-05", ppcCenter: "PPC Atmakur (#406)", truckNo: "TS-03-TA-7788", paddyType: "Common Grade-A", dispatchedQtyQtl: 1000.00, millWeighedQtyQtl: 1000.00, moisturePercent: 16.2, mspRatePerQtl: 2320.00, totalMspAmount: 2320000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-771104", paymentDisbursedDate: "2025-11-07" }]
        },
        {
          farmerId: "TS-PPC-F-771105", farmerName: "K. Prabhakar", fatherHusbandName: "K. Rajaiah", aadhaarMasked: "XXXX-XXXX-5588", pattaPassbookNo: "T2908003355", mobile: "+91 93901 88990", village: "Malkapet", mandal: "Parkal", district: "Warangal Rural", bankName: "Canara Bank", accountNoMasked: "XXXXXX6655", ifscCode: "CNRB0002290", totalLoadsDelivered: 1, totalPaddyQtyQtl: 800.00, totalMspGrossAmount: 1856000.00, subsidiesApprovedAmount: 1856000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9105", dispatchDate: "2025-11-06", ppcCenter: "PPC Parkal (#402)", truckNo: "TS-03-TA-9900", paddyType: "Common Grade-A", dispatchedQtyQtl: 800.00, millWeighedQtyQtl: 800.00, moisturePercent: 16.1, mspRatePerQtl: 2320.00, totalMspAmount: 1856000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-771105", paymentDisbursedDate: "2025-11-08" }]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // MILL 3: TELANGANA PARBOILED RICE CORP (Wardhannapet MLS Point)
    // -----------------------------------------------------------------------
    "TS-WGL-MR-3391": {
      millId: "TS-WGL-MR-3391",
      millName: "Telangana Parboiled Rice Corp",
      location: "Wardhannapet MLS Point, Warangal",
      govtLots: [
        { id: "GOVT-LOT-3001", transitPass: "TP-2025-9301", ppcCenter: "PPC Wardhannapet (#408)", dispatchDate: "2025-11-04", farmerName: "Ch. Srinivas", truckNo: "TS-04-TA-3390", paddyType: "Common Grade-A", paddyQtyQtl: 1500.00, moisturePercent: 16.5, gunnyBags: 3750, mspRatePerQtl: 2320.00, officialRemarks: "Electronic gate transit pass" },
        { id: "GOVT-LOT-3002", transitPass: "TP-2025-9302", ppcCenter: "PPC Inavole Center (#410)", dispatchDate: "2025-11-05", farmerName: "M. Sadanandam", truckNo: "TS-04-TA-5510", paddyType: "Common Grade-A", paddyQtyQtl: 1200.00, moisturePercent: 16.8, gunnyBags: 3000, mspRatePerQtl: 2320.00, officialRemarks: "Gate pass issued" },
        { id: "GOVT-LOT-3003", transitPass: "TP-2025-9303", ppcCenter: "PPC Wardhannapet (#408)", dispatchDate: "2025-11-05", farmerName: "G. Rajendar", truckNo: "TS-04-TA-7720", paddyType: "Common Grade-A", paddyQtyQtl: 1000.00, moisturePercent: 18.5, gunnyBags: 2500, mspRatePerQtl: 2320.00, officialRemarks: "High moisture 18.5% flagged" },
        { id: "GOVT-LOT-3004", transitPass: "TP-2025-9304", ppcCenter: "PPC Inavole Center (#410)", dispatchDate: "2025-11-06", farmerName: "Y. Bhaskar Rao", truckNo: "TS-04-TA-9930", paddyType: "Common Grade-A", paddyQtyQtl: 1000.00, moisturePercent: 16.2, gunnyBags: 2500, mspRatePerQtl: 2320.00, officialRemarks: "Direct electronic dispatch" },
        { id: "GOVT-LOT-3005", transitPass: "TP-2025-9305", ppcCenter: "PPC Wardhannapet (#408)", dispatchDate: "2025-11-07", farmerName: "D. Mogili", truckNo: "TS-04-TA-1140", paddyType: "Common Grade-A", paddyQtyQtl: 800.00, moisturePercent: 16.6, gunnyBags: 2000, mspRatePerQtl: 2320.00, officialRemarks: "In transit to mill" }
      ],
      millSlips: [
        { slipNo: "MILL-TP-201", transitPassRef: "TP-2025-9301", vehicleRegNo: "TS-04-TA-3390", inwardDate: "2025-11-04", farmerName: "Ch. Srinivas", grossWtKg: 50000, tareWtKg: 12500, netPaddyQtl: 1500.00, moisturePercent: 16.5, gunnyBags: 3750, driverName: "K. Mohan", millerRemarks: "Weighed and matched." },
        { slipNo: "MILL-TP-202", transitPassRef: "TP-2025-9302", vehicleRegNo: "TS-04-TA-5510", inwardDate: "2025-11-05", farmerName: "M. Sadanandam", grossWtKg: 43000, tareWtKg: 14200, netPaddyQtl: 1160.00, moisturePercent: 16.8, gunnyBags: 3000, driverName: "P. Ramesh", millerRemarks: "40 Qtl tare variation observed." },
        { slipNo: "MILL-TP-203", transitPassRef: "TP-2025-9303", vehicleRegNo: "TS-04-TA-7720", inwardDate: "2025-11-05", farmerName: "G. Rajendar", grossWtKg: 40000, tareWtKg: 13000, netPaddyQtl: 940.00, moisturePercent: 18.5, gunnyBags: 2500, driverName: "T. Naresh", millerRemarks: "60 Qtl moisture cut deducted." },
        { slipNo: "MILL-TP-204", transitPassRef: "TP-2025-9304", vehicleRegNo: "TS-04-TA-9930", inwardDate: "2025-11-06", farmerName: "Y. Bhaskar Rao", grossWtKg: 41000, tareWtKg: 11000, netPaddyQtl: 1000.00, moisturePercent: 16.2, gunnyBags: 2500, driverName: "V. Srinivas", millerRemarks: "Exact match." }
      ],
      cmrDeliveries: [
        { ackNo: "FCI-TP-ACK-601", depotName: "Civil Supplies MLS Point Depot #08, Wardhannapet", deliveryDate: "2025-11-08", riceVariety: "Parboiled Rice (FAQ)", riceDeliveredQtl: 2100.00, gunnyDelivered: 4200, qcGrade: "FAQ Parboiled Grade A", status: "VERIFIED_ACCEPTED" }
      ],
      farmerProfiles: [
        {
          farmerId: "TS-PPC-F-662201", farmerName: "Ch. Srinivas", fatherHusbandName: "Ch. Narayana", aadhaarMasked: "XXXX-XXXX-8811", pattaPassbookNo: "T2908003310", mobile: "+91 99890 44556", village: "Inavole", mandal: "Wardhannapet", district: "Warangal Urban", bankName: "Canara Bank", accountNoMasked: "XXXXXX5520", ifscCode: "CNRB0005520", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1500.00, totalMspGrossAmount: 3480000.00, subsidiesApprovedAmount: 3480000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9301", dispatchDate: "2025-11-04", ppcCenter: "PPC Wardhannapet (#408)", truckNo: "TS-04-TA-3390", paddyType: "Common Grade-A", dispatchedQtyQtl: 1500.00, millWeighedQtyQtl: 1500.00, moisturePercent: 16.5, mspRatePerQtl: 2320.00, totalMspAmount: 3480000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-662201", paymentDisbursedDate: "2025-11-06" }]
        },
        {
          farmerId: "TS-PPC-F-662202", farmerName: "M. Sadanandam", fatherHusbandName: "M. Chandraiah", aadhaarMasked: "XXXX-XXXX-9922", pattaPassbookNo: "T2908004421", mobile: "+91 98481 77665", village: "Katrapally", mandal: "Inavole", district: "Warangal Urban", bankName: "State Bank of India", accountNoMasked: "XXXXXX6631", ifscCode: "SBIN0020412", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1160.00, totalMspGrossAmount: 2691200.00, subsidiesApprovedAmount: 2691200.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9302", dispatchDate: "2025-11-05", ppcCenter: "PPC Inavole (#410)", truckNo: "TS-04-TA-5510", paddyType: "Common Grade-A", dispatchedQtyQtl: 1200.00, millWeighedQtyQtl: 1160.00, moisturePercent: 16.8, mspRatePerQtl: 2320.00, totalMspAmount: 2691200.00, loadStatus: "DISPUTE_ADJUSTED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-662202", paymentDisbursedDate: "2025-11-07" }]
        },
        {
          farmerId: "TS-PPC-F-662203", farmerName: "G. Rajendar", fatherHusbandName: "G. Ramaswamy", aadhaarMasked: "XXXX-XXXX-1133", pattaPassbookNo: "T2908005532", mobile: "+91 97015 88990", village: "Wardhannapet", mandal: "Wardhannapet", district: "Warangal Rural", bankName: "Telangana Grameena Bank", accountNoMasked: "XXXXXX7742", ifscCode: "TGB0001104", totalLoadsDelivered: 1, totalPaddyQtyQtl: 940.00, totalMspGrossAmount: 2180800.00, subsidiesApprovedAmount: 2180800.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9303", dispatchDate: "2025-11-05", ppcCenter: "PPC Wardhannapet (#408)", truckNo: "TS-04-TA-7720", paddyType: "Common Grade-A", dispatchedQtyQtl: 1000.00, millWeighedQtyQtl: 940.00, moisturePercent: 18.5, mspRatePerQtl: 2320.00, totalMspAmount: 2180800.00, loadStatus: "DISPUTE_ADJUSTED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-662203", paymentDisbursedDate: "2025-11-08" }]
        },
        {
          farmerId: "TS-PPC-F-662204", farmerName: "Y. Bhaskar Rao", fatherHusbandName: "Y. Narsimha Rao", aadhaarMasked: "XXXX-XXXX-2244", pattaPassbookNo: "T2908006643", mobile: "+91 99894 11223", village: "Kakkiralapally", mandal: "Inavole", district: "Warangal Urban", bankName: "State Bank of India", accountNoMasked: "XXXXXX8853", ifscCode: "SBIN0020412", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1000.00, totalMspGrossAmount: 2320000.00, subsidiesApprovedAmount: 2320000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9304", dispatchDate: "2025-11-06", ppcCenter: "PPC Inavole (#410)", truckNo: "TS-04-TA-9930", paddyType: "Common Grade-A", dispatchedQtyQtl: 1000.00, millWeighedQtyQtl: 1000.00, moisturePercent: 16.2, mspRatePerQtl: 2320.00, totalMspAmount: 2320000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-662204", paymentDisbursedDate: "2025-11-08" }]
        },
        {
          farmerId: "TS-PPC-F-662205", farmerName: "D. Mogili", fatherHusbandName: "D. Komaraiah", aadhaarMasked: "XXXX-XXXX-3355", pattaPassbookNo: "T2908007754", mobile: "+91 93902 44556", village: "Bandautlapally", mandal: "Wardhannapet", district: "Warangal Rural", bankName: "Union Bank of India", accountNoMasked: "XXXXXX9964", ifscCode: "UBIN0544190", totalLoadsDelivered: 1, totalPaddyQtyQtl: 800.00, totalMspGrossAmount: 1856000.00, subsidiesApprovedAmount: 0, subsidiesInProcessAmount: 0, pendingPaymentAmount: 1856000.00, overallDbtStatus: "ON_HOLD",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9305", dispatchDate: "2025-11-07", ppcCenter: "PPC Wardhannapet (#408)", truckNo: "TS-04-TA-1140", paddyType: "Common Grade-A", dispatchedQtyQtl: 800.00, millWeighedQtyQtl: 0, moisturePercent: 16.6, mspRatePerQtl: 2320.00, totalMspAmount: 1856000.00, loadStatus: "IN_TRANSIT", dbtPaymentStatus: "PENDING_RECONCILIATION", pfmsTxnRef: "PENDING_SCALE", paymentDisbursedDate: "In Transit" }]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // MILL 4: BHADRAKALI AGRI MODERN FOODS (Chennaraopet Road)
    // -----------------------------------------------------------------------
    "TS-WGL-MR-2204": {
      millId: "TS-WGL-MR-2204",
      millName: "Bhadrakali Agri Modern Foods",
      location: "Chennaraopet Road, Warangal Rural",
      govtLots: [
        { id: "GOVT-LOT-4001", transitPass: "TP-2025-9501", ppcCenter: "PPC Chennaraopet (#412)", dispatchDate: "2025-11-03", farmerName: "G. Shankaraiah", truckNo: "TS-03-UB-7782", paddyType: "Common Grade-A", paddyQtyQtl: 1800.00, moisturePercent: 16.4, gunnyBags: 4500, mspRatePerQtl: 2320.00, officialRemarks: "Direct transit gate pass" },
        { id: "GOVT-LOT-4002", transitPass: "TP-2025-9502", ppcCenter: "PPC Nekkonda (#415)", dispatchDate: "2025-11-04", farmerName: "N. Sarangapani", truckNo: "TS-03-UB-1120", paddyType: "Common Grade-A", paddyQtyQtl: 1500.00, moisturePercent: 16.2, gunnyBags: 3750, mspRatePerQtl: 2320.00, officialRemarks: "Passed PPC electronic test" },
        { id: "GOVT-LOT-4003", transitPass: "TP-2025-9503", ppcCenter: "PPC Chennaraopet (#412)", dispatchDate: "2025-11-05", farmerName: "B. Devender", truckNo: "TS-03-UB-3340", paddyType: "Common Grade-A", paddyQtyQtl: 1500.00, moisturePercent: 16.9, gunnyBags: 3750, mspRatePerQtl: 2320.00, officialRemarks: "Gate pass issued" },
        { id: "GOVT-LOT-4004", transitPass: "TP-2025-9504", ppcCenter: "PPC Nekkonda (#415)", dispatchDate: "2025-11-05", farmerName: "K. Ramachandram", truckNo: "TS-03-UB-5560", paddyType: "Common Grade-A", paddyQtyQtl: 1200.00, moisturePercent: 16.0, gunnyBags: 3000, mspRatePerQtl: 2320.00, officialRemarks: "Verified gate pass" },
        { id: "GOVT-LOT-4005", transitPass: "TP-2025-9505", ppcCenter: "PPC Chennaraopet (#412)", dispatchDate: "2025-11-06", farmerName: "T. Yakub", truckNo: "TS-03-UB-7780", paddyType: "Common Grade-A", paddyQtyQtl: 1200.00, moisturePercent: 16.3, gunnyBags: 3000, mspRatePerQtl: 2320.00, officialRemarks: "Weighment synchronized" }
      ],
      millSlips: [
        { slipNo: "MILL-BA-301", transitPassRef: "TP-2025-9501", vehicleRegNo: "TS-03-UB-7782", inwardDate: "2025-11-03", farmerName: "G. Shankaraiah", grossWtKg: 58000, tareWtKg: 13000, netPaddyQtl: 1800.00, moisturePercent: 16.4, gunnyBags: 4500, driverName: "V. Ravi", millerRemarks: "Exact match." },
        { slipNo: "MILL-BA-302", transitPassRef: "TP-2025-9502", vehicleRegNo: "TS-03-UB-1120", inwardDate: "2025-11-04", farmerName: "N. Sarangapani", grossWtKg: 50000, tareWtKg: 12500, netPaddyQtl: 1500.00, moisturePercent: 16.2, gunnyBags: 3750, driverName: "B. Satyam", millerRemarks: "Exact match." },
        { slipNo: "MILL-BA-303", transitPassRef: "TP-2025-9503", vehicleRegNo: "TS-03-UB-3340", inwardDate: "2025-11-05", farmerName: "B. Devender", grossWtKg: 50000, tareWtKg: 13750, netPaddyQtl: 1450.00, moisturePercent: 16.9, gunnyBags: 3750, driverName: "M. Raju", millerRemarks: "50 Qtl tare weight difference." },
        { slipNo: "MILL-BA-304", transitPassRef: "TP-2025-9504", vehicleRegNo: "TS-03-UB-5560", inwardDate: "2025-11-05", farmerName: "K. Ramachandram", grossWtKg: 42000, tareWtKg: 12000, netPaddyQtl: 1200.00, moisturePercent: 16.0, gunnyBags: 3000, driverName: "G. Lingam", millerRemarks: "Exact match." },
        { slipNo: "MILL-BA-305", transitPassRef: "TP-2025-9505", vehicleRegNo: "TS-03-UB-7780", inwardDate: "2025-11-06", farmerName: "T. Yakub", grossWtKg: 42000, tareWtKg: 12000, netPaddyQtl: 1200.00, moisturePercent: 16.3, gunnyBags: 3000, driverName: "S. Mallesh", millerRemarks: "Exact match." }
      ],
      cmrDeliveries: [
        { ackNo: "FCI-BA-ACK-801", depotName: "Civil Supplies MLS Point Depot #12, Warangal", deliveryDate: "2025-11-08", riceVariety: "Raw Rice Grade-A (FAQ)", riceDeliveredQtl: 2500.00, gunnyDelivered: 5000, qcGrade: "FAQ Grade A (Passed 100%)", status: "VERIFIED_ACCEPTED" },
        { ackNo: "FCI-BA-ACK-802", depotName: "State Warehousing Corp Depot #04, Narsampet", deliveryDate: "2025-11-10", riceVariety: "Raw Rice Grade-A (FAQ)", riceDeliveredQtl: 2000.00, gunnyDelivered: 4000, qcGrade: "FAQ Grade A (Passed 100%)", status: "VERIFIED_ACCEPTED" }
      ],
      farmerProfiles: [
        {
          farmerId: "TS-PPC-F-553301", farmerName: "G. Shankaraiah", fatherHusbandName: "G. Laxmaiah", aadhaarMasked: "XXXX-XXXX-7729", pattaPassbookNo: "T2908009941", mobile: "+91 98661 77889", village: "Akulathota", mandal: "Chennaraopet", district: "Warangal Rural", bankName: "State Bank of India", accountNoMasked: "XXXXXX7781", ifscCode: "SBIN0020412", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1800.00, totalMspGrossAmount: 4176000.00, subsidiesApprovedAmount: 4176000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9501", dispatchDate: "2025-11-03", ppcCenter: "PPC Chennaraopet (#412)", truckNo: "TS-03-UB-7782", paddyType: "Common Grade-A", dispatchedQtyQtl: 1800.00, millWeighedQtyQtl: 1800.00, moisturePercent: 16.4, mspRatePerQtl: 2320.00, totalMspAmount: 4176000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-553301", paymentDisbursedDate: "2025-11-05" }]
        },
        {
          farmerId: "TS-PPC-F-553302", farmerName: "N. Sarangapani", fatherHusbandName: "N. Mallaiah", aadhaarMasked: "XXXX-XXXX-8830", pattaPassbookNo: "T2908001152", mobile: "+91 94406 11223", village: "Nekkonda", mandal: "Nekkonda", district: "Warangal Rural", bankName: "Andhra Pradesh Grameena Vikas Bank", accountNoMasked: "XXXXXX8892", ifscCode: "APGV0004108", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1500.00, totalMspGrossAmount: 3480000.00, subsidiesApprovedAmount: 3480000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9502", dispatchDate: "2025-11-04", ppcCenter: "PPC Nekkonda (#415)", truckNo: "TS-03-UB-1120", paddyType: "Common Grade-A", dispatchedQtyQtl: 1500.00, millWeighedQtyQtl: 1500.00, moisturePercent: 16.2, mspRatePerQtl: 2320.00, totalMspAmount: 3480000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-553302", paymentDisbursedDate: "2025-11-06" }]
        },
        {
          farmerId: "TS-PPC-F-553303", farmerName: "B. Devender", fatherHusbandName: "B. Narayana", aadhaarMasked: "XXXX-XXXX-9941", pattaPassbookNo: "T2908002263", mobile: "+91 98493 44556", village: "Gunturpally", mandal: "Chennaraopet", district: "Warangal Rural", bankName: "State Bank of India", accountNoMasked: "XXXXXX9903", ifscCode: "SBIN0020412", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1450.00, totalMspGrossAmount: 3364000.00, subsidiesApprovedAmount: 3364000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9503", dispatchDate: "2025-11-05", ppcCenter: "PPC Chennaraopet (#412)", truckNo: "TS-03-UB-3340", paddyType: "Common Grade-A", dispatchedQtyQtl: 1500.00, millWeighedQtyQtl: 1450.00, moisturePercent: 16.9, mspRatePerQtl: 2320.00, totalMspAmount: 3364000.00, loadStatus: "DISPUTE_ADJUSTED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-553303", paymentDisbursedDate: "2025-11-07" }]
        },
        {
          farmerId: "TS-PPC-F-553304", farmerName: "K. Ramachandram", fatherHusbandName: "K. Venkanna", aadhaarMasked: "XXXX-XXXX-1152", pattaPassbookNo: "T2908003374", mobile: "+91 97016 77889", village: "Appalraopet", mandal: "Nekkonda", district: "Warangal Rural", bankName: "Canara Bank", accountNoMasked: "XXXXXX1114", ifscCode: "CNRB0002290", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1200.00, totalMspGrossAmount: 2784000.00, subsidiesApprovedAmount: 2784000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9504", dispatchDate: "2025-11-05", ppcCenter: "PPC Nekkonda (#415)", truckNo: "TS-03-UB-5560", paddyType: "Common Grade-A", dispatchedQtyQtl: 1200.00, millWeighedQtyQtl: 1200.00, moisturePercent: 16.0, mspRatePerQtl: 2320.00, totalMspAmount: 2784000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-553304", paymentDisbursedDate: "2025-11-07" }]
        },
        {
          farmerId: "TS-PPC-F-553305", farmerName: "T. Yakub", fatherHusbandName: "T. Ibrahim", aadhaarMasked: "XXXX-XXXX-2263", pattaPassbookNo: "T2908004485", mobile: "+91 99895 22334", village: "Akulathota", mandal: "Chennaraopet", district: "Warangal Rural", bankName: "Union Bank of India", accountNoMasked: "XXXXXX2225", ifscCode: "UBIN0544190", totalLoadsDelivered: 1, totalPaddyQtyQtl: 1200.00, totalMspGrossAmount: 2784000.00, subsidiesApprovedAmount: 2784000.00, subsidiesInProcessAmount: 0, pendingPaymentAmount: 0, overallDbtStatus: "COMPLETED",
          loads: [{ loadId: "LOAD-01", transitPass: "TP-2025-9505", dispatchDate: "2025-11-06", ppcCenter: "PPC Chennaraopet (#412)", truckNo: "TS-03-UB-7780", paddyType: "Common Grade-A", dispatchedQtyQtl: 1200.00, millWeighedQtyQtl: 1200.00, moisturePercent: 16.3, mspRatePerQtl: 2320.00, totalMspAmount: 2784000.00, loadStatus: "WEIGHED_MATCHED", dbtPaymentStatus: "PAID", pfmsTxnRef: "PFMS-TS-2025-553305", paymentDisbursedDate: "2025-11-08" }]
        }
      ]
    }
  };

  // Active Signals (Loaded based on active mill)
  govtLots = signal<GovtLotRecord[]>([...this.millDatabases["TS-WGL-MR-4412"].govtLots]);
  millSlips = signal<MillGateRecord[]>([...this.millDatabases["TS-WGL-MR-4412"].millSlips]);
  cmrDeliveries = signal<CMRDeliveryRecord[]>([...this.millDatabases["TS-WGL-MR-4412"].cmrDeliveries]);
  farmerProfiles = signal<FarmerProfile[]>([...this.millDatabases["TS-WGL-MR-4412"].farmerProfiles]);
  farmerNotifications = signal<FarmerNotification[]>([]);

  // Audit Logs Signal
  auditLogs = signal<AuditLogEntry[]>([
    {
      id: "LOG-001",
      dateStr: "2025-11-04 10:30 AM",
      changeDescription: "Direct Live Sync established with Civil Supplies OPMS API Gateway",
      oldValue: "Offline",
      newValue: "Connected (/api/v2/cmr-procurement)",
      changedBy: "Civil Supplies Gateway",
      role: "SYSTEM",
      category: "UPLOAD"
    }
  ]);

  // Statutory Status Signals
  statutoryApprovalStatus = signal<"PENDING" | "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED">("PENDING");
  statutoryOfficerRemarks = signal<string>("Verified digital weighment feeds against official Civil Supplies procurement manifests. Approved for payment.");
  approvedOfficerName = signal<string>("");
  approvedTimestamp = signal<string>("");

  // Switch Active Mill Database
  switchActiveMill(millId: string): void {
    const dataset = this.millDatabases[millId] || this.millDatabases["TS-WGL-MR-4412"];
    this.activeMillId.set(millId);
    this.govtLots.set([...dataset.govtLots]);
    this.millSlips.set([...dataset.millSlips]);
    this.cmrDeliveries.set([...dataset.cmrDeliveries]);
    this.farmerProfiles.set([...dataset.farmerProfiles]);
    this.statutoryApprovalStatus.set(millId === "TS-WGL-MR-1108" ? "APPROVED" : "PENDING");
  }

  // Reconciled Items Computation
  reconciledItems = computed<ReconciledItem[]>(() => {
    const govt = this.govtLots();
    const mill = this.millSlips();
    const results: ReconciledItem[] = [];

    govt.forEach((g) => {
      const m = mill.find((slip) => 
        (slip.transitPassRef && slip.transitPassRef.trim().toLowerCase() === g.transitPass.trim().toLowerCase()) ||
        (slip.vehicleRegNo && slip.vehicleRegNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === g.truckNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
      );

      if (m) {
        const diff = Math.round((g.paddyQtyQtl - m.netPaddyQtl) * 100) / 100;
        let status: ReconciledItem["status"] = "Match";
        let reason = "Paddy quantity perfectly matches between Mandi electronic gate pass and Mill weighbridge scale.";
        let discType = "NONE";

        if (diff !== 0) {
          status = "Mismatch";
          if (g.moisturePercent > this.MAX_ALLOWED_MOISTURE) {
            discType = "MOISTURE_CUT";
            reason = `Moisture ${g.moisturePercent}%. ${Math.abs(diff)} Qtl difference due to standard moisture cut.`;
          } else {
            discType = "TARE_WEIGHT_VARIANCE";
            reason = `Tare weight variation of ${Math.abs(diff)} Qtl detected at Mill gross scale.`;
          }
        }

        results.push({
          id: g.id,
          farmerName: g.farmerName,
          govtRecord: g,
          millRecord: m,
          govtQty: g.paddyQtyQtl,
          millQty: m.netPaddyQtl,
          qtyDiff: diff,
          status: status,
          discrepancyType: discType,
          aiReasoning: reason,
          finalReconciledQty: m.netPaddyQtl
        });
      } else {
        results.push({
          id: g.id,
          farmerName: g.farmerName,
          govtRecord: g,
          millRecord: null,
          govtQty: g.paddyQtyQtl,
          millQty: 0,
          qtyDiff: g.paddyQtyQtl,
          status: "Missing In Mill",
          discrepancyType: "MISSING_MILL_INWARD",
          aiReasoning: "Transit pass issued by Mandi officer, but no inward entry recorded in Mill register.",
          finalReconciledQty: 0
        });
      }
    });

    mill.forEach((m) => {
      const matched = govt.some((g) => 
        (m.transitPassRef && m.transitPassRef.trim().toLowerCase() === g.transitPass.trim().toLowerCase()) ||
        (m.vehicleRegNo && m.vehicleRegNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === g.truckNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
      );

      if (!matched) {
        results.push({
          id: m.slipNo,
          farmerName: m.farmerName || "Unregistered Farmer",
          govtRecord: null,
          millRecord: m,
          govtQty: 0,
          millQty: m.netPaddyQtl,
          qtyDiff: -m.netPaddyQtl,
          status: "Missing In Govt",
          discrepancyType: "UNREGISTERED_MILL_TRUCK",
          aiReasoning: "Weighbridge slip generated at Mill gate without corresponding Govt Mandi Transit Pass.",
          finalReconciledQty: m.netPaddyQtl
        });
      }
    });

    return results;
  });

  // Overall Settlement & CMR 67% Calculation
  settlementSummary = computed<SettlementSummary>(() => {
    const items = this.reconciledItems();
    const cmrList = this.cmrDeliveries();

    let totalPaddy = 0;
    let matched = 0;
    let mismatch = 0;

    items.forEach((item) => {
      totalPaddy += item.finalReconciledQty;
      if (item.status === "Match") {
        matched++;
      } else {
        mismatch++;
      }
    });

    const totalRiceTarget = Math.round(totalPaddy * this.RAW_RICE_OTR * 100) / 100;
    let deliveredRice = 0;
    cmrList.forEach((c) => deliveredRice += c.riceDeliveredQtl);
    deliveredRice = Math.round(deliveredRice * 100) / 100;

    const pendingRice = Math.max(0, Math.round((totalRiceTarget - deliveredRice) * 100) / 100);

    const millingCharges = Math.round(totalPaddy * this.MILLING_CHARGES_PER_QTL * 100) / 100;
    const handlingCharges = Math.round(totalPaddy * this.HANDLING_CHARGES_PER_QTL * 100) / 100;
    const gunnyCredit = Math.round(totalPaddy * 2.5 * this.GUNNY_DEPRECIATION_RATE * 100) / 100;
    const totalPayable = millingCharges + handlingCharges + gunnyCredit;

    const matchPct = items.length > 0 ? ((matched / items.length) * 100).toFixed(1) + "%" : "0%";

    return {
      totalPaddyQtl: totalPaddy,
      totalRiceQtl: totalRiceTarget,
      totalDeliveredRiceQtl: deliveredRice,
      totalPendingRiceQtl: pendingRice,
      totalPayableAmount: totalPayable,
      millingCharges,
      handlingCharges,
      gunnyCredit,
      matchedCount: matched,
      mismatchCount: mismatch,
      totalLots: items.length,
      matchPercentage: matchPct,
      approvalStatus: this.statutoryApprovalStatus(),
      approvalRemarks: this.statutoryOfficerRemarks(),
      approvedBy: this.approvedOfficerName(),
      approvedAt: this.approvedTimestamp()
    };
  });

  // Get single farmer profile across active profiles
  getFarmerProfile(nameOrId: string): FarmerProfile | null {
    const search = nameOrId.toLowerCase().trim();
    return this.farmerProfiles().find((f) => 
      f.farmerName.toLowerCase().includes(search) ||
      f.farmerId.toLowerCase().includes(search) ||
      search.includes(f.farmerName.toLowerCase())
    ) || null;
  }

  // Direct Live Sync from Govt API
  syncFromGovtApi(centerFilter?: string): string {
    this.syncCount.update((c) => c + 1);
    this.lastApiSyncTime.set(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));

    const log: AuditLogEntry = {
      id: "LOG-" + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      dateStr: new Date().toLocaleString('en-IN'),
      changeDescription: `Direct Live Sync executed from Government OPMS API (${centerFilter || 'All Centers'}). Feeds updated.`,
      oldValue: `Sync #${this.syncCount() - 1}`,
      newValue: `Sync #${this.syncCount()} (${this.govtLots().length} Active Procurement Feeds)`,
      changedBy: "Civil Supplies OPMS Gateway",
      role: "GOVT_OFFICER",
      category: "UPLOAD"
    };

    this.auditLogs.update((logs) => [log, ...logs]);
    return `Live synchronized ${this.govtLots().length} Mandi Procurement feeds from Government OPMS API gateway (${this.lastApiSyncTime()}).`;
  }

  // Resolve specific dispute
  resolveDiscrepancy(itemId: string, agreedQty: number, userName: string, userRole: string, notes: string): void {
    const item = this.reconciledItems().find((i) => i.id === itemId);
    if (!item) return;

    const oldQty = item.finalReconciledQty;

    this.millSlips.update((slips) => {
      return slips.map((s) => {
        if (s.slipNo === itemId || (item.govtRecord && s.transitPassRef === item.govtRecord.transitPass)) {
          return { ...s, netPaddyQtl: agreedQty, millerRemarks: `Resolved: ${notes}` };
        }
        return s;
      });
    });

    this.govtLots.update((lots) => {
      return lots.map((l) => {
        if (l.id === itemId) {
          return { ...l, paddyQtyQtl: agreedQty, officialRemarks: `Resolved: ${notes}` };
        }
        return l;
      });
    });

    const log: AuditLogEntry = {
      id: "LOG-" + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      dateStr: new Date().toLocaleString('en-IN'),
      changeDescription: `Dispute resolved on lot ${itemId} (${item.farmerName})`,
      oldValue: `${oldQty} Qtl`,
      newValue: `${agreedQty} Qtl (${notes})`,
      changedBy: userName,
      role: userRole,
      category: "DISPUTE"
    };

    this.auditLogs.update((logs) => [log, ...logs]);
  }

  // Generate notifications for current active farmers
  generateFarmerApprovalNotifications(officerName: string): FarmerNotification[] {
    const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const notifications: FarmerNotification[] = this.farmerProfiles().map((fp, idx) => {
      const firstLoad = fp.loads[0];
      return {
        id: "SMS-F-" + (100 + idx + 1),
        farmerName: fp.farmerName,
        mobile: fp.mobile,
        transitPass: firstLoad ? firstLoad.transitPass : "TP-2025-GEN",
        quantityQtl: fp.totalPaddyQtyQtl,
        mspAmount: fp.totalMspGrossAmount,
        bankName: fp.bankName,
        bankAccountMasked: fp.accountNoMasked,
        pfmsTxnRef: firstLoad ? firstLoad.pfmsTxnRef || "PFMS-TS-2025-99881" : "PFMS-TS-2025-99881",
        sentTimestamp: timeNow,
        status: "DELIVERED_SMS",
        messageText: `Govt of Telangana: Your Paddy MSP of ₹${fp.totalMspGrossAmount.toLocaleString('en-IN')} for ${fp.totalPaddyQtyQtl} Qtl has been approved by ${officerName} & credited to ${fp.bankName} A/C ${fp.accountNoMasked}.`
      };
    });

    this.farmerNotifications.set(notifications);
    return notifications;
  }

  // Statutory Decisions
  approveBatch(officerName: string, remarks: string): void {
    this.statutoryApprovalStatus.set("APPROVED");
    this.statutoryOfficerRemarks.set(remarks);
    this.approvedOfficerName.set(officerName);
    this.approvedTimestamp.set(new Date().toLocaleString('en-IN'));

    this.generateFarmerApprovalNotifications(officerName);

    this.farmerProfiles.update((profiles) => {
      return profiles.map((p) => ({
        ...p,
        overallDbtStatus: "COMPLETED",
        subsidiesApprovedAmount: p.totalMspGrossAmount,
        subsidiesInProcessAmount: 0,
        pendingPaymentAmount: 0,
        loads: p.loads.map((l) => ({
          ...l,
          dbtPaymentStatus: "PAID",
          paymentDisbursedDate: "Today (DCSO Approved)"
        }))
      }));
    });

    const log: AuditLogEntry = {
      id: "LOG-" + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      dateStr: new Date().toLocaleString('en-IN'),
      changeDescription: `Statutory Approval Issued for ${this.activeMillId()}. Direct DBT SMS Notifications dispatched to verified Farmers.`,
      oldValue: "PENDING",
      newValue: "APPROVED - JRC Generated & DBT SMS Sent",
      changedBy: officerName,
      role: "GOVT_OFFICER",
      category: "APPROVAL"
    };

    this.auditLogs.update((logs) => [log, ...logs]);
  }

  rejectBatch(officerName: string, remarks: string): void {
    this.statutoryApprovalStatus.set("REJECTED");
    this.statutoryOfficerRemarks.set(remarks);
    this.approvedOfficerName.set(officerName);
    this.approvedTimestamp.set(new Date().toLocaleString('en-IN'));

    const log: AuditLogEntry = {
      id: "LOG-" + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      dateStr: new Date().toLocaleString('en-IN'),
      changeDescription: `Batch Rejected for ${this.activeMillId()} by Civil Supplies Officer`,
      oldValue: "PENDING",
      newValue: "REJECTED",
      changedBy: officerName,
      role: "GOVT_OFFICER",
      category: "APPROVAL"
    };

    this.auditLogs.update((logs) => [log, ...logs]);
  }

  requestCorrection(officerName: string, remarks: string): void {
    this.statutoryApprovalStatus.set("CORRECTION_REQUESTED");
    this.statutoryOfficerRemarks.set(remarks);
    this.approvedOfficerName.set(officerName);
    this.approvedTimestamp.set(new Date().toLocaleString('en-IN'));

    const log: AuditLogEntry = {
      id: "LOG-" + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      dateStr: new Date().toLocaleString('en-IN'),
      changeDescription: `Tare recalibration requested for ${this.activeMillId()}`,
      oldValue: "PENDING",
      newValue: "CORRECTION_REQUESTED",
      changedBy: officerName,
      role: "GOVT_OFFICER",
      category: "APPROVAL"
    };

    this.auditLogs.update((logs) => [log, ...logs]);
  }

  // Miller Weighbridge Entry
  addMillGateRecord(record: MillGateRecord): void {
    this.millSlips.update((slips) => [record, ...slips]);

    const log: AuditLogEntry = {
      id: "LOG-" + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      dateStr: new Date().toLocaleString('en-IN'),
      changeDescription: `Mill Gate Weighbridge scale inward recorded for slip ${record.slipNo} (${record.vehicleRegNo})`,
      oldValue: "None",
      newValue: `Net ${record.netPaddyQtl} Qtl (${record.farmerName})`,
      changedBy: "Mill Scale Operator",
      role: "MILL_OPERATOR",
      category: "QUANTITY"
    };

    this.auditLogs.update((logs) => [log, ...logs]);
  }
}
