# DHANYA - National CMR Digital Reconciliation & Subsidy Clearance System

**DHANYA** is an enterprise-grade web application built for the **Custom Milling of Rice (CMR)** lifecycle, facilitating joint automated reconciliation between Government Mandi Procurement Data and Rice Mill Inward Weighbridge Records.

## 🚀 Key Features

1. **Role-Based Authentication**:
   - 🌾 **Rice Mill User**: `TS-WGL-MR-4412` / `Miller@2025`
   - 🏛️ **Government Officer**: `dcso.wgl@telangana.gov.in` / `Govt@Civil2025`
2. **Multi-Source Data Ingestion**:
   - `govt_data.xlsx` Manifest Upload
   - `mill_data.xlsx` Weighbridge Upload
   - Manual Weighbridge Slip Scale Entry
   - 📸 Photo OCR Digitization of Handwritten Register Books
3. **Automated Reconciliation Engine**:
   - Real-time cross-verification of Truck No, Transit Passes, and Gross/Net Weights.
   - Categorization into `Match` and `Mismatch` with tolerance validation.
4. **Discrepancy Resolver**:
   - Detailed variance inspection (Moisture cuts, Tare calibration errors).
   - Joint inspection agreed quantity adjustments and dispute resolution notes.
5. **Settlement & Calculation Module**:
   - **Total Paddy** volume calculation.
   - **67% CMR Out-Turn Ratio** raw rice delivery compliance tracking.
   - **Total Pending Rice** delivery metric.
   - **Total Payable Subsidy Amount** (Milling ₹10/Qtl + Handling ₹4.50/Qtl + Gunny Credit ₹2.20/bag).
6. **Officer Approval Workflow**:
   - Actionable statutory buttons: `Approve`, `Reject`, `Request Correction`.
   - Official Joint Reconciliation & Clearance Certificate (JRC) generation.
7. **Auditable Modification History**:
   - Chronological audit logging tracking every quantity modification, dataset upload, and officer decision.

## 🛠️ Tech Stack

- **Frontend**: Angular 22 (Standalone Components, Signals & Reactive State)
- **Styling**: Tailwind CSS
- **Excel Ingestion**: SheetJS (`xlsx`)
- **Runtime**: Node.js

## 💻 Getting Started

```bash
# Install dependencies
npm install

# Start development server
ng serve --port 4200

# Build for production
ng build
```
