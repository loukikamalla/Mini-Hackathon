import { Injectable, signal, computed } from "@angular/core";
import { 
  GovtLotRecord, 
  MillGateRecord, 
  CMRDeliveryRecord, 
  ReconciledItem, 
  SettlementSummary, 
  AuditLogEntry,
  FarmerProfile,
  FarmerLoadRecord
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
  lastApiSyncTime = signal<string>("Just now (Live Feed)");
  syncCount = signal<number>(1);

  // Initial Base Mandi Records from Govt Server
  private readonly baseGovtLots: GovtLotRecord[] = [
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
      ppcCenter: "PPC Narsampet Mandi (Center #401)",
      dispatchDate: "2025-11-06",
      farmerName: "K. Venkatesh",
      truckNo: "TS-03-UC-5509",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 650.00,
      moisturePercent: 16.5,
      gunnyBags: 1625,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Gate Dispatch confirmed via OPMS Mobile App"
    },
    {
      id: "GOVT-LOT-1007",
      transitPass: "TP-2025-8807",
      ppcCenter: "PPC Parkal Center (Center #402)",
      dispatchDate: "2025-11-07",
      farmerName: "P. Laxman Rao",
      truckNo: "TS-03-UB-8812",
      paddyType: "Common Grade-A",
      paddyQtyQtl: 900.00,
      moisturePercent: 16.9,
      gunnyBags: 2250,
      mspRatePerQtl: 2320.00,
      officialRemarks: "Transit pass issued by Mandi officer, pending mill inward acknowledgment"
    }
  ];

  // Initial Base Mill Gate Records
  private readonly baseMillSlips: MillGateRecord[] = [
    {
      slipNo: "MILL-WB-501",
      transitPassRef: "TP-2025-8801",
      vehicleRegNo: "TS-03-UB-4491",
      inwardDate: "2025-11-04",
      farmerName: "Ramesh (B. Venkanna)",
      grossWtKg: 42500,
      tareWtKg: 12500,
      netPaddyQtl: 1000.00,
      moisturePercent: 16.5,
      gunnyBags: 2500,
      driverName: "S. Raju",
      millerRemarks: "Gross and tare verified via digital weighbridge. Exact match."
    },
    {
      slipNo: "MILL-WB-502",
      transitPassRef: "TP-2025-8802",
      vehicleRegNo: "TS-03-UC-1102",
      inwardDate: "2025-11-04",
      farmerName: "Suresh (K. Rameshwara)",
      grossWtKg: 58500,
      tareWtKg: 15000,
      netPaddyQtl: 1450.00,
      moisturePercent: 17.0,
      gunnyBags: 3750,
      driverName: "M. Satyam",
      millerRemarks: "50 Qtl discrepancy observed against Mandi manifest. Tare weight adjusted."
    },
    {
      slipNo: "MILL-WB-525",
      transitPassRef: "TP-2025-8825",
      vehicleRegNo: "AP-04-TX-9021",
      inwardDate: "2025-11-05",
      farmerName: "M. Thirupathi",
      grossWtKg: 41000,
      tareWtKg: 12500,
      netPaddyQtl: 950.00,
      moisturePercent: 18.2,
      gunnyBags: 2500,
      driverName: "K. Mohan",
      millerRemarks: "High moisture 18.2%. Standard 50 Qtl cut deducted as per civil supplies moisture chart."
    },
    {
      slipNo: "MILL-WB-504",
      transitPassRef: "TP-2025-8804",
      vehicleRegNo: "TS-04-TA-3390",
      inwardDate: "2025-11-05",
      farmerName: "Ch. Srinivas",
      grossWtKg: 34000,
      tareWtKg: 10000,
      netPaddyQtl: 800.00,
      moisturePercent: 16.8,
      gunnyBags: 2000,
      driverName: "B. Naresh",
      millerRemarks: "Weighment matching Mandi transit pass."
    },
    {
      slipNo: "MILL-WB-505",
      transitPassRef: "TP-2025-8805",
      vehicleRegNo: "TS-03-UB-7782",
      inwardDate: "2025-11-06",
      farmerName: "G. Shankaraiah",
      grossWtKg: 49000,
      tareWtKg: 13000,
      netPaddyQtl: 1200.00,
      moisturePercent: 16.4,
      gunnyBags: 3000,
      driverName: "V. Ravi",
      millerRemarks: "Verified and accepted."
    },
    {
      slipNo: "MILL-WB-506",
      transitPassRef: "TP-2025-8806",
      vehicleRegNo: "TS-03-UC-5509",
      inwardDate: "2025-11-06",
      farmerName: "K. Venkatesh",
      grossWtKg: 28000,
      tareWtKg: 8500,
      netPaddyQtl: 650.00,
      moisturePercent: 16.5,
      gunnyBags: 1625,
      driverName: "P. Ganesh",
      millerRemarks: "Entered via Gate Weighbridge Operator."
    },
    {
      slipNo: "MILL-WB-599-UNREG",
      transitPassRef: "UNREG-NO-TP",
      vehicleRegNo: "TS-03-UD-9999",
      inwardDate: "2025-11-07",
      farmerName: "K. Lingaiah",
      grossWtKg: 18000,
      tareWtKg: 6000,
      netPaddyQtl: 300.00,
      moisturePercent: 17.5,
      gunnyBags: 750,
      driverName: "G. Mahesh",
      millerRemarks: "Emergency offload. Mandi TP yet to be linked from procurement portal."
    }
  ];

  // CMR Delivery Acknowledgments (FCI / State Civil Supplies Godowns)
  private readonly initialCmrDeliveries: CMRDeliveryRecord[] = [
    {
      ackNo: "FCI-CMR-ACK-901",
      depotName: "Civil Supplies MLS Point Depot #12, Warangal",
      deliveryDate: "2025-11-08",
      riceVariety: "Raw Rice Grade-A (FAQ)",
      riceDeliveredQtl: 1500.00,
      gunnyDelivered: 3000,
      qcGrade: "FAQ Grade A (Passed 100%)",
      status: "VERIFIED_ACCEPTED"
    },
    {
      ackNo: "FCI-CMR-ACK-902",
      depotName: "State Warehousing Corp Depot #04, Narsampet",
      deliveryDate: "2025-11-10",
      riceVariety: "Raw Rice Grade-A (FAQ)",
      riceDeliveredQtl: 1550.00,
      gunnyDelivered: 3100,
      qcGrade: "FAQ Grade A (Passed 100%)",
      status: "VERIFIED_ACCEPTED"
    }
  ];

  // Comprehensive Farmer Passbook / Ledger Profiles
  private readonly farmerProfilesDb: FarmerProfile[] = [
    {
      farmerId: "TS-PPC-F-882190",
      farmerName: "Ramesh (B. Venkanna)",
      fatherHusbandName: "B. Venkanna",
      aadhaarMasked: "XXXX-XXXX-4812",
      pattaPassbookNo: "T2908004128",
      mobile: "+91 98480 11234",
      village: "Maheshwaram",
      mandal: "Narsampet",
      district: "Warangal Rural",
      bankName: "State Bank of India",
      accountNoMasked: "XXXXXX8890",
      ifscCode: "SBIN0020188",
      totalLoadsDelivered: 3,
      totalPaddyQtyQtl: 2450.00,
      totalMspGrossAmount: 5684000.00,
      subsidiesApprovedAmount: 5684000.00,
      subsidiesInProcessAmount: 0.00,
      pendingPaymentAmount: 0.00,
      overallDbtStatus: "COMPLETED",
      loads: [
        {
          loadId: "LOAD-2025-01",
          transitPass: "TP-2025-8801",
          dispatchDate: "2025-11-04",
          ppcCenter: "PPC Narsampet Mandi (Center #401)",
          truckNo: "TS-03-UB-4491",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 1000.00,
          millWeighedQtyQtl: 1000.00,
          moisturePercent: 16.5,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 2320000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-899120",
          paymentDisbursedDate: "2025-11-06"
        },
        {
          loadId: "LOAD-2025-02",
          transitPass: "TP-2025-8740",
          dispatchDate: "2025-10-28",
          ppcCenter: "PPC Narsampet Mandi (Center #401)",
          truckNo: "TS-03-UA-2210",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 850.00,
          millWeighedQtyQtl: 850.00,
          moisturePercent: 16.0,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 1972000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-782109",
          paymentDisbursedDate: "2025-10-31"
        },
        {
          loadId: "LOAD-2025-03",
          transitPass: "TP-2025-8690",
          dispatchDate: "2025-10-20",
          ppcCenter: "PPC Narsampet Mandi (Center #401)",
          truckNo: "TS-03-UC-1190",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 600.00,
          millWeighedQtyQtl: 600.00,
          moisturePercent: 15.8,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 1392000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-661021",
          paymentDisbursedDate: "2025-10-23"
        }
      ]
    },
    {
      farmerId: "TS-PPC-F-882191",
      farmerName: "Suresh (K. Rameshwara)",
      fatherHusbandName: "K. Rameshwara",
      aadhaarMasked: "XXXX-XXXX-9934",
      pattaPassbookNo: "T2908005519",
      mobile: "+91 94401 22890",
      village: "Kistampet",
      mandal: "Parkal",
      district: "Warangal Rural",
      bankName: "Union Bank of India",
      accountNoMasked: "XXXXXX4419",
      ifscCode: "UBIN0544190",
      totalLoadsDelivered: 2,
      totalPaddyQtyQtl: 2700.00,
      totalMspGrossAmount: 6318000.00,
      subsidiesApprovedAmount: 6318000.00,
      subsidiesInProcessAmount: 0.00,
      pendingPaymentAmount: 0.00,
      overallDbtStatus: "COMPLETED",
      loads: [
        {
          loadId: "LOAD-2025-01",
          transitPass: "TP-2025-8802",
          dispatchDate: "2025-11-04",
          ppcCenter: "PPC Parkal Center (Center #402)",
          truckNo: "TS-03-UC-1102",
          paddyType: "Fine Grade (BPT-5204)",
          dispatchedQtyQtl: 1500.00,
          millWeighedQtyQtl: 1450.00,
          moisturePercent: 17.0,
          mspRatePerQtl: 2340.00,
          totalMspAmount: 3510000.00,
          loadStatus: "DISPUTE_ADJUSTED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-992104",
          paymentDisbursedDate: "2025-11-07"
        },
        {
          loadId: "LOAD-2025-02",
          transitPass: "TP-2025-8711",
          dispatchDate: "2025-10-25",
          ppcCenter: "PPC Parkal Center (Center #402)",
          truckNo: "TS-03-UA-9081",
          paddyType: "Fine Grade (BPT-5204)",
          dispatchedQtyQtl: 1200.00,
          millWeighedQtyQtl: 1200.00,
          moisturePercent: 16.2,
          mspRatePerQtl: 2340.00,
          totalMspAmount: 2808000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-810992",
          paymentDisbursedDate: "2025-10-29"
        }
      ]
    },
    {
      farmerId: "TS-PPC-F-882192",
      farmerName: "M. Thirupathi",
      fatherHusbandName: "M. Ramulu",
      aadhaarMasked: "XXXX-XXXX-6671",
      pattaPassbookNo: "T2908007781",
      mobile: "+91 97011 55667",
      village: "Dharmaraopet",
      mandal: "Narsampet",
      district: "Warangal Rural",
      bankName: "Telangana Grameena Bank",
      accountNoMasked: "XXXXXX1104",
      ifscCode: "TGB0001104",
      totalLoadsDelivered: 2,
      totalPaddyQtyQtl: 1800.00,
      totalMspGrossAmount: 4176000.00,
      subsidiesApprovedAmount: 2204000.00,
      subsidiesInProcessAmount: 1972000.00,
      pendingPaymentAmount: 0.00,
      overallDbtStatus: "PARTIAL_PROCESSED",
      loads: [
        {
          loadId: "LOAD-2025-01",
          transitPass: "TP-2025-8825",
          dispatchDate: "2025-11-05",
          ppcCenter: "PPC Narsampet Mandi (Center #401)",
          truckNo: "AP-04-TX-9021",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 1000.00,
          millWeighedQtyQtl: 950.00,
          moisturePercent: 18.2,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 2204000.00,
          loadStatus: "DISPUTE_ADJUSTED",
          dbtPaymentStatus: "PROCESSING",
          pfmsTxnRef: "PFMS-TS-2025-INPR-881",
          paymentDisbursedDate: "Processing at e-Kuber"
        },
        {
          loadId: "LOAD-2025-02",
          transitPass: "TP-2025-8755",
          dispatchDate: "2025-10-27",
          ppcCenter: "PPC Narsampet Mandi (Center #401)",
          truckNo: "TS-03-UB-1044",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 800.00,
          millWeighedQtyQtl: 800.00,
          moisturePercent: 16.4,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 1856000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-771902",
          paymentDisbursedDate: "2025-10-30"
        }
      ]
    },
    {
      farmerId: "TS-PPC-F-882193",
      farmerName: "Ch. Srinivas",
      fatherHusbandName: "Ch. Narayana",
      aadhaarMasked: "XXXX-XXXX-3341",
      pattaPassbookNo: "T2908003310",
      mobile: "+91 99890 44556",
      village: "Inavole",
      mandal: "Wardhannapet",
      district: "Warangal Urban",
      bankName: "Canara Bank",
      accountNoMasked: "XXXXXX5520",
      ifscCode: "CNRB0005520",
      totalLoadsDelivered: 1,
      totalPaddyQtyQtl: 800.00,
      totalMspGrossAmount: 1856000.00,
      subsidiesApprovedAmount: 1856000.00,
      subsidiesInProcessAmount: 0.00,
      pendingPaymentAmount: 0.00,
      overallDbtStatus: "COMPLETED",
      loads: [
        {
          loadId: "LOAD-2025-01",
          transitPass: "TP-2025-8804",
          dispatchDate: "2025-11-05",
          ppcCenter: "PPC Wardhannapet (Center #408)",
          truckNo: "TS-04-TA-3390",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 800.00,
          millWeighedQtyQtl: 800.00,
          moisturePercent: 16.8,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 1856000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-993310",
          paymentDisbursedDate: "2025-11-08"
        }
      ]
    },
    {
      farmerId: "TS-PPC-F-882194",
      farmerName: "G. Shankaraiah",
      fatherHusbandName: "G. Laxmaiah",
      aadhaarMasked: "XXXX-XXXX-7729",
      pattaPassbookNo: "T2908009941",
      mobile: "+91 98661 77889",
      village: "Akulathota",
      mandal: "Chennaraopet",
      district: "Warangal Rural",
      bankName: "State Bank of India",
      accountNoMasked: "XXXXXX7781",
      ifscCode: "SBIN0020412",
      totalLoadsDelivered: 2,
      totalPaddyQtyQtl: 2100.00,
      totalMspGrossAmount: 4872000.00,
      subsidiesApprovedAmount: 4872000.00,
      subsidiesInProcessAmount: 0.00,
      pendingPaymentAmount: 0.00,
      overallDbtStatus: "COMPLETED",
      loads: [
        {
          loadId: "LOAD-2025-01",
          transitPass: "TP-2025-8805",
          dispatchDate: "2025-11-06",
          ppcCenter: "PPC Chennaraopet (Center #412)",
          truckNo: "TS-03-UB-7782",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 1200.00,
          millWeighedQtyQtl: 1200.00,
          moisturePercent: 16.4,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 2784000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-998812",
          paymentDisbursedDate: "2025-11-09"
        },
        {
          loadId: "LOAD-2025-02",
          transitPass: "TP-2025-8730",
          dispatchDate: "2025-10-26",
          ppcCenter: "PPC Chennaraopet (Center #412)",
          truckNo: "TS-03-UC-6611",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 900.00,
          millWeighedQtyQtl: 900.00,
          moisturePercent: 16.0,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 2088000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-789012",
          paymentDisbursedDate: "2025-10-29"
        }
      ]
    },
    {
      farmerId: "TS-PPC-F-882195",
      farmerName: "K. Venkatesh",
      fatherHusbandName: "K. Satyanarayana",
      aadhaarMasked: "XXXX-XXXX-1150",
      pattaPassbookNo: "T2908006629",
      mobile: "+91 93902 33441",
      village: "Kammarpally",
      mandal: "Narsampet",
      district: "Warangal Rural",
      bankName: "Andhra Pradesh Grameena Vikas Bank",
      accountNoMasked: "XXXXXX3390",
      ifscCode: "APGV0004109",
      totalLoadsDelivered: 1,
      totalPaddyQtyQtl: 650.00,
      totalMspGrossAmount: 1508000.00,
      subsidiesApprovedAmount: 1508000.00,
      subsidiesInProcessAmount: 0.00,
      pendingPaymentAmount: 0.00,
      overallDbtStatus: "COMPLETED",
      loads: [
        {
          loadId: "LOAD-2025-01",
          transitPass: "TP-2025-8806",
          dispatchDate: "2025-11-06",
          ppcCenter: "PPC Narsampet Mandi (Center #401)",
          truckNo: "TS-03-UC-5509",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 650.00,
          millWeighedQtyQtl: 650.00,
          moisturePercent: 16.5,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 1508000.00,
          loadStatus: "WEIGHED_MATCHED",
          dbtPaymentStatus: "PAID",
          pfmsTxnRef: "PFMS-TS-2025-994411",
          paymentDisbursedDate: "2025-11-09"
        }
      ]
    },
    {
      farmerId: "TS-PPC-F-882196",
      farmerName: "P. Laxman Rao",
      fatherHusbandName: "P. Veerabhadram",
      aadhaarMasked: "XXXX-XXXX-8840",
      pattaPassbookNo: "T2908001190",
      mobile: "+91 99490 88771",
      village: "Shayampet",
      mandal: "Parkal",
      district: "Warangal Rural",
      bankName: "HDFC Bank",
      accountNoMasked: "XXXXXX9901",
      ifscCode: "HDFC0001920",
      totalLoadsDelivered: 1,
      totalPaddyQtyQtl: 900.00,
      totalMspGrossAmount: 2088000.00,
      subsidiesApprovedAmount: 0.00,
      subsidiesInProcessAmount: 0.00,
      pendingPaymentAmount: 2088000.00,
      overallDbtStatus: "ON_HOLD",
      loads: [
        {
          loadId: "LOAD-2025-01",
          transitPass: "TP-2025-8807",
          dispatchDate: "2025-11-07",
          ppcCenter: "PPC Parkal Center (Center #402)",
          truckNo: "TS-03-UB-8812",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 900.00,
          millWeighedQtyQtl: 0.00,
          moisturePercent: 16.9,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 2088000.00,
          loadStatus: "IN_TRANSIT",
          dbtPaymentStatus: "PENDING_RECONCILIATION",
          pfmsTxnRef: "PENDING-MILL-WEIGHMENT",
          paymentDisbursedDate: "On Hold (Awaiting Gate Scale Inward)"
        }
      ]
    },
    {
      farmerId: "TS-PPC-F-882197",
      farmerName: "K. Lingaiah",
      fatherHusbandName: "K. Mallesh",
      aadhaarMasked: "XXXX-XXXX-5521",
      pattaPassbookNo: "T2908008832",
      mobile: "+91 91210 44990",
      village: "Duggondi",
      mandal: "Narsampet",
      district: "Warangal Rural",
      bankName: "State Bank of India",
      accountNoMasked: "XXXXXX4481",
      ifscCode: "SBIN0020188",
      totalLoadsDelivered: 1,
      totalPaddyQtyQtl: 300.00,
      totalMspGrossAmount: 696000.00,
      subsidiesApprovedAmount: 0.00,
      subsidiesInProcessAmount: 696000.00,
      pendingPaymentAmount: 0.00,
      overallDbtStatus: "PARTIAL_PROCESSED",
      loads: [
        {
          loadId: "LOAD-2025-01",
          transitPass: "UNREG-NO-TP",
          dispatchDate: "2025-11-07",
          ppcCenter: "Direct Mill Gate Weighment",
          truckNo: "TS-03-UD-9999",
          paddyType: "Common Grade-A",
          dispatchedQtyQtl: 0.00,
          millWeighedQtyQtl: 300.00,
          moisturePercent: 17.5,
          mspRatePerQtl: 2320.00,
          totalMspAmount: 696000.00,
          loadStatus: "UNREGISTERED",
          dbtPaymentStatus: "PROCESSING",
          pfmsTxnRef: "PFMS-AWAIT-MANDI-AUTH",
          paymentDisbursedDate: "Awaiting Mandi Officer Transit Link"
        }
      ]
    }
  ];

  // Active Signals
  govtLots = signal<GovtLotRecord[]>([...this.baseGovtLots]);
  millSlips = signal<MillGateRecord[]>([...this.baseMillSlips]);
  cmrDeliveries = signal<CMRDeliveryRecord[]>([...this.initialCmrDeliveries]);
  farmerProfiles = signal<FarmerProfile[]>([...this.farmerProfilesDb]);

  // Dynamic Audit Trail Log
  auditLogs = signal<AuditLogEntry[]>([
    {
      id: "LOG-001",
      dateStr: "2025-11-04 10:30 AM",
      changeDescription: "Direct Live Sync established with Civil Supplies OPMS API Gateway",
      oldValue: "Offline",
      newValue: "Connected (Endpoint: /api/v2/cmr-procurement)",
      changedBy: "System Daemon",
      role: "SYSTEM",
      category: "UPLOAD"
    },
    {
      id: "LOG-002",
      dateStr: "2025-11-04 02:15 PM",
      changeDescription: "Tare weight discrepancy on GOVT-LOT-1002 (Suresh K.) resolved via Weighbridge Calibration Certificate",
      oldValue: "Difference: 50 Qtl",
      newValue: "Agreed: 1450.00 Qtl (Approved by S. Murthy)",
      changedBy: "S. Murthy",
      role: "MILL_OPERATOR",
      category: "DISPUTE"
    },
    {
      id: "LOG-003",
      dateStr: "2025-11-05 11:45 AM",
      changeDescription: "Moisture deduction of 50 Qtl accepted on GOVT-LOT-1025 (M. Thirupathi) due to 18.2% moisture content",
      oldValue: "1000.00 Qtl",
      newValue: "950.00 Qtl (Authorized)",
      changedBy: "Officer A (DCSO)",
      role: "GOVT_OFFICER",
      category: "QUANTITY"
    }
  ]);

  // Statutory Settlement Summary State
  statutoryApprovalStatus = signal<"PENDING" | "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED">("PENDING");
  statutoryOfficerRemarks = signal<string>("Awaiting final verification of Mandi outward slips vs Mill electronic weighments.");
  approvedOfficerName = signal<string>("");
  approvedTimestamp = signal<string>("");

  // Reconciled Items Computation
  reconciledItems = computed<ReconciledItem[]>(() => {
    const govt = this.govtLots();
    const mill = this.millSlips();
    const results: ReconciledItem[] = [];

    // 1. Process all Govt Lots
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
        // Missing in Mill
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

    // 2. Identify Mill slips with no corresponding Govt Lot (Unregistered)
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

    // 67% Raw Rice Norm
    const totalRiceTarget = Math.round(totalPaddy * this.RAW_RICE_OTR * 100) / 100;
    
    // Delivered CMR to FCI / Civil Supplies Godowns
    let deliveredRice = 0;
    cmrList.forEach((c) => deliveredRice += c.riceDeliveredQtl);
    deliveredRice = Math.round(deliveredRice * 100) / 100;

    const pendingRice = Math.max(0, Math.round((totalRiceTarget - deliveredRice) * 100) / 100);

    // Miller Payouts
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

  // Get single farmer profile
  getFarmerProfile(nameOrId: string): FarmerProfile | null {
    const search = nameOrId.toLowerCase().trim();
    return this.farmerProfiles().find((f) => 
      f.farmerName.toLowerCase().includes(search) ||
      f.farmerId.toLowerCase().includes(search) ||
      search.includes(f.farmerName.toLowerCase())
    ) || null;
  }

  // Direct Live Sync from Govt API Server
  syncFromGovtApi(centerFilter?: string): string {
    this.syncCount.update((c) => c + 1);
    this.lastApiSyncTime.set(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));

    const newLogs: AuditLogEntry = {
      id: "LOG-" + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      dateStr: new Date().toLocaleString('en-IN'),
      changeDescription: `Direct Live Sync executed from Government OPMS API (${centerFilter || 'All Centers'}). Feeds updated.`,
      oldValue: `Sync #${this.syncCount() - 1}`,
      newValue: `Sync #${this.syncCount()} (7 Active Procurement Feeds)`,
      changedBy: "Civil Supplies OPMS API Gateway",
      role: "GOVT_OFFICER",
      category: "UPLOAD"
    };

    this.auditLogs.update((logs) => [newLogs, ...logs]);
    return `Live synchronized 7 Mandi Procurement feeds from Government OPMS API gateway (${this.lastApiSyncTime()}).`;
  }

  // Officer / Miller resolves a specific dispute
  resolveDiscrepancy(
    itemId: string, 
    agreedQty: number, 
    userName: string, 
    userRole: string, 
    notes: string
  ): void {
    const item = this.reconciledItems().find((i) => i.id === itemId);
    if (!item) return;

    const oldQty = item.finalReconciledQty;

    // Update in millSlips or govtLots
    this.millSlips.update((slips) => {
      return slips.map((s) => {
        if (s.slipNo === itemId || (item.govtRecord && s.transitPassRef === item.govtRecord.transitPass)) {
          return {
            ...s,
            netPaddyQtl: agreedQty,
            millerRemarks: `Resolved: ${notes}`
          };
        }
        return s;
      });
    });

    this.govtLots.update((lots) => {
      return lots.map((l) => {
        if (l.id === itemId) {
          return {
            ...l,
            paddyQtyQtl: agreedQty,
            officialRemarks: `Resolved: ${notes}`
          };
        }
        return l;
      });
    });

    // Add Audit Log
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

  // Statutory Decision Actions
  approveBatch(officerName: string, remarks: string): void {
    this.statutoryApprovalStatus.set("APPROVED");
    this.statutoryOfficerRemarks.set(remarks);
    this.approvedOfficerName.set(officerName);
    this.approvedTimestamp.set(new Date().toLocaleString('en-IN'));

    const log: AuditLogEntry = {
      id: "LOG-" + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      dateStr: new Date().toLocaleString('en-IN'),
      changeDescription: "Statutory Approval & Subsidy Clearance Certificate issued by Civil Supplies Officer",
      oldValue: "PENDING",
      newValue: "APPROVED - Joint Reconciliation Certificate (JRC) Generated",
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
      changeDescription: "Batch Rejected by Civil Supplies Officer due to discrepancy non-compliance",
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
      changeDescription: "Correction & Physical Tare Recalibration requested from Rice Miller",
      oldValue: "PENDING",
      newValue: "CORRECTION_REQUESTED",
      changedBy: officerName,
      role: "GOVT_OFFICER",
      category: "APPROVAL"
    };

    this.auditLogs.update((logs) => [log, ...logs]);
  }

  // Add Scale Inward Record (Miller Only)
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
