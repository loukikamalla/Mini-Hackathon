from flask import Blueprint, request, jsonify
from services.reconciliation_service import ReconciliationService

reconcile_bp = Blueprint('reconcile_bp', __name__)

MOCK_RECORDS = [
    # Mill 1: Sri Lakshmi Rice Industries (Loukika) - TS-WGL-MR-4412
    {
        "id": 1,
        "truckNo": "TS03UB9912",
        "passNo": "TP-2025-081",
        "millCode": "TS-WGL-MR-4412",
        "farmerName": "K. Mallesh",
        "farmerAadhaar": "XXXX-XXXX-9812",
        "farmerPhone": "9848011221",
        "paddyVariety": "BPT-5204 (Sona Masoori)",
        "govtGrossKg": 24500, "govtTareKg": 8500, "govtNetKg": 16000,
        "millGrossKg": 24500, "millTareKg": 8500, "millNetKg": 16000,
        "moisture": 16.2, "netVarianceKg": 0.0,
        "reconciliationStatus": "MATCH",
        "discrepancyReason": "100% Gross/Net Weight verified within statutory ±1% tolerance",
        "finalAgreedNetKg": 16000
    },
    {
        "id": 2,
        "truckNo": "TS03UB4481",
        "passNo": "TP-2025-082",
        "millCode": "TS-WGL-MR-4412",
        "farmerName": "B. Ramesh",
        "farmerAadhaar": "XXXX-XXXX-1142",
        "farmerPhone": "9848011222",
        "paddyVariety": "RNR-15048 (Telangana Sona)",
        "govtGrossKg": 22100, "govtTareKg": 8100, "govtNetKg": 14000,
        "millGrossKg": 21950, "millTareKg": 8100, "millNetKg": 13850,
        "moisture": 17.8, "netVarianceKg": -150.0,
        "reconciliationStatus": "MISMATCH",
        "discrepancyReason": "Moisture 17.8% (>17% threshold) & Tare variation -150 kg (-1.07%)",
        "finalAgreedNetKg": 13850
    },
    {
        "id": 3,
        "truckNo": "TS03UB7721",
        "passNo": "TP-2025-083",
        "millCode": "TS-WGL-MR-4412",
        "farmerName": "G. Venkatiah",
        "farmerAadhaar": "XXXX-XXXX-3345",
        "farmerPhone": "9848011223",
        "paddyVariety": "MTU-1010 (Raw Paddy)",
        "govtGrossKg": 26800, "govtTareKg": 8800, "govtNetKg": 18000,
        "millGrossKg": 26800, "millTareKg": 8800, "millNetKg": 18000,
        "moisture": 15.8, "netVarianceKg": 0.0,
        "reconciliationStatus": "MATCH",
        "discrepancyReason": "Transit pass net weight aligns with weighbridge scale",
        "finalAgreedNetKg": 18000
    },
    {
        "id": 4,
        "truckNo": "TS03UB1102",
        "passNo": "TP-2025-084",
        "millCode": "TS-WGL-MR-4412",
        "farmerName": "M. Saritha",
        "farmerAadhaar": "XXXX-XXXX-5521",
        "farmerPhone": "9848011224",
        "paddyVariety": "KNM-118 (Fine Paddy)",
        "govtGrossKg": 19500, "govtTareKg": 7500, "govtNetKg": 12000,
        "millGrossKg": 19200, "millTareKg": 7500, "millNetKg": 11700,
        "moisture": 18.2, "netVarianceKg": -300.0,
        "reconciliationStatus": "MISMATCH",
        "discrepancyReason": "Moisture 18.2% (>17% threshold) & Scale mismatch -300 kg (-2.50%)",
        "finalAgreedNetKg": 11700
    },
    {
        "id": 5,
        "truckNo": "TS03UB6633",
        "passNo": "TP-2025-085",
        "millCode": "TS-WGL-MR-4412",
        "farmerName": "P. Sammaiah",
        "farmerAadhaar": "XXXX-XXXX-7788",
        "farmerPhone": "9848011225",
        "paddyVariety": "BPT-5204 (Sona Masoori)",
        "govtGrossKg": 25200, "govtTareKg": 8200, "govtNetKg": 17000,
        "millGrossKg": 25200, "millTareKg": 8200, "millNetKg": 17000,
        "moisture": 16.4, "netVarianceKg": 0.0,
        "reconciliationStatus": "MATCH",
        "discrepancyReason": "Verified Transit Pass & Inward Weighbridge Scale match",
        "finalAgreedNetKg": 17000
    },
    {
        "id": 6,
        "truckNo": "TS03UB5541",
        "passNo": "TP-2025-086",
        "millCode": "TS-WGL-MR-4412",
        "farmerName": "V. Narsaiah",
        "farmerAadhaar": "XXXX-XXXX-6612",
        "farmerPhone": "9848011226",
        "paddyVariety": "RNR-15048 (Telangana Sona)",
        "govtGrossKg": 23000, "govtTareKg": 8000, "govtNetKg": 15000,
        "millGrossKg": 23000, "millTareKg": 8000, "millNetKg": 15000,
        "moisture": 15.5, "netVarianceKg": 0.0,
        "reconciliationStatus": "MATCH",
        "discrepancyReason": "Weight variance within permissible ±1.0% buffer",
        "finalAgreedNetKg": 15000
    },

    # Mill 2: Kakatiya Modern Agro Mills (Krishna) - TS-WGL-MR-1108
    {
        "id": 7,
        "truckNo": "TS03UC8821",
        "passNo": "TP-2025-091",
        "millCode": "TS-WGL-MR-1108",
        "farmerName": "D. Satyanarayana",
        "farmerAadhaar": "XXXX-XXXX-4411",
        "farmerPhone": "9848011227",
        "paddyVariety": "BPT-5204 (Sona Masoori)",
        "govtGrossKg": 26000, "govtTareKg": 8000, "govtNetKg": 18000,
        "millGrossKg": 26000, "millTareKg": 8000, "millNetKg": 18000,
        "moisture": 16.0, "netVarianceKg": 0.0,
        "reconciliationStatus": "MATCH",
        "discrepancyReason": "100% Gross & Tare matched on digital weighbridge",
        "finalAgreedNetKg": 18000
    },
    {
        "id": 8,
        "truckNo": "TS03UC2290",
        "passNo": "TP-2025-092",
        "millCode": "TS-WGL-MR-1108",
        "farmerName": "A. Srinivas",
        "farmerAadhaar": "XXXX-XXXX-5522",
        "farmerPhone": "9848011228",
        "paddyVariety": "MTU-1010 (Raw Paddy)",
        "govtGrossKg": 23500, "govtTareKg": 8100, "govtNetKg": 15400,
        "millGrossKg": 23200, "millTareKg": 8100, "millNetKg": 15100,
        "moisture": 17.5, "netVarianceKg": -300.0,
        "reconciliationStatus": "MISMATCH",
        "discrepancyReason": "Moisture 17.5% (>17% limit) & Scale variation -300 kg (-1.95%)",
        "finalAgreedNetKg": 15100
    },
    {
        "id": 9,
        "truckNo": "TS03UC3311",
        "passNo": "TP-2025-093",
        "millCode": "TS-WGL-MR-1108",
        "farmerName": "T. Lingaiah",
        "farmerAadhaar": "XXXX-XXXX-6633",
        "farmerPhone": "9848011229",
        "paddyVariety": "RNR-15048 (Telangana Sona)",
        "govtGrossKg": 27200, "govtTareKg": 8800, "govtNetKg": 18400,
        "millGrossKg": 27200, "millTareKg": 8800, "millNetKg": 18400,
        "moisture": 15.9, "netVarianceKg": 0.0,
        "reconciliationStatus": "MATCH",
        "discrepancyReason": "Fully reconciled and verified",
        "finalAgreedNetKg": 18400
    },

    # Mill 3: Telangana Parboiled Rice Corp (Vamsi) - TS-WGL-MR-3391
    {
        "id": 10,
        "truckNo": "TS03UD4419",
        "passNo": "TP-2025-101",
        "millCode": "TS-WGL-MR-3391",
        "farmerName": "Ch. Yadaiah",
        "farmerAadhaar": "XXXX-XXXX-7744",
        "farmerPhone": "9848011230",
        "paddyVariety": "KNM-118 (Fine Paddy)",
        "govtGrossKg": 28000, "govtTareKg": 9000, "govtNetKg": 19000,
        "millGrossKg": 28000, "millTareKg": 9000, "millNetKg": 19000,
        "moisture": 16.5, "netVarianceKg": 0.0,
        "reconciliationStatus": "MATCH",
        "discrepancyReason": "Scale calibration verified within statutory tolerance",
        "finalAgreedNetKg": 19000
    },
    {
        "id": 11,
        "truckNo": "TS03UD8833",
        "passNo": "TP-2025-102",
        "millCode": "TS-WGL-MR-3391",
        "farmerName": "Y. Anjaiah",
        "farmerAadhaar": "XXXX-XXXX-8855",
        "farmerPhone": "9848011231",
        "paddyVariety": "BPT-5204 (Sona Masoori)",
        "govtGrossKg": 25000, "govtTareKg": 8400, "govtNetKg": 16600,
        "millGrossKg": 24750, "millTareKg": 8400, "millNetKg": 16350,
        "moisture": 17.9, "netVarianceKg": -250.0,
        "reconciliationStatus": "MISMATCH",
        "discrepancyReason": "Moisture 17.9% (>17% limit) with -250 kg scale variance (-1.51%)",
        "finalAgreedNetKg": 16350
    },

    # Mill 4: Bhadrakali Agri Modern Foods (Lasya) - TS-WGL-MR-2204
    {
        "id": 12,
        "truckNo": "TS03UE1199",
        "passNo": "TP-2025-111",
        "millCode": "TS-WGL-MR-2204",
        "farmerName": "S. Kavitha",
        "farmerAadhaar": "XXXX-XXXX-9966",
        "farmerPhone": "9848011232",
        "paddyVariety": "RNR-15048 (Telangana Sona)",
        "govtGrossKg": 24000, "govtTareKg": 8200, "govtNetKg": 15800,
        "millGrossKg": 24000, "millTareKg": 8200, "millNetKg": 15800,
        "moisture": 16.1, "netVarianceKg": 0.0,
        "reconciliationStatus": "MATCH",
        "discrepancyReason": "Scale weights and moisture certified accurate",
        "finalAgreedNetKg": 15800
    },
    {
        "id": 13,
        "truckNo": "TS03UE7744",
        "passNo": "TP-2025-112",
        "millCode": "TS-WGL-MR-2204",
        "farmerName": "K. Bhaskar",
        "farmerAadhaar": "XXXX-XXXX-1177",
        "farmerPhone": "9848011233",
        "paddyVariety": "MTU-1010 (Raw Paddy)",
        "govtGrossKg": 22800, "govtTareKg": 8000, "govtNetKg": 14800,
        "millGrossKg": 22600, "millTareKg": 8000, "millNetKg": 14600,
        "moisture": 17.6, "netVarianceKg": -200.0,
        "reconciliationStatus": "MISMATCH",
        "discrepancyReason": "Moisture 17.6% & Tare difference -200 kg (-1.35%)",
        "finalAgreedNetKg": 14600
    }
]

@reconcile_bp.route('/cmr-procurement', methods=['GET'])
def get_procurement_records():
    mill_code = request.args.get('millCode', 'ALL')
    if mill_code == 'ALL':
        records = MOCK_RECORDS
    else:
        records = [r for r in MOCK_RECORDS if r.get('millCode') == mill_code]
        if not records:
            records = [r for r in MOCK_RECORDS if r.get('millCode') == 'TS-WGL-MR-4412']
            
    return jsonify({
        "success": True,
        "count": len(records),
        "data": records,
        "source": "Telangana State OPMS Procurement Live Stream"
    })

@reconcile_bp.route('/settlement', methods=['GET'])
def get_settlement_summary():
    mill_code = request.args.get('millCode', 'TS-WGL-MR-4412')
    if mill_code == 'ALL':
        records = MOCK_RECORDS
    else:
        records = [r for r in MOCK_RECORDS if r.get('millCode') == mill_code]
        if not records:
            records = [r for r in MOCK_RECORDS if r.get('millCode') == 'TS-WGL-MR-4412']

    stats = ReconciliationService.calculate_statutory_settlement(records, mill_code)
    return jsonify({
        "success": True,
        "settlement": stats
    })

from datetime import datetime
import uuid

# System Bilateral Notifications Store
SYSTEM_NOTIFICATIONS = [
    {
        "id": "notif-101",
        "recipient": "TS-WGL-MR-4412",
        "sender": "Officer R. Kumar (DCSO)",
        "type": "CORRECTION_NOTICE",
        "title": "Moisture & Scale Notice",
        "message": "DCSO issued notice on Truck TS03UB1102 (Moisture 18.2% exceeds 17% limit). Joint physical scale recalibration required.",
        "recordId": 4,
        "timestamp": datetime.now().strftime("%I:%M %p"),
        "status": "ACTIVE"
    }
]

@reconcile_bp.route('/notifications', methods=['GET'])
def get_notifications():
    recipient = request.args.get('recipient', 'ALL')
    if recipient == 'ALL' or recipient == 'DCSO':
        # Filter for DCSO or District broad notifications
        notifs = [n for n in SYSTEM_NOTIFICATIONS if n['recipient'] in ('DCSO', 'ALL')]
    else:
        # Filter for specific mill
        notifs = [n for n in SYSTEM_NOTIFICATIONS if n['recipient'] in (recipient, 'ALL')]
    
    return jsonify({
        "success": True,
        "count": len(notifs),
        "notifications": notifs
    })

@reconcile_bp.route('/notifications/dismiss', methods=['POST'])
def dismiss_notification():
    data = request.get_json(force=True, silent=True) or {}
    notif_id = data.get('id')
    for n in SYSTEM_NOTIFICATIONS:
        if n['id'] == notif_id:
            n['status'] = 'DISMISSED'
            return jsonify({"success": True, "message": "Notification dismissed"})
    return jsonify({"success": False, "message": "Notification not found"}), 404

@reconcile_bp.route('/disputes/resolve', methods=['POST'])
def resolve_dispute():
    data = request.get_json(force=True, silent=True) or {}
    record_id = int(data.get('recordId', 0))
    action = data.get('action', 'APPROVE_RECALIBRATION')  # 'APPROVE_RECALIBRATION', 'REJECT', 'REQUEST_CORRECTION', 'MILLER_SUBMIT_CORRECTION'
    agreed_qty = float(data.get('agreedQuantity', 0))
    notes = data.get('notes', 'Joint inspection calibrated')
    user_role = data.get('userRole', 'GOVERNMENT_OFFICER')
    mill_name = data.get('millName', 'Sri Lakshmi Rice Industries')
    manager_name = data.get('managerName', 'Loukika')

    now_time = datetime.now().strftime("%I:%M %p")

    for r in MOCK_RECORDS:
        if r['id'] == record_id:
            # 1. MILLER SUBMITS CORRECTION / RECALIBRATION
            if action == 'MILLER_SUBMIT_CORRECTION' or user_role == 'RICE_MILLER':
                r['millNetKg'] = agreed_qty
                r['finalAgreedNetKg'] = agreed_qty
                r['netVarianceKg'] = round(r['govtNetKg'] - agreed_qty, 2)
                r['reconciliationStatus'] = 'CORRECTION_SUBMITTED'
                r['discrepancyReason'] = f"RECALIBRATED BY MILLER ({manager_name}): {notes} (Submitted Net: {agreed_qty:,.1f} kg) - Awaiting DCSO Approval"
                
                # Clear existing mill notice if any
                for n in SYSTEM_NOTIFICATIONS:
                    if n.get('recordId') == record_id and n.get('recipient') == r['millCode']:
                        n['status'] = 'CLEARED_BY_MILLER'

                # Push instant notification to DCSO
                new_notif = {
                    "id": f"notif-{uuid.uuid4().hex[:6]}",
                    "recipient": "DCSO",
                    "sender": f"Miller ({manager_name}) - {mill_name}",
                    "type": "MILLER_RECALIBRATION_SUBMITTED",
                    "title": f"Recalibration Submitted for {r['truckNo']}",
                    "message": f"Miller {manager_name} recalibrated Truck {r['truckNo']} to {agreed_qty:,.1f} kg ({notes}). Ready for DCSO approval.",
                    "recordId": record_id,
                    "timestamp": now_time,
                    "status": "ACTIVE"
                }
                SYSTEM_NOTIFICATIONS.insert(0, new_notif)

                return jsonify({
                    "success": True,
                    "message": f"Recalibration submitted successfully! DCSO notified for final verification.",
                    "updatedRecord": r,
                    "notification": new_notif
                })

            # 2. DCSO APPROVES RECALIBRATION
            elif action == 'APPROVE_RECALIBRATION' or action == 'APPROVE':
                r['millNetKg'] = agreed_qty
                r['finalAgreedNetKg'] = agreed_qty
                r['netVarianceKg'] = round(r['govtNetKg'] - agreed_qty, 2)
                r['reconciliationStatus'] = 'MATCH'
                r['discrepancyReason'] = f"RESOLVED & APPROVED BY DCSO: {notes} (Calibrated Net: {agreed_qty:,.1f} kg)"

                # Clear pending DCSO notifications for this record
                for n in SYSTEM_NOTIFICATIONS:
                    if n.get('recordId') == record_id:
                        n['status'] = 'APPROVED'

                # Push notification to Miller
                new_notif = {
                    "id": f"notif-{uuid.uuid4().hex[:6]}",
                    "recipient": r['millCode'],
                    "sender": "Officer R. Kumar (DCSO)",
                    "type": "DCSO_APPROVED",
                    "title": f"Consignment {r['truckNo']} Approved",
                    "message": f"Officer R. Kumar approved calibrated weight of {agreed_qty:,.1f} kg for Truck {r['truckNo']}.",
                    "recordId": record_id,
                    "timestamp": now_time,
                    "status": "ACTIVE"
                }
                SYSTEM_NOTIFICATIONS.insert(0, new_notif)

                return jsonify({
                    "success": True,
                    "message": f"Dispute for {r['truckNo']} calibrated and approved at {agreed_qty:,.1f} kg.",
                    "updatedRecord": r,
                    "notification": new_notif
                })

            # 3. DCSO REJECTS CONSIGNMENT
            elif action == 'REJECT':
                r['reconciliationStatus'] = 'REJECTED'
                r['discrepancyReason'] = f"REJECTED BY DCSO: {notes}"
                
                new_notif = {
                    "id": f"notif-{uuid.uuid4().hex[:6]}",
                    "recipient": r['millCode'],
                    "sender": "Officer R. Kumar (DCSO)",
                    "type": "CONSIGNMENT_REJECTED",
                    "title": f"Consignment {r['truckNo']} REJECTED",
                    "message": f"DCSO rejected Truck {r['truckNo']}. Reason: {notes}",
                    "recordId": record_id,
                    "timestamp": now_time,
                    "status": "ACTIVE"
                }
                SYSTEM_NOTIFICATIONS.insert(0, new_notif)

                return jsonify({
                    "success": True,
                    "message": f"Consignment {r['truckNo']} was rejected by DCSO authority.",
                    "updatedRecord": r,
                    "notification": new_notif
                })

            # 4. DCSO ISSUES CORRECTION NOTICE TO MILLER
            elif action == 'REQUEST_CORRECTION':
                r['reconciliationStatus'] = 'CORRECTION_REQUESTED'
                r['discrepancyReason'] = f"CORRECTION NOTICE ISSUED BY DCSO: {notes}"

                new_notif = {
                    "id": f"notif-{uuid.uuid4().hex[:6]}",
                    "recipient": r['millCode'],
                    "sender": "Officer R. Kumar (DCSO)",
                    "type": "CORRECTION_NOTICE",
                    "title": f"Correction Notice: Truck {r['truckNo']}",
                    "message": f"DCSO requested scale recalibration for Truck {r['truckNo']}. Justification: {notes}",
                    "recordId": record_id,
                    "timestamp": now_time,
                    "status": "ACTIVE"
                }
                SYSTEM_NOTIFICATIONS.insert(0, new_notif)

                return jsonify({
                    "success": True,
                    "message": f"Correction request dispatched to Miller for {r['truckNo']} with instant notification.",
                    "updatedRecord": r,
                    "notification": new_notif
                })

    return jsonify({"success": False, "message": "Record ID not found"}), 404


