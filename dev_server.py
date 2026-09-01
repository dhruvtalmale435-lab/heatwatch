import os
import sys
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import pickle
import numpy as np
from datetime import datetime, timezone

# Ensure UTF-8 output on Windows consoles
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Import live satellite sync service
sys.path.append(os.path.join(DIRECTORY, "backend"))
try:
    import live_service
    print("[HeatWatch AI] Ingestion & Attribution Engine linked for automatic background syncing.")
except Exception as e:
    print(f"[HeatWatch AI] live_service import note: {e}")
    live_service = None

def run_periodic_live_sync():
    """Background thread to keep live NASA satellite telemetry fresh continuously."""
    time.sleep(3) # Initial brief delay
    while True:
        if live_service:
            try:
                print("[HeatWatch Auto-Sync] Checking and updating live NASA FIRMS telemetry...", flush=True)
                live_service.run_sync()
                print("[HeatWatch Auto-Sync] [OK] Successfully refreshed live satellite observations & ML attribution.", flush=True)
            except Exception as e:
                print(f"[HeatWatch Auto-Sync] Sync note: {e}", flush=True)
        # Sleep for 15 minutes (900 seconds) between live orbital pass checks
        time.sleep(900)

sync_thread = threading.Thread(target=run_periodic_live_sync, daemon=True)
sync_thread.start()

# 1. Load Trained ML Model (Brain 1)
MODEL_PATH = os.path.join(DIRECTORY, "ml_engine1", "models", "attribution_model.pkl")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(DIRECTORY, "attribution_model.pkl")

attribution_model = None
if os.path.exists(MODEL_PATH):
    try:
        with open(MODEL_PATH, "rb") as f:
            attribution_model = pickle.load(f)
        print(f"[HeatWatch AI] Successfully loaded trained attribution model from {MODEL_PATH}")
    except Exception as e:
        print(f"[HeatWatch AI] Model loading error: {e}")

# 2. Initialize Anomaly Engine (Brain 2)
sys.path.append(os.path.join(DIRECTORY, "ml_engine1", "models"))
try:
    from anomaly_engine import AnomalyEngine
    anomaly_engine = AnomalyEngine()
    print("[HeatWatch AI] Initialized Anomaly Engine (Brain 2)")
except Exception as e:
    print(f"[HeatWatch AI] Anomaly engine load note: {e}")
    anomaly_engine = None

CATEGORY_LABELS = {
    0: "Refinery / Petrochemical Flare",
    1: "Super Thermal Power Plant",
    2: "Coal Mining Seam Fire",
    3: "Vegetation Wildfire",
    4: "Agricultural Stubble Burning",
    5: "Solar Glint / False Positive"
}

VERIFIED_AUDIT_LEDGER = [
    {
        "object_id": "OBJ-1049",
        "verified_category": "industrial",
        "verified_by": "Disaster_Control_Gujarat",
        "timestamp_utc": "2026-08-28T06:15:00Z",
        "notes": "Verified hydrocracker flare escalation."
    }
]

class DevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == '/api/health':
            status_obj = {
                "status": "online",
                "service": "HeatWatch Full-Stack Dev Server",
                "ml_attribution_model_loaded": attribution_model is not None,
                "ml_anomaly_engine_active": anomaly_engine is not None,
                "auto_sync_active": live_service is not None
            }
            body = json.dumps(status_obj).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return
        elif self.path == '/api/statistics':
            stats = {
                "total_verified_cases": len(VERIFIED_AUDIT_LEDGER),
                "ledger": VERIFIED_AUDIT_LEDGER
            }
            body = json.dumps(stats).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return
        elif self.path == '/api/firms/sync':
            if live_service:
                try:
                    live_service.run_sync()
                    res = {"status": "success", "message": "Live NASA FIRMS satellite data and ML attribution re-synced successfully."}
                except Exception as e:
                    res = {"status": "error", "message": str(e)}
            else:
                res = {"status": "error", "message": "Live sync service not loaded"}
            body = json.dumps(res).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return
        return super().do_GET()

    def do_POST(self):
        content_length = self.headers.get('Content-Length')
        length = int(content_length) if content_length else 0
        raw = self.rfile.read(length) if length > 0 else b'{}'
        
        try:
            raw_text = raw.decode('utf-8').strip()
            data = json.loads(raw_text) if raw_text else {}
        except Exception:
            try:
                import ast
                data = ast.literal_eval(raw_text)
            except Exception:
                data = {}

        # 1. Live ML Inference Endpoint (Brain 1)
        if self.path == '/api/ml/attribute':
            try:
                frp = float(data.get("frp", 35.0))
                ti4 = float(data.get("bright_ti4", data.get("tempK", 350.0)))
                ti5 = float(data.get("bright_ti5", 298.0))
                ratio = ti4 / max(ti5, 1.0)
                dist = float(data.get("dist_to_facility_m", data.get("distRefineryM", 200.0)))
                is_inside = 1.0 if dist < 150.0 else 0.0
                builtup = float(data.get("builtup_pct", data.get("builtupPct", 75.0)))
                treecover = float(data.get("treecover_pct", data.get("forestPct", 5.0)))
                cropland = float(data.get("cropland_pct", data.get("croplandPct", 5.0)))
                bare_soil = float(data.get("bare_soil_pct", 15.0))
                nightlight = float(data.get("nightlight_radiance", data.get("nightlight", 70.0)))
                persistence = float(data.get("persistence_days", 85.0))

                feature_vec = np.array([[
                    frp, ti4, ti5, ratio, 0.38, 0.38,
                    dist, is_inside, builtup, treecover, cropland, bare_soil,
                    nightlight, persistence
                ]], dtype=np.float32)

                if attribution_model is not None:
                    probs = attribution_model.predict_proba(feature_vec)[0]
                    predicted_idx = int(np.argmax(probs))
                else:
                    # Deterministic fallback
                    probs = [0.88, 0.05, 0.03, 0.02, 0.01, 0.01]
                    predicted_idx = 0

                classes_list = [
                    {"name": CATEGORY_LABELS[i], "prob": round(float(probs[i]), 4)}
                    for i in range(len(probs))
                ]
                classes_list.sort(key=lambda x: x["prob"], reverse=True)

                res = {
                    "predicted_class_id": predicted_idx,
                    "predicted_class_name": CATEGORY_LABELS[predicted_idx],
                    "confidence": round(float(probs[predicted_idx]), 4),
                    "classes": classes_list,
                    "model_source": "trained_random_forest" if attribution_model else "fallback_heuristic"
                }

                res_bytes = json.dumps(res).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                self.wfile.flush()
            except Exception as e:
                err_bytes = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                self.wfile.flush()
            return

        # 2. Live ML Anomaly Surge Endpoint (Brain 2)
        elif self.path == '/api/ml/anomaly':
            try:
                data = json.loads(raw.decode('utf-8'))
                telemetry = {
                    "current_frp": float(data.get("current_frp", 68.4)),
                    "brightness_temp_k": float(data.get("brightness_temp_k", 368.5)),
                    "centroid_drift_m": float(data.get("centroid_drift_m", 12.0)),
                    "active_pixel_count": int(data.get("active_pixel_count", 3))
                }
                baseline = {
                    "mean_frp": float(data.get("baseline_mean_frp", 18.2)),
                    "std_frp": float(data.get("baseline_std_frp", 4.5)),
                    "mean_temp_k": float(data.get("baseline_mean_temp_k", 340.0)),
                    "baseline_pixels": 1
                }
                if anomaly_engine:
                    res = anomaly_engine.evaluate_anomaly(telemetry, baseline)
                else:
                    res = {"anomaly_score": 85.0, "severity": "HIGH-PRIORITY ANOMALY", "severity_class": "high_priority"}

                res_bytes = json.dumps(res).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                self.wfile.flush()
            except Exception as e:
                err_bytes = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                self.wfile.flush()
            return

        # 3. Incident Verification Triage
        elif self.path == '/api/verification':
            try:
                data = json.loads(raw.decode('utf-8'))
                record = {
                    "object_id": data.get("object_id", "OBJ-UNKNOWN"),
                    "verified_category": data.get("verified_category", "industrial"),
                    "verified_by": data.get("verified_by", "Operator_1"),
                    "timestamp_utc": datetime.utcnow().isoformat() + "Z",
                    "notes": data.get("notes", "Confirmed")
                }
                VERIFIED_AUDIT_LEDGER.append(record)
                res_bytes = json.dumps({"status": "success", "record": record}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                self.wfile.flush()
            except Exception as e:
                err_bytes = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                self.wfile.flush()
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Length', '0')
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), DevHandler)
    print(f"[HeatWatch] Full-Stack AI & Web Server listening on http://0.0.0.0:{PORT} (Local: http://127.0.0.1:{PORT})", flush=True)
    server.serve_forever()
