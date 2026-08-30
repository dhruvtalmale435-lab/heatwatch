import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
from datetime import datetime

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

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
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "online", "service": "HeatWatch Dev Server"}).encode('utf-8'))
            return
        elif self.path == '/api/statistics':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            stats = {
                "total_verified_cases": len(VERIFIED_AUDIT_LEDGER),
                "ledger": VERIFIED_AUDIT_LEDGER
            }
            self.wfile.write(json.dumps(stats).encode('utf-8'))
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/verification':
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length)
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
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "record": record}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
            return
        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), DevHandler)
    print(f"[HeatWatch] Dev Server listening on http://127.0.0.1:{PORT}", flush=True)
    server.serve_forever()
