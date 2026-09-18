import pandas as pd
import numpy as np

class ReconciliationService:
    @staticmethod
    def calculate_statutory_settlement(records, mill_code="TS-WGL-MR-4412"):
        """
        Computes statutory 67% CMR Out-Turn Ratio & Milling/Handling Subsidy amounts.
        Statutory Rules:
        - Out-turn: 67% of Net Paddy (100 Qtl Paddy = 67 Qtl CMR Raw Rice)
        - Milling Subsidy: Rs 10.00 / Qtl
        - Handling Subsidy: Rs 4.50 / Qtl
        - Gunny Bag Credit: Rs 2.20 / Bag (~2 bags per quintal = Rs 4.40 / Qtl)
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
                "totalPayableSubsidy": 0.0,
                "approvalStatus": "PENDING"
            }

        df = pd.DataFrame(records)
        
        total_paddy_kg = float(df['millNetKg'].sum() if 'millNetKg' in df else df['finalAgreedNetKg'].sum())
        total_paddy_qtl = round(total_paddy_kg / 100.0, 2)
        
        # Statutory 67% CMR Out-Turn
        cmr_67_target_qtl = round(total_paddy_qtl * 0.67, 2)
        
        # Variance calculation
        if 'netVarianceKg' in df:
            total_variance_kg = float(df['netVarianceKg'].abs().sum())
        else:
            total_variance_kg = 0.0
            
        matched_batches = int((df['reconciliationStatus'].str.upper() == 'MATCH').sum()) if 'reconciliationStatus' in df else 0
        mismatched_batches = len(df) - matched_batches
        
        # Subsidy computations
        milling_subsidy = round(total_paddy_qtl * 10.0, 2)
        handling_charges = round(total_paddy_qtl * 4.50, 2)
        gunny_credits = round(total_paddy_qtl * 4.40, 2)
        total_payable = round(milling_subsidy + handling_charges + gunny_credits, 2)
        
        return {
            "millCode": mill_code,
            "totalPaddyKg": total_paddy_kg,
            "totalPaddyQtl": total_paddy_qtl,
            "cmr67TargetQtl": cmr_67_target_qtl,
            "totalVarianceKg": total_variance_kg,
            "matchedBatches": matched_batches,
            "mismatchedBatches": mismatched_batches,
            "millingSubsidyAmount": milling_subsidy,
            "handlingChargesAmount": handling_charges,
            "gunnyCreditsAmount": gunny_credits,
            "totalPayableSubsidy": total_payable,
            "approvalStatus": "CLEARED_FOR_PAYMENT"
        }

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
                variance = round(g_net - m_net, 2)
                
                if abs(variance) < 20.0 and moisture <= 17.0:
                    status = "MATCH"
                    reason = "Weight & Moisture match within permissible statutory limits"
                else:
                    status = "MISMATCH"
                    reasons = []
                    if abs(variance) >= 20.0:
                        reasons.append(f"Tare/Gross Variance {variance:+0.1f} kg")
                    if moisture > 17.0:
                        reasons.append(f"Moisture {moisture}% exceeds 17% statutory threshold")
                    reason = " • ".join(reasons)
                
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
