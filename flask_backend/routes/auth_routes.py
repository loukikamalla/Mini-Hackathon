from flask import Blueprint, request, jsonify
import uuid

auth_bp = Blueprint('auth_bp', __name__)

MILL_ACCOUNTS = {
    "Loukika": {"millCode": "TS-WGL-MR-4412", "millName": "Sri Lakshmi Rice Industries", "manager": "Loukika", "quota": 3500},
    "krishna": {"millCode": "TS-WGL-MR-1108", "millName": "Kakatiya Modern Agro Mills", "manager": "Krishna", "quota": 4200},
    "Vamsi": {"millCode": "TS-WGL-MR-3391", "millName": "Telangana Parboiled Rice Corp", "manager": "Vamsi", "quota": 5000},
    "Lasya": {"millCode": "TS-WGL-MR-2204", "millName": "Bhadrakali Agri Modern Foods", "manager": "Lasya", "quota": 2800}
}

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or {}
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()

    # 1. Civil Supplies Officer (DCSO)
    if (username.lower() in ("dcso.wgl@telangana.gov.in", "dcso")) and password == "Govt@Civil2025":
        return jsonify({
            "success": True,
            "message": "DCSO Authentication Successful",
            "token": f"GOVT-TOKEN-{uuid.uuid4()}",
            "role": "GOVERNMENT_OFFICER",
            "millCode": None,
            "millName": "Warangal District Civil Supplies Oversight",
            "displayName": "Officer R. Kumar (DCSO)"
        })

    # 2. Rice Mill Managers
    if username in MILL_ACCOUNTS and password == "Miller@2025":
        mill_info = MILL_ACCOUNTS[username]
        return jsonify({
            "success": True,
            "message": "Miller Authentication Successful",
            "token": f"MILLER-TOKEN-{uuid.uuid4()}",
            "role": "RICE_MILLER",
            "millCode": mill_info["millCode"],
            "millName": mill_info["millName"],
            "displayName": mill_info["manager"],
            "quota": mill_info["quota"]
        })

    # 3. Mill Code login fallback
    for name, info in MILL_ACCOUNTS.items():
        if username.upper() == info["millCode"] and password == "Miller@2025":
            return jsonify({
                "success": True,
                "message": "Miller Code Authentication Successful",
                "token": f"MILLER-TOKEN-{uuid.uuid4()}",
                "role": "RICE_MILLER",
                "millCode": info["millCode"],
                "millName": info["millName"],
                "displayName": info["manager"],
                "quota": info["quota"]
            })

    return jsonify({"success": False, "message": "Invalid username or password"}), 401
