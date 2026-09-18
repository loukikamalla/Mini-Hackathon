from flask import Blueprint, jsonify
from datetime import datetime

audit_bp = Blueprint('audit_bp', __name__)

AUDIT_ENTRIES = [
    {"id": 1, "action": "DATA_INGESTION", "user": "SYSTEM", "details": "Telangana OPMS Mandi stream fetched 6 records", "timestamp": "2026-09-15 08:30:00"},
    {"id": 2, "action": "WEIGHBRIDGE_SYNC", "user": "Loukika", "details": "Uploaded weighbridge intake manifest for TS-WGL-MR-4412", "timestamp": "2026-09-15 08:45:00"},
    {"id": 3, "action": "RECONCILIATION_RUN", "user": "ENGINE", "details": "Found 4 Matches, 2 Discrepancies (Moisture & Tare)", "timestamp": "2026-09-15 08:46:00"},
    {"id": 4, "action": "DISPUTE_RECALIBRATION", "user": "Officer R. Kumar (DCSO)", "details": "Recalibrated TS03UB4481 moisture cut from 14,000 kg to 13,850 kg", "timestamp": "2026-09-15 09:15:00"},
    {"id": 5, "action": "SUBSIDY_CLEARANCE", "user": "Officer R. Kumar (DCSO)", "details": "Statutory Subsidy Approved: Rs 1,67,926.50 under PFMS-TS-2025-CLEAR-4412", "timestamp": "2026-09-15 09:30:00"}
]

@audit_bp.route('/logs', methods=['GET'])
def get_audit_logs():
    return jsonify({
        "success": True,
        "count": len(AUDIT_ENTRIES),
        "logs": AUDIT_ENTRIES
    })
