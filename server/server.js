const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Database initialized with Telangana Food & Civil Supplies Datasets
const millDatabases = {
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
    ]
  },
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
    ]
  },
  "TS-WGL-MR-3391": {
    millId: "TS-WGL-MR-3391",
    millName: "Telangana Parboiled Rice Corp",
    location: "Wardhannapet MLS Point",
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
    ]
  },
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
    ]
  }
};

let auditLogs = [
  {
    id: "LOG-001",
    dateStr: new Date().toLocaleString('en-IN'),
    changeDescription: "DHANYA Express REST Backend Server initialized and active on Port 5000",
    oldValue: "Offline",
    newValue: "ONLINE (REST API v2)",
    changedBy: "System Gateway",
    role: "SYSTEM",
    category: "UPLOAD"
  }
];

// 1. Health Check Endpoint
app.get('/api/v2/health', (req, res) => {
  res.json({
    status: "ONLINE",
    message: "DHANYA National Paddy & CMR 67% Digital Reconciliation Platform Backend Active",
    port: PORT,
    timestamp: new Date().toISOString(),
    millsAvailable: Object.keys(millDatabases).length
  });
});

// 2. Authentication Endpoint
app.post('/api/v2/auth/login', (req, res) => {
  const { userId, password, role } = req.body;

  if (role === 'GOVT_OFFICER') {
    if (userId === 'dcso.wgl@telangana.gov.in' && password === 'Govt@Civil2025') {
      return res.json({
        success: true,
        token: "jwt-dcso-auth-token-2025",
        user: {
          id: "OFFICER-WGL-DCSO-01",
          name: "R. Kumar, IAS (Cadre)",
          role: "GOVT_OFFICER",
          email: "dcso.wgl@telangana.gov.in",
          designation: "District Civil Supplies Officer (DCSO)",
          jurisdiction: "Warangal Urban & Rural District"
        }
      });
    }
  } else if (role === 'MILL_OPERATOR') {
    const u = (userId || '').trim().toLowerCase();
    const validPasswords = ['miller@2025', 'miller123', 'password', '1234', u, u + '123', 'kakatiya@2025'];
    const isPassValid = validPasswords.includes((password || '').trim().toLowerCase());

    if (isPassValid) {
      if (u === 'loukika' || u === 'ts-wgl-mr-4412' || u === 'miller' || u === 'lakshmi') {
        return res.json({
          success: true,
          token: "jwt-miller-auth-token-4412",
          user: {
            id: "TS-WGL-MR-4412",
            name: "Loukika (Mill Manager)",
            role: "MILL_OPERATOR",
            email: "loukika@srilakshmirice.in",
            designation: "Managing Partner & Weighbridge Inward Manager",
            assignedMillId: "TS-WGL-MR-4412",
            millName: "Sri Lakshmi Rice Industries",
            location: "Narsampet Road, Warangal Urban"
          }
        });
      }

      if (u === 'krishna' || u === 'ts-wgl-mr-1108' || u === 'kakatiya') {
        return res.json({
          success: true,
          token: "jwt-miller-auth-token-1108",
          user: {
            id: "TS-WGL-MR-1108",
            name: "Krishna (Mill Manager)",
            role: "MILL_OPERATOR",
            email: "krishna@kakatiya.in",
            designation: "Managing Partner & Weighbridge Inward Manager",
            assignedMillId: "TS-WGL-MR-1108",
            millName: "Kakatiya Modern Agro Mills",
            location: "Parkal Highway, Warangal Rural"
          }
        });
      }

      if (u === 'vamsi' || u === 'ts-wgl-mr-3391' || u === 'parboiled') {
        return res.json({
          success: true,
          token: "jwt-miller-auth-token-3391",
          user: {
            id: "TS-WGL-MR-3391",
            name: "Vamsi (Mill Manager)",
            role: "MILL_OPERATOR",
            email: "vamsi@parboiled.in",
            designation: "Managing Partner & Weighbridge Inward Manager",
            assignedMillId: "TS-WGL-MR-3391",
            millName: "Telangana Parboiled Rice Corp",
            location: "Wardhannapet MLS Point"
          }
        });
      }

      if (u === 'lasya' || u === 'ts-wgl-mr-2204' || u === 'bhadrakali') {
        return res.json({
          success: true,
          token: "jwt-miller-auth-token-2204",
          user: {
            id: "TS-WGL-MR-2204",
            name: "Lasya (Mill Manager)",
            role: "MILL_OPERATOR",
            email: "lasya@bhadrakali.in",
            designation: "Managing Partner & Weighbridge Inward Manager",
            assignedMillId: "TS-WGL-MR-2204",
            millName: "Bhadrakali Agri Modern Foods",
            location: "Chennaraopet Road, Warangal Rural"
          }
        });
      }
    }
  }

  return res.status(401).json({
    success: false,
    error: "Invalid official credentials. Please check your Role ID / Password."
  });
});

// 3. Get CMR Procurement Feeds (Per Mill or All)
app.get('/api/v2/cmr-procurement', (req, res) => {
  const { millId } = req.query;
  if (millId && millDatabases[millId]) {
    return res.json({
      success: true,
      data: millDatabases[millId]
    });
  }
  res.json({
    success: true,
    mills: millDatabases
  });
});

// 4. Resolve Dispute Endpoint
app.post('/api/v2/disputes/resolve', (req, res) => {
  const { millId, itemId, agreedQty, notes, officerName } = req.body;
  const mill = millDatabases[millId || "TS-WGL-MR-4412"];
  if (!mill) {
    return res.status(404).json({ success: false, error: "Mill not found" });
  }

  const slip = mill.millSlips.find(s => s.slipNo === itemId || s.transitPassRef === itemId);
  if (slip) {
    slip.netPaddyQtl = Number(agreedQty);
    slip.millerRemarks = "Resolved: " + notes;
  }

  const log = {
    id: "LOG-" + (auditLogs.length + 1).toString().padStart(3, '0'),
    dateStr: new Date().toLocaleString('en-IN'),
    changeDescription: "Dispute resolved on lot " + itemId,
    oldValue: "Disputed",
    newValue: agreedQty + " Qtl (" + notes + ")",
    changedBy: officerName || "DCSO Officer",
    role: "GOVT_OFFICER",
    category: "DISPUTE"
  };
  auditLogs.unshift(log);

  res.json({
    success: true,
    message: "Dispute on lot " + itemId + " resolved successfully to " + agreedQty + " Qtl.",
    auditLog: log
  });
});

// 5. Inward Weighbridge Scale Entry Endpoint
app.post('/api/v2/weighbridge/inward', (req, res) => {
  const { millId, slip } = req.body;
  const mill = millDatabases[millId || "TS-WGL-MR-4412"];
  if (!mill) {
    return res.status(404).json({ success: false, error: "Mill not found" });
  }

  mill.millSlips.unshift(slip);

  const log = {
    id: "LOG-" + (auditLogs.length + 1).toString().padStart(3, '0'),
    dateStr: new Date().toLocaleString('en-IN'),
    changeDescription: "Mill gate weighment slip " + slip.slipNo + " recorded",
    oldValue: "None",
    newValue: "Net " + slip.netPaddyQtl + " Qtl (" + slip.farmerName + ")",
    changedBy: "Mill Scale Operator",
    role: "MILL_OPERATOR",
    category: "QUANTITY"
  };
  auditLogs.unshift(log);

  res.json({
    success: true,
    message: "Weighbridge slip " + slip.slipNo + " stored successfully.",
    data: slip
  });
});

// 6. Audit Trail Logs Endpoint
app.get('/api/v2/audit-logs', (req, res) => {
  res.json({
    success: true,
    logs: auditLogs
  });
});

// 7. Interactive H2 In-Memory Database Web Console
app.get('/h2-console', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>H2 Database Web Console - DHANYA In-Memory Engine</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col">

  <!-- Header -->
  <header class="bg-slate-950 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-emerald-600 font-black text-white flex items-center justify-center font-mono text-sm">H2</div>
      <div>
        <h1 class="font-black text-sm text-white tracking-wide">H2 Database Console <span class="text-xs text-emerald-400 font-mono font-normal">v2.3.232 (In-Memory)</span></h1>
        <p class="text-[11px] text-slate-400 font-mono">JDBC URL: jdbc:h2:mem:dhanyadb | User: sa | Schema: PUBLIC</p>
      </div>
    </div>
    <div class="flex items-center gap-2 text-xs">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="font-mono text-emerald-400 font-bold">CONNECTED (Port 5000)</span>
      <a href="http://localhost:4200" class="ml-4 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition">← Back to Portal</a>
    </div>
  </header>

  <div class="flex-1 flex overflow-hidden">
    
    <!-- Left Sidebar: Schema Tree -->
    <aside class="w-72 bg-slate-950/80 border-r border-slate-800 p-4 overflow-y-auto space-y-4">
      <div>
        <span class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">DATABASE TABLES</span>
        <div class="space-y-1 font-mono text-xs">
          <div class="text-slate-300 font-bold flex items-center gap-1.5 py-1">
            <span>📁</span> <span>PUBLIC (SCHEMA)</span>
          </div>
          
          <button onclick="setQuery('SELECT * FROM GOVT_PPC_LOTS;')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 font-bold flex items-center justify-between group transition">
            <span>📄 GOVT_PPC_LOTS</span>
            <span class="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">6 rows</span>
          </button>

          <button onclick="setQuery('SELECT * FROM MILL_WEIGHBRIDGE_SLIPS;')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 font-bold flex items-center justify-between group transition">
            <span>📄 MILL_SLIPS</span>
            <span class="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">6 rows</span>
          </button>

          <button onclick="setQuery('SELECT * FROM CMR_FCI_DELIVERIES;')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 font-bold flex items-center justify-between group transition">
            <span>📄 CMR_DELIVERIES</span>
            <span class="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">2 rows</span>
          </button>

          <button onclick="setQuery('SELECT * FROM SYSTEM_USERS;')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 font-bold flex items-center justify-between group transition">
            <span>📄 SYSTEM_USERS</span>
            <span class="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">5 rows</span>
          </button>

          <button onclick="setQuery('SELECT * FROM AUDIT_TRAIL;')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 font-bold flex items-center justify-between group transition">
            <span>📄 AUDIT_TRAIL</span>
            <span class="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">live</span>
          </button>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <span class="font-bold text-slate-300 block">Database Info:</span>
        <p>Driver: org.h2.Driver (In-Memory)</p>
        <p>Active Mill: Sri Lakshmi (TS-WGL-MR-4412)</p>
      </div>
    </aside>

    <!-- Main SQL Workspace -->
    <main class="flex-1 flex flex-col overflow-hidden bg-slate-900">
      
      <!-- SQL Query Box -->
      <div class="p-5 bg-slate-950/40 border-b border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">SQL Statement / Query Editor:</label>
          <div class="flex items-center gap-2">
            <button onclick="setQuery('SELECT * FROM GOVT_PPC_LOTS;')" class="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono">Lots</button>
            <button onclick="setQuery('SELECT * FROM MILL_WEIGHBRIDGE_SLIPS;')" class="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono">Slips</button>
            <button onclick="setQuery('SELECT * FROM SYSTEM_USERS;')" class="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono">Users</button>
            <button onclick="setQuery('SELECT * FROM AUDIT_TRAIL;')" class="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono">Audit</button>
          </div>
        </div>

        <textarea id="sqlInput" rows="2" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-sm text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold shadow-inner">SELECT * FROM GOVT_PPC_LOTS;</textarea>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button onclick="executeQuery()" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition font-mono flex items-center gap-1.5">
              <span>▶ RUN SQL (Ctrl+Enter)</span>
            </button>
            <button onclick="clearResults()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition font-mono">
              Clear
            </button>
          </div>
          <span id="execStats" class="text-xs font-mono text-slate-400">Ready to execute SQL query</span>
        </div>
      </div>

      <!-- Query Output Table Area -->
      <div class="flex-1 p-5 overflow-auto">
        <div id="resultsTableContainer" class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
        </div>
      </div>

    </main>

  </div>

  <script>
    const dbData = {
      GOVT_PPC_LOTS: [
        { LOT_ID: "GOVT-LOT-1001", TRANSIT_PASS: "TP-2025-8801", PPC_CENTER: "PPC Narsampet (#401)", FARMER_NAME: "Ramesh (B. Venkanna)", TRUCK_NO: "TS-03-UB-4491", PADDY_QTY_QTL: 1000.00, MOISTURE_PCT: 16.5, MSP_RATE: 2320.00, STATUS: "VERIFIED" },
        { LOT_ID: "GOVT-LOT-1002", TRANSIT_PASS: "TP-2025-8802", PPC_CENTER: "PPC Parkal (#402)", FARMER_NAME: "Suresh (K. Rameshwara)", TRUCK_NO: "TS-03-UC-1102", PADDY_QTY_QTL: 1500.00, MOISTURE_PCT: 17.0, MSP_RATE: 2340.00, STATUS: "VERIFIED" },
        { LOT_ID: "GOVT-LOT-1025", TRANSIT_PASS: "TP-2025-8825", PPC_CENTER: "PPC Narsampet (#401)", FARMER_NAME: "M. Thirupathi", TRUCK_NO: "AP-04-TX-9021", PADDY_QTY_QTL: 1000.00, MOISTURE_PCT: 18.2, MSP_RATE: 2320.00, STATUS: "MOISTURE_FLAG" },
        { LOT_ID: "GOVT-LOT-1006", TRANSIT_PASS: "TP-2025-8806", PPC_CENTER: "PPC Narsampet (#401)", FARMER_NAME: "K. Venkatesh", TRUCK_NO: "TS-03-UC-5509", PADDY_QTY_QTL: 650.00, MOISTURE_PCT: 16.5, MSP_RATE: 2320.00, STATUS: "DISPATCHED" },
        { LOT_ID: "GOVT-LOT-1007", TRANSIT_PASS: "TP-2025-8807", PPC_CENTER: "PPC Parkal (#402)", FARMER_NAME: "P. Laxman Rao", TRUCK_NO: "TS-03-UB-8812", PADDY_QTY_QTL: 900.00, MOISTURE_PCT: 16.9, MSP_RATE: 2320.00, STATUS: "IN_TRANSIT" },
        { LOT_ID: "GOVT-LOT-1008", TRANSIT_PASS: "TP-2025-8808", PPC_CENTER: "PPC Narsampet (#401)", FARMER_NAME: "V. Narsimha", TRUCK_NO: "TS-03-UB-9910", PADDY_QTY_QTL: 1300.00, MOISTURE_PCT: 16.2, MSP_RATE: 2320.00, STATUS: "VERIFIED" }
      ],
      MILL_WEIGHBRIDGE_SLIPS: [
        { SLIP_NO: "MILL-WB-501", TRANSIT_PASS_REF: "TP-2025-8801", VEHICLE_REG_NO: "TS-03-UB-4491", FARMER_NAME: "Ramesh (B. Venkanna)", GROSS_KG: 42500, TARE_KG: 12500, NET_PADDY_QTL: 1000.00, MOISTURE_PCT: 16.5, STATUS: "MATCH" },
        { SLIP_NO: "MILL-WB-502", TRANSIT_PASS_REF: "TP-2025-8802", VEHICLE_REG_NO: "TS-03-UC-1102", FARMER_NAME: "Suresh (K. Rameshwara)", GROSS_KG: 58500, TARE_KG: 15000, NET_PADDY_QTL: 1450.00, MOISTURE_PCT: 17.0, STATUS: "TARE_DIFF" },
        { SLIP_NO: "MILL-WB-525", TRANSIT_PASS_REF: "TP-2025-8825", VEHICLE_REG_NO: "AP-04-TX-9021", FARMER_NAME: "M. Thirupathi", GROSS_KG: 41000, TARE_KG: 12500, NET_PADDY_QTL: 950.00, MOISTURE_PCT: 18.2, STATUS: "MOISTURE_CUT" },
        { SLIP_NO: "MILL-WB-506", TRANSIT_PASS_REF: "TP-2025-8806", VEHICLE_REG_NO: "TS-03-UC-5509", FARMER_NAME: "K. Venkatesh", GROSS_KG: 28000, TARE_KG: 8500, NET_PADDY_QTL: 650.00, MOISTURE_PCT: 16.5, STATUS: "MATCH" },
        { SLIP_NO: "MILL-WB-508", TRANSIT_PASS_REF: "TP-2025-8808", VEHICLE_REG_NO: "TS-03-UB-9910", FARMER_NAME: "V. Narsimha", GROSS_KG: 52000, TARE_KG: 13000, NET_PADDY_QTL: 1300.00, MOISTURE_PCT: 16.2, STATUS: "MATCH" },
        { SLIP_NO: "MILL-WB-599-UNREG", TRANSIT_PASS_REF: "UNREG-NO-TP", VEHICLE_REG_NO: "TS-03-UD-9999", FARMER_NAME: "K. Lingaiah", GROSS_KG: 18000, TARE_KG: 6000, NET_PADDY_QTL: 300.00, MOISTURE_PCT: 17.5, STATUS: "UNREGISTERED" }
      ],
      CMR_FCI_DELIVERIES: [
        { ACK_NO: "FCI-CMR-ACK-901", DEPOT_NAME: "Civil Supplies MLS Point Depot #12, Warangal", RICE_VARIETY: "Raw Rice Grade-A (FAQ)", DELIVERED_QTL: 1500.00, GUNNY_BAGS: 3000, QC_GRADE: "FAQ Passed", STATUS: "ACCEPTED" },
        { ACK_NO: "FCI-CMR-ACK-902", DEPOT_NAME: "State Warehousing Corp Depot #04, Narsampet", RICE_VARIETY: "Raw Rice Grade-A (FAQ)", DELIVERED_QTL: 1550.00, GUNNY_BAGS: 3100, QC_GRADE: "FAQ Passed", STATUS: "ACCEPTED" }
      ],
      SYSTEM_USERS: [
        { USER_ID: "DCSO-WARANGAL-08", USERNAME: "dcso.wgl@telangana.gov.in", NAME: "R. Kumar, IAS", ROLE: "GOVT_OFFICER", ASSIGNED_ORG: "Food & Civil Supplies Department" },
        { USER_ID: "TS-WGL-MR-4412", USERNAME: "Loukika", NAME: "Loukika (Mill Manager)", ROLE: "MILL_OPERATOR", ASSIGNED_ORG: "Sri Lakshmi Rice Industries" },
        { USER_ID: "TS-WGL-MR-1108", USERNAME: "krishna", NAME: "Krishna (Mill Manager)", ROLE: "MILL_OPERATOR", ASSIGNED_ORG: "Kakatiya Modern Agro Mills" },
        { USER_ID: "TS-WGL-MR-3391", USERNAME: "Vamsi", NAME: "Vamsi (Mill Manager)", ROLE: "MILL_OPERATOR", ASSIGNED_ORG: "Telangana Parboiled Rice Corp" },
        { USER_ID: "TS-WGL-MR-2204", USERNAME: "Lasya", NAME: "Lasya (Mill Manager)", ROLE: "MILL_OPERATOR", ASSIGNED_ORG: "Bhadrakali Agri Modern Foods" }
      ],
      AUDIT_TRAIL: [
        { LOG_ID: "LOG-001", TIMESTAMP: "2025-11-04 10:30 AM", ACTION: "Civil Supplies OPMS API Synchronized", CHANGED_BY: "System Gateway", ROLE: "SYSTEM", CATEGORY: "UPLOAD" },
        { LOG_ID: "LOG-002", TIMESTAMP: "2025-11-05 02:15 PM", ACTION: "Weighbridge Inward Slip Recorded (MILL-WB-525)", CHANGED_BY: "Loukika", ROLE: "MILL_OPERATOR", CATEGORY: "QUANTITY" },
        { LOG_ID: "LOG-003", TIMESTAMP: "2025-11-06 11:45 AM", ACTION: "Moisture Dispute Resolved for M. Thirupathi", CHANGED_BY: "R. Kumar (DCSO)", ROLE: "GOVT_OFFICER", CATEGORY: "DISPUTE" }
      ]
    };

    function setQuery(sql) {
      document.getElementById('sqlInput').value = sql;
      executeQuery();
    }

    function executeQuery() {
      const sql = document.getElementById('sqlInput').value.trim().toUpperCase();
      const container = document.getElementById('resultsTableContainer');
      const stats = document.getElementById('execStats');

      let targetKey = 'GOVT_PPC_LOTS';
      if (sql.includes('SLIP') || sql.includes('MILL')) targetKey = 'MILL_WEIGHBRIDGE_SLIPS';
      else if (sql.includes('CMR') || sql.includes('FCI') || sql.includes('DELIVER')) targetKey = 'CMR_FCI_DELIVERIES';
      else if (sql.includes('USER')) targetKey = 'SYSTEM_USERS';
      else if (sql.includes('AUDIT') || sql.includes('LOG')) targetKey = 'AUDIT_TRAIL';

      const rows = dbData[targetKey] || dbData.GOVT_PPC_LOTS;

      if (!rows || rows.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-500 font-mono">Query executed. 0 rows returned.</div>';
        stats.innerText = '0 rows returned';
        return;
      }

      const columns = Object.keys(rows[0]);
      let html = '<table class="w-full text-left font-mono text-xs border-collapse">';
      
      html += '<thead class="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider"><tr>';
      columns.forEach(function(col) {
        html += '<th class="py-3 px-4 border-r border-slate-800 last:border-r-0">' + col + '</th>';
      });
      html += '</tr></thead>';

      html += '<tbody class="divide-y divide-slate-800 text-slate-200">';
      rows.forEach(function(row, i) {
        html += '<tr class="hover:bg-slate-900/80 transition ' + (i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-950/50') + '">';
        columns.forEach(function(col) {
          const val = row[col];
          const isNum = typeof val === 'number';
          html += '<td class="py-2.5 px-4 border-r border-slate-800 last:border-r-0 ' + (isNum ? 'text-right text-emerald-400 font-bold' : '') + '">' + val + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';

      container.innerHTML = html;
      stats.innerText = '✓ ' + rows.length + ' rows retrieved (H2 In-Memory DB Engine)';
    }

    function clearResults() {
      document.getElementById('resultsTableContainer').innerHTML = '';
      document.getElementById('execStats').innerText = 'Results cleared';
    }

    window.onload = executeQuery;
  </script>
</body>
</html>`);
});

// Start Express Server
app.listen(PORT, () => {
  console.log('=======================================================');
  console.log('🌾 DHANYA REST Backend API Server running on port ' + PORT);
  console.log('⚡ Health URL: http://localhost:' + PORT + '/api/v2/health');
  console.log('🗄️ H2 Console: http://localhost:' + PORT + '/h2-console');
  console.log('=======================================================');
});
