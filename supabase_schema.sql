-- ==========================================================
-- DHANYA: CMR 67% Digital Reconciliation & Subsidy Platform
-- Supabase / PostgreSQL Enterprise Database Schema
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Mills Profile Table
CREATE TABLE IF NOT EXISTS mills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mill_code VARCHAR(50) UNIQUE NOT NULL,
    mill_name VARCHAR(200) NOT NULL,
    manager_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    district VARCHAR(50) NOT NULL DEFAULT 'Warangal',
    allocated_quota_mt INT NOT NULL DEFAULT 3500,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Official Government Procurement Manifests (Telangana OPMS Mandi Records)
CREATE TABLE IF NOT EXISTS govt_procurement_manifests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transit_pass_no VARCHAR(50) UNIQUE NOT NULL,
    truck_no VARCHAR(50) NOT NULL,
    mill_code VARCHAR(50) NOT NULL REFERENCES mills(mill_code) ON DELETE CASCADE,
    mandi_centre_name VARCHAR(150) NOT NULL,
    farmer_name VARCHAR(150) NOT NULL,
    farmer_aadhaar VARCHAR(20) NOT NULL,
    paddy_variety VARCHAR(100) NOT NULL DEFAULT 'BPT-5204 (Sona Masoori)',
    govt_gross_kg DOUBLE PRECISION NOT NULL,
    govt_tare_kg DOUBLE PRECISION NOT NULL,
    govt_net_kg DOUBLE PRECISION NOT NULL,
    moisture_percentage DOUBLE PRECISION NOT NULL DEFAULT 16.0,
    procurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Mill Inward Weighbridge Intakes (Mill Records / OCR / Manual)
CREATE TABLE IF NOT EXISTS mill_weighbridge_intakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slip_no VARCHAR(50) UNIQUE NOT NULL,
    truck_no VARCHAR(50) NOT NULL,
    mill_code VARCHAR(50) NOT NULL REFERENCES mills(mill_code) ON DELETE CASCADE,
    mill_gross_kg DOUBLE PRECISION NOT NULL,
    mill_tare_kg DOUBLE PRECISION NOT NULL,
    mill_net_kg DOUBLE PRECISION NOT NULL,
    moisture_percentage DOUBLE PRECISION NOT NULL DEFAULT 16.0,
    entry_mode VARCHAR(30) NOT NULL DEFAULT 'MANUAL_SLIP', -- 'EXCEL_IMPORT', 'OCR_PHOTO', 'MANUAL_SLIP'
    photo_evidence_url TEXT,
    intake_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Reconciled Batches (Matched vs Mismatched with Explanations)
CREATE TABLE IF NOT EXISTS reconciled_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_no VARCHAR(50) NOT NULL,
    pass_no VARCHAR(50) NOT NULL,
    mill_code VARCHAR(50) NOT NULL REFERENCES mills(mill_code),
    farmer_name VARCHAR(150) NOT NULL,
    farmer_aadhaar VARCHAR(20) NOT NULL,
    govt_net_kg DOUBLE PRECISION NOT NULL,
    mill_net_kg DOUBLE PRECISION NOT NULL,
    moisture_percentage DOUBLE PRECISION NOT NULL,
    net_variance_kg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    reconciliation_status VARCHAR(30) NOT NULL DEFAULT 'MATCH', -- 'MATCH', 'MISMATCH_WEIGHT', 'MISMATCH_MOISTURE', 'DISPUTED', 'RESOLVED'
    discrepancy_reason TEXT,
    final_agreed_net_kg DOUBLE PRECISION NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(100),
    resolved_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. CMR Statutory Settlements & Clearances (67% Out-Turn Target)
CREATE TABLE IF NOT EXISTS cmr_statutory_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mill_code VARCHAR(50) UNIQUE NOT NULL REFERENCES mills(mill_code),
    total_paddy_intake_qtl DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    cmr_67_target_rice_qtl DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_variance_kg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    matched_batches INT NOT NULL DEFAULT 0,
    mismatched_batches INT NOT NULL DEFAULT 0,
    milling_subsidy_amt DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    handling_charges_amt DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    gunny_credit_amt DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_payable_subsidy_amt DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'CORRECTION_REQUESTED'
    approved_by_officer VARCHAR(100),
    jrc_certificate_no VARCHAR(100),
    approval_timestamp TIMESTAMP WITH TIME ZONE
);

-- 6. Farmer DBT Direct Accounts
CREATE TABLE IF NOT EXISTS farmer_dbt_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_name VARCHAR(150) NOT NULL,
    aadhaar_no VARCHAR(20) NOT NULL,
    phone_no VARCHAR(20) NOT NULL,
    bank_account VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    village VARCHAR(100) NOT NULL,
    paddy_sold_qtl DOUBLE PRECISION NOT NULL,
    dbt_payable_amount DOUBLE PRECISION NOT NULL,
    dbt_status VARCHAR(30) NOT NULL DEFAULT 'CREDITED'
);

-- 7. Immutable Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    mill_code VARCHAR(50),
    details JSONB NOT NULL,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
