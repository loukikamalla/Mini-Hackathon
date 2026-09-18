from flask import Blueprint, request, jsonify, send_file
import os
from services.jrc_pdf_service import JRCPdfService
from config import Config

statutory_bp = Blueprint('statutory_bp', __name__)

APPROVAL_STATES = {}

@statutory_bp.route('/approve', methods=['POST'])
def approve_subsidy_batch():
    data = request.get_json(force=True, silent=True) or {}
    mill_code = data.get('millCode', 'TS-WGL-MR-4412')
    mill_name = data.get('millName', 'Sri Lakshmi Rice Industries')
    manager_name = data.get('managerName', 'Loukika')
    total_paddy_qtl = float(data.get('totalPaddyQtl', 888.50))
    cmr_67_target_qtl = float(data.get('cmr67TargetQtl', 595.30))
    total_subsidy = float(data.get('totalPayableSubsidy', 167926.50))

    cert_id = f"JRC-2025-TS-{mill_code[-4:]}"
    pdf_path = JRCPdfService.generate_certificate(
        mill_name, manager_name, mill_code, total_paddy_qtl, cmr_67_target_qtl, total_subsidy, cert_id
    )

    APPROVAL_STATES[mill_code] = {
        "status": "APPROVED",
        "approvedBy": "Officer R. Kumar (DCSO)",
        "certificateId": cert_id,
        "paymentToken": f"PFMS-TS-2025-CLEAR-{mill_code[-4:]}",
        "pdfPath": pdf_path
    }

    return jsonify({
        "success": True,
        "message": "Statutory Subsidy Approved and Cleared for Payment",
        "approvalDetails": APPROVAL_STATES[mill_code]
    })

@statutory_bp.route('/jrc-pdf/<cert_id>', methods=['GET'])
def download_jrc_pdf(cert_id):
    pdf_path = os.path.join(Config.CERT_FOLDER, f"{cert_id}.pdf")
    if os.path.exists(pdf_path):
        return send_file(pdf_path, as_attachment=True, download_name=f"{cert_id}.pdf")
    return jsonify({"success": False, "message": "Certificate PDF not found"}), 404
