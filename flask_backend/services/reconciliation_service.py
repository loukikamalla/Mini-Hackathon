import pandas as pd
import numpy as np

class ReconciliationService:
    @staticmethod
    def calculate_statutory_settlement(records, mill_code="TS-WGL-MR-4412"):
        """
        Computes statutory 67% CMR Out-Turn Ratio & Milling Remuneration amounts.
        Statutory Rules:
        - Mandatory 67% CMR Out-turn: (100 Qtl Paddy = 67 Qtl CMR Raw Rice)
        - Statutory Milling Remuneration: ₹25.00 / Qtl
            * Base Milling Charge: ₹10.00 / Qtl
            * Handling & Unloading: ₹4.50 / Qtl
            * Gunny Bag Depreciation Credit: ₹4.40 / Qtl
            * Quality & Timely Delivery Incentive: ₹6.10 / Qtl
            * Total Remuneration = ₹25.00 / Qtl
        - Discrepancy Threshold: Weight mismatch > ±1.0% or Moisture > 17.0%
        """
        if not records:
            return {
                "millCode": mill_code,
                "totalPaddyKg": 0.0,
                "totalPaddyQtl": 0.0,
                "cmr67TargetQtl": 0.0,
                "totalVarianceKg": 0.0,
                "matchedBatches": 0,
                "mismatchedBatches": 0,
                "millingSubsidyAmount": 0.0,
                "handlingChargesAmount": 0.0,
                "gunnyCreditsAmount": 0.0,
                "incentiveAmount": 0.0,
                "totalPayableSubsidy": 0.0,
                "millingRatePerQtl": 25.00,
                "approvalStatus": "PENDING"
            }

        df = pd.DataFrame(records)
        
        # Calculate total paddy intake in kg and quintals
        if 'millNetKg' in df:
            total_paddy_kg = float(df['millNetKg'].sum())
        elif 'finalAgreedNetKg' in df:
            total_paddy_kg = float(df['finalAgreedNetKg'].sum())
        else:
            total_paddy_kg = 0.0

        total_paddy_qtl = round(total_paddy_kg / 100.0, 2)
        
        # Statutory 67% CMR Out-Turn Norm
        cmr_67_target_qtl = round(total_paddy_qtl * 0.67, 2)
        
        # Total absolute scale variance
        if 'netVarianceKg' in df:
            total_variance_kg = float(df['netVarianceKg'].abs().sum())
        else:
            total_variance_kg = 0.0
            
        matched_batches = int((df['reconciliationStatus'].str.upper() == 'MATCH').sum()) if 'reconciliationStatus' in df else 0
        mismatched_batches = len(df) - matched_batches
        
        # Statutory ₹25.00/Qtl Milling Remuneration breakdown
        base_milling = round(total_paddy_qtl * 10.00, 2)
        handling = round(total_paddy_qtl * 4.50, 2)
        gunny_credit = round(total_paddy_qtl * 4.40, 2)
        delivery_incentive = round(total_paddy_qtl * 6.10, 2)
        total_payable = round(total_paddy_qtl * 25.00, 2)
        
        return {
            "millCode": mill_code,
            "totalPaddyKg": total_paddy_kg,
            "totalPaddyQtl": total_paddy_qtl,
            "cmr67TargetQtl": cmr_67_target_qtl,
            "totalVarianceKg": total_variance_kg,
            "matchedBatches": matched_batches,
            "mismatchedBatches": mismatched_batches,
            "millingSubsidyAmount": base_milling,
            "handlingChargesAmount": handling,
            "gunnyCreditsAmount": gunny_credit,
            "incentiveAmount": delivery_incentive,
            "totalPayableSubsidy": total_payable,
            "millingRatePerQtl": 25.00,
            "approvalStatus": "PENDING"
        }

    @staticmethod
    def detect_discrepancy(govt_net_kg, mill_net_kg, moisture):
        """
        Statutory 3-Point Discrepancy Verification:
        - Weight Tolerance: Variance must not exceed ±1.0% of Govt Mandi Net Weight.
        - Moisture Threshold: Maximum permissible moisture is 17.0%.
        """
        variance_kg = round(govt_net_kg - mill_net_kg, 2)
        tolerance_kg = govt_net_kg * 0.01  # ±1% tolerance
        
        is_weight_ok = abs(variance_kg) <= tolerance_kg
        is_moisture_ok = moisture <= 17.0
        
        if is_weight_ok and is_moisture_ok:
            return "MATCH", "Verified within statutory ±1.0% tolerance & 17% moisture limit", variance_kg
        
        reasons = []
        if not is_weight_ok:
            variance_pct = round((abs(variance_kg) / govt_net_kg) * 100.0, 2) if govt_net_kg > 0 else 0
            reasons.append(f"Scale mismatch {variance_kg:+0.1f} kg ({variance_pct}% exceeds ±1% limit)")
        if not is_moisture_ok:
            excess_moisture = round(moisture - 17.0, 2)
            reasons.append(f"Moisture {moisture}% exceeds statutory 17.0% threshold by +{excess_moisture}%")
            
        return "MISMATCH", " • ".join(reasons), variance_kg

    @staticmethod
    def reconcile_excel_files(govt_file_path, mill_file_path):
        """
        Ingests Government OPMS Manifest and Mill Weighbridge statement and
        produces an automated reconciliation table with variance reasons.
        """
        govt_df = pd.read_excel(govt_file_path)
        mill_df = pd.read_excel(mill_file_path)
        
        # Normalize column headers
        govt_df.columns = [str(c).strip().lower().replace(' ', '_') for c in govt_df.columns]
        mill_df.columns = [str(c).strip().lower().replace(' ', '_') for c in mill_df.columns]
        
        reconciled = []
        for idx, g_row in govt_df.iterrows():
            truck = str(g_row.get('truck_no', g_row.get('truck', ''))).strip().upper()
            g_net = float(g_row.get('net_weight_kg', g_row.get('govt_net_kg', 0)))
            moisture = float(g_row.get('moisture_percentage', g_row.get('moisture', 16.0)))
            
            # Find matching truck in mill data
            matching_mill = mill_df[mill_df['truck_no'].astype(str).str.strip().str.upper() == truck]
            
            if not matching_mill.empty:
                m_row = matching_mill.iloc[0]
                m_net = float(m_row.get('net_weight_kg', m_row.get('mill_net_kg', g_net)))
                status, reason, variance = ReconciliationService.detect_discrepancy(g_net, m_net, moisture)
                
                reconciled.append({
                    "truckNo": truck,
                    "passNo": str(g_row.get('transit_pass_no', g_row.get('pass_no', f"TP-{idx+1}"))),
                    "farmerName": str(g_row.get('farmer_name', 'Farmer')),
                    "govtNetKg": g_net,
                    "millNetKg": m_net,
                    "moisture": moisture,
                    "netVarianceKg": variance,
                    "reconciliationStatus": status,
                    "discrepancyReason": reason,
                    "finalAgreedNetKg": m_net
                })
        
        return reconciled
