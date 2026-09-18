import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from config import Config
from services.reconciliation_service import ReconciliationService
from services.ocr_service import OCRService

ingest_bp = Blueprint('ingest_bp', __name__)

@ingest_bp.route('/excel-reconcile', methods=['POST'])
def upload_excel_reconcile():
    if 'govt_file' not in request.files or 'mill_file' not in request.files:
        return jsonify({"success": False, "message": "Both govt_file and mill_file are required"}), 400

    govt_file = request.files['govt_file']
    mill_file = request.files['mill_file']

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    g_path = os.path.join(Config.UPLOAD_FOLDER, secure_filename(govt_file.filename))
    m_path = os.path.join(Config.UPLOAD_FOLDER, secure_filename(mill_file.filename))

    govt_file.save(g_path)
    mill_file.save(m_path)

    try:
        reconciled_data = ReconciliationService.reconcile_excel_files(g_path, m_path)
        settlement = ReconciliationService.calculate_statutory_settlement(reconciled_data)
        return jsonify({
            "success": True,
            "message": "Excel reconciliation completed successfully",
            "recordsCount": len(reconciled_data),
            "reconciledRecords": reconciled_data,
            "settlement": settlement
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Reconciliation error: {str(e)}"}), 500

@ingest_bp.route('/ocr-slip', methods=['POST'])
def ocr_handwritten_slip():
    if 'photo' not in request.files:
        return jsonify({"success": False, "message": "No photo file provided"}), 400

    photo = request.files['photo']
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    p_path = os.path.join(Config.UPLOAD_FOLDER, secure_filename(photo.filename))
    photo.save(p_path)

    try:
        ocr_result = OCRService.process_handwritten_slip(p_path)
        return jsonify(ocr_result)
    except Exception as e:
        return jsonify({"success": False, "message": f"OCR processing failed: {str(e)}"}), 500

@ingest_bp.route('/manual-slip', methods=['POST'])
def add_manual_slip():
    data = request.get_json() or {}
    truck_no = data.get('truckNo')
    gross_kg = float(data.get('grossWeight', 0))
    tare_kg = float(data.get('tareWeight', 0))
    net_kg = gross_kg - tare_kg

    return jsonify({
        "success": True,
        "message": f"Manual slip for {truck_no} registered with Net Weight {net_kg} kg",
        "record": {
            "truckNo": truck_no,
            "grossWeightKg": gross_kg,
            "tareWeightKg": tare_kg,
            "netWeightKg": net_kg,
            "status": "ENTERED"
        }
    })
