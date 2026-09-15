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
    slip.millerRemarks = `Resolved: ${notes}`;
  }

  const log = {
    id: "LOG-" + (auditLogs.length + 1).toString().padStart(3, '0'),
    dateStr: new Date().toLocaleString('en-IN'),
    changeDescription: `Dispute resolved on lot ${itemId}`,
    oldValue: "Disputed",
    newValue: `${agreedQty} Qtl (${notes})`,
    changedBy: officerName || "DCSO Officer",
    role: "GOVT_OFFICER",
    category: "DISPUTE"
  };
  auditLogs.unshift(log);

  res.json({
    success: true,
    message: `Dispute on lot ${itemId} resolved successfully to ${agreedQty} Qtl.`,
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
    changeDescription: `Mill gate weighment slip ${slip.slipNo} recorded`,
    oldValue: "None",
    newValue: `Net ${slip.netPaddyQtl} Qtl (${slip.farmerName})`,
    changedBy: "Mill Scale Operator",
    role: "MILL_OPERATOR",
    category: "QUANTITY"
  };
  auditLogs.unshift(log);

  res.json({
    success: true,
    message: `Weighbridge slip ${slip.slipNo} stored successfully.`,
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

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌾 DHANYA REST Backend API Server running on port ${PORT}`);
  console.log(`⚡ Health URL: http://localhost:${PORT}/api/v2/health`);
  console.log(`=======================================================`);
});
