from flask import Flask, jsonify, render_template
from flask_cors import CORS
from config import Config
from routes.auth_routes import auth_bp
from routes.ingest_routes import ingest_bp
from routes.reconcile_routes import reconcile_bp
from routes.statutory_routes import statutory_bp
from routes.audit_routes import audit_bp
from supabase_client import is_supabase_connected

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v2/auth')
    app.register_blueprint(ingest_bp, url_prefix='/api/v2/ingest')
    app.register_blueprint(reconcile_bp, url_prefix='/api/v2')
    app.register_blueprint(statutory_bp, url_prefix='/api/v2/statutory')
    app.register_blueprint(audit_bp, url_prefix='/api/v2/audit')

    @app.route('/')
    def root():
        return render_template('index.html')

    @app.route('/api/v2')
    def api_info():
        return jsonify({
            "name": "DHANYA CMR Digital Reconciliation & Subsidy Clearance API",
            "version": "2.0.0 (Flask + Supabase)",
            "status": "RUNNING",
            "statutoryCompliance": "CMR 67% Out-Turn Target Active",
            "supabaseConnected": is_supabase_connected,
            "endpoints": {
                "health": "/api/v2/health",
                "auth": "/api/v2/auth/login",
                "procurement": "/api/v2/cmr-procurement",
                "settlement": "/api/v2/settlement",
                "disputes": "/api/v2/disputes/resolve",
                "statutoryApproval": "/api/v2/statutory/approve",
                "auditLogs": "/api/v2/audit/logs"
            }
        })

    @app.route('/api/v2/health', methods=['GET'])
    def health():
        return jsonify({
            "status": "UP",
            "service": "DHANYA Flask 3.0 REST API",
            "database": "Supabase PostgreSQL (Cloud / In-Memory Active)",
            "supabaseConnected": is_supabase_connected,
            "port": Config.PORT
        })

    return app

if __name__ == '__main__':
    app = create_app()
    print("==================================================================")
    print("[DHANYA] Flask + Supabase Backend Server Running on Port 5000")
    print("[DHANYA] Health Check: http://localhost:5000/api/v2/health")
    print("[DHANYA] Direct OPMS Stream: http://localhost:5000/api/v2/cmr-procurement")
    print("==================================================================")
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
