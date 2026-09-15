# DHANYA - National CMR Digital Reconciliation & Subsidy Clearance System
🌾 **Telangana State Food & Civil Supplies Department & Rice Mills Digital CMR Portal**

---

## 📌 Project Overview
**DHANYA** is an enterprise-grade digital governance platform built for the **Custom Milling of Rice (CMR)** lifecycle. It automates joint digital reconciliation between Government Mandi Procurement Records (Telangana OPMS API) and Rice Mill Weighbridge Intake slips.

It eliminates manual register discrepancies, calculates the statutory **67% CMR Out-Turn Ratio** (100 Qtl Paddy = 67 Qtl CMR Raw Rice), manages moisture/tare disputes, and generates official digital **Joint Reconciliation Certificates (JRC)** for instant Direct Benefit Transfer (DBT) subsidy clearance.

---

## 🔐 Role-Based Access & Demo Credentials

### 1. 🌾 Rice Mill Managers (Individual Isolated Datasets)
All Mill Manager accounts use the password: `Miller@2025`

| Username | Rice Mill Name | Mill Code | Allocated Quota |
| :--- | :--- | :--- | :--- |
| **Loukika** | Sri Lakshmi Rice Industries | `TS-WGL-MR-4412` | 3,500 MT |
| **krishna** | Kakatiya Modern Agro Mills | `TS-WGL-MR-1108` | 4,200 MT |
| **Vamsi** | Telangana Parboiled Rice Corp | `TS-WGL-MR-3391` | 5,000 MT |
| **Lasya** | Bhadrakali Agri Modern Foods | `TS-WGL-MR-2204` | 2,800 MT |

### 2. 🏛️ District Civil Supplies Officer (DCSO)
- **Username / Email**: `dcso.wgl@telangana.gov.in`
- **Password**: `Govt@Civil2025`
- **Role**: Warangal District Oversight, Multi-Mill Approval, Dispute Settlement & Statutory Subsidy Clearance.

---

## 🚀 Key Modules & Capabilities

1. **Multi-Source Data Ingestion**:
   - Live Telangana OPMS Procurement API Direct Sync.
   - Excel Manifest File Upload (`govt_data.xlsx` & `mill_data.xlsx`).
   - Manual Weighbridge Slip Scale Entry with Net Weight calculation.
   - 📸 Photo OCR Digitization for handwritten weighbridge slips.

2. **Automated Reconciliation Engine**:
   - Cross-verifies Truck No, Transit Passes, Gross/Tare/Net weights.
   - Computes moisture variance (>17% statutory threshold) and tare calibration errors.

3. **Statutory 67% CMR & Subsidy Engine**:
   - Automatically computes: `Paddy Intake (Qtl) * 0.67 = Statutory CMR Delivery Obligation`.
   - Calculates Milling Subsidy (₹10/Qtl), Handling Subsidy (₹4.50/Qtl), and Gunny Bag Credits (₹2.20/bag).

4. **Statutory Decision Hub & Dynamic JRC**:
   - Single-click DCSO batch approval with status lock (`Statutory Subsidy Already Approved & Released`).
   - Generates official **Joint Reconciliation Certificate (JRC)** with dynamic Mill & Officer digital signatures (`Officer R. Kumar (DCSO)`).
   - Automated farmer-level DBT SMS broadcast logs (6 farmers per batch).

5. **Integrated H2 Database Web Console**:
   - Live interactive database viewer at `http://localhost:5000/h2-console`.
   - SQL query executor with pre-loaded mock tables (`DHANYA_CMR_RECORDS`, `MILL_PROFILES`, `FARMER_ACCOUNTS`, `AUDIT_LOGS`).

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Angular 19/22 (Standalone Components, Signals & Reactive State, Tailwind CSS).
- **Backend**: Express.js REST API server on Port 5000 (`cors`, `express.json`).
- **Data Engine**: SheetJS (`xlsx`) for Excel generation and ingestion.
- **Database Console**: Embedded in-memory SQL/H2-compatible web viewer.

---

## 💻 Running the Application

### 1. Start the Frontend (Angular UI):
```bash
npm install
npm start
# App running at http://localhost:4200
```

### 2. Start the Backend API & H2 Console:
```bash
npm run server
# REST API & H2 Console running at http://localhost:5000
# Access H2 Console: http://localhost:5000/h2-console
```

---

## 📡 REST API Endpoints

- `GET /api/v2/health` - Server health status & active connection count.
- `GET /api/v2/cmr-procurement` - Live Telangana OPMS Paddy procurement stream.
- `POST /api/v2/auth/login` - Secure credentials verification for DCSO and Millers.
- `POST /api/v2/disputes/resolve` - Joint inspection dispute settlement.
- `POST /api/v2/statutory/approve` - Statutory subsidy release & JRC authorization.
- `POST /api/v2/h2/query` - H2 database web console SQL executor.
