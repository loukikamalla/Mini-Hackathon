# DHANYA - Python Flask & Supabase Backend Architecture

🌾 **National CMR 67% Digital Reconciliation & Statutory Subsidy Clearance System**

---

## 📌 Architecture & Modules

This backend is built using **Python Flask 3.0** integrated with **Supabase (PostgreSQL, Storage & Auth)** to power automated Custom Milling of Rice (CMR) governance.

### 🌟 Core Capabilities:
1. **Pandas Reconciliation Engine:** Automated multi-format Excel & Mandi procurement comparison with discrepancy root-cause detection (Moisture cuts, Tare calibration errors).
2. **Statutory 67% CMR Math Engine:** Exact calculation of 67% raw rice output delivery targets (Paddy Intake * 0.67) and statutory subsidy ledger (Milling ₹10/Qtl, Handling ₹4.50/Qtl, Gunny credits ₹2.20/bag).
3. **Register Book Photo Digitizer (OCR):** Image parsing heuristics for handwritten physical notebooks.
4. **Official JRC Certificate PDF Generator:** Generates downloadable Joint Reconciliation Clearance Certificates with dynamic seals and signatures via ReportLab.
5. **Multi-Role Security:** Isolated portals for 4 Rice Mill Managers (Loukika, krishna, Vamsi, Lasya) and District Civil Supplies Officer (Officer R. Kumar (DCSO)).

---

## 🚀 How to Run the Flask Backend

### 1. Install Dependencies:
`ash
pip install -r flask_backend/requirements.txt
`

### 2. Start the Server:
`ash
npm run flask-server
# OR directly:
python flask_backend/app.py
`
Server runs at **http://localhost:5000**.

---

## 🗄️ Supabase Cloud Integration

1. Go to your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** and execute supabase_schema.sql and supabase_seed.sql.
3. In lask_backend/.env, paste your credentials:
   `env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-supabase-anon-or-service-key
   SUPABASE_STORAGE_BUCKET=dhanya-documents
   `

---

## 📡 REST API Endpoints

- GET /api/v2/health - Health check & Supabase connection status.
- POST /api/v2/auth/login - DCSO & Mill Manager authentication.
- GET /api/v2/cmr-procurement - Live Telangana OPMS Mandi stream.
- GET /api/v2/settlement - 67% CMR outturn & subsidy calculations.
- POST /api/v2/disputes/resolve - Recalibrate joint inspection disputes.
- POST /api/v2/statutory/approve - Lock batch, issue JRC certificate & trigger SMS.
- GET /api/v2/statutory/jrc-pdf/<cert_id> - Download official JRC PDF certificate.
- POST /api/v2/ingest/excel-reconcile - Upload Govt & Mill Excel sheets for automated reconciliation.
- POST /api/v2/ingest/ocr-slip - Upload handwritten register photo for digitization.
- GET /api/v2/audit/logs - Full chronological audit trail.
