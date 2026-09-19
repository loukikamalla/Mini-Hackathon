-- ==========================================================
-- Initial Seed Data for DHANYA Supabase
-- ==========================================================

-- 1. Insert 4 Dedicated Mill Managers
INSERT INTO mills (mill_code, mill_name, manager_name, username, password_hash, district, allocated_quota_mt, status) VALUES
('TS-WGL-MR-4412', 'Sri Lakshmi Rice Industries', 'Loukika', 'Loukika', 'Miller@2025', 'Warangal', 3500, 'ACTIVE'),
('TS-WGL-MR-1108', 'Kakatiya Modern Agro Mills', 'Krishna', 'krishna', 'Miller@2025', 'Warangal', 4200, 'ACTIVE'),
('TS-WGL-MR-3391', 'Telangana Parboiled Rice Corp', 'Vamsi', 'Vamsi', 'Miller@2025', 'Warangal', 5000, 'ACTIVE'),
('TS-WGL-MR-2204', 'Bhadrakali Agri Modern Foods', 'Lasya', 'Lasya', 'Miller@2025', 'Warangal', 2800, 'ACTIVE')
ON CONFLICT (mill_code) DO NOTHING;

-- 2. Insert Reconciled Batches for Sri Lakshmi Mill
INSERT INTO reconciled_batches (truck_no, pass_no, mill_code, farmer_name, farmer_aadhaar, govt_net_kg, mill_net_kg, moisture_percentage, net_variance_kg, reconciliation_status, discrepancy_reason, final_agreed_net_kg) VALUES
('TS03UB9912', 'TP-2025-081', 'TS-WGL-MR-4412', 'K. Mallesh', 'XXXX-XXXX-9812', 16000, 16000, 16.2, 0.0, 'MATCH', 'Gross and Net Weights fully reconciled within statutory tolerance', 16000),
('TS03UB4481', 'TP-2025-082', 'TS-WGL-MR-4412', 'B. Ramesh', 'XXXX-XXXX-1142', 14000, 13850, 17.8, -150.0, 'MISMATCH_MOISTURE', 'Moisture 17.8% (>17% threshold) & Tare variation -150 kg', 13850),
('TS03UB7721', 'TP-2025-083', 'TS-WGL-MR-4412', 'G. Venkatiah', 'XXXX-XXXX-3345', 18000, 18000, 15.8, 0.0, 'MATCH', '100% Net Weight match. Moisture in safe limits (15.8%)', 18000),
('TS03UB1102', 'TP-2025-084', 'TS-WGL-MR-4412', 'M. Saritha', 'XXXX-XXXX-5521', 12000, 11700, 18.2, -300.0, 'MISMATCH_WEIGHT', 'Moisture 18.2% with -300 kg net scale calibration discrepancy', 11700),
('TS03UB6633', 'TP-2025-085', 'TS-WGL-MR-4412', 'P. Sammaiah', 'XXXX-XXXX-7788', 17000, 17000, 16.4, 0.0, 'MATCH', 'Verified Transit Pass & Inward Weighbridge Scale match', 17000),
('TS03UB5541', 'TP-2025-086', 'TS-WGL-MR-4412', 'V. Narsaiah', 'XXXX-XXXX-6612', 15000, 15000, 15.5, 0.0, 'MATCH', 'Weight variance within permissible +/- 0.5% buffer', 15000);

-- 3. Insert Farmer DBT Accounts
INSERT INTO farmer_dbt_accounts (farmer_name, aadhaar_no, phone_no, bank_account, ifsc_code, village, paddy_sold_qtl, dbt_payable_amount, dbt_status) VALUES
('K. Mallesh', 'XXXX-XXXX-9812', '9848011221', 'SBIN0004123', 'SBIN0004123', 'Narsampet', 160.0, 368000.0, 'CREDITED'),
('B. Ramesh', 'XXXX-XXXX-1142', '9848011222', 'APGV0002194', 'APGV0002194', 'Geesugonda', 138.5, 318550.0, 'PENDING_SUBSIDY_CLEARANCE'),
('G. Venkatiah', 'XXXX-XXXX-3345', '9848011223', 'UBIN0056123', 'UBIN0056123', 'Wardhannapet', 180.0, 414000.0, 'CREDITED'),
('M. Saritha', 'XXXX-XXXX-5521', '9848011224', 'HDFC0001844', 'HDFC0001844', 'Atmakur', 117.0, 269100.0, 'PENDING_SUBSIDY_CLEARANCE'),
('P. Sammaiah', 'XXXX-XXXX-7788', '9848011225', 'SBIN0007812', 'SBIN0007812', 'Parkal', 170.0, 391000.0, 'CREDITED'),
('V. Narsaiah', 'XXXX-XXXX-6612', '9848011226', 'APGV0009841', 'APGV0009841', 'Rayaparthy', 150.0, 345000.0, 'CREDITED');
