import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title="HeatWatch Thermal Intelligence Server",
    version="3.1.0-sih-prod"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active Learning Human Verification Audit Ledger
VERIFIED_AUDIT_LEDGER = [
    {
        "object_id": "OBJ-1049",
        "verified_category": "industrial",
        "verified_by": "Disaster_Control_Gujarat",
        "timestamp_utc": "2026-08-28T06:15:00Z",
        "notes": "Verified hydrocracker flare escalation."
    }
]

class VerificationPayload(BaseModel):
    object_id: str
    verified_category: str
    verified_by: str = "Operator_1"
    notes: Optional[str] = None

@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    # Disable aggressive client caching during active development
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "service": "HeatWatch FastAPI Server",
        "version": "3.1.0-sih-prod",
        "gibs_status": "active (NASA GIBS open WMTS, no API key required)"
    }

@app.get("/api/statistics")
async def get_statistics():
    return {
        "total_verified_cases": len(VERIFIED_AUDIT_LEDGER),
        "verified_industrial": sum(1 for v in VERIFIED_AUDIT_LEDGER if v["verified_category"] == "industrial"),
        "verified_wildfire": sum(1 for v in VERIFIED_AUDIT_LEDGER if v["verified_category"] == "wildfire"),
        "verified_agriculture": sum(1 for v in VERIFIED_AUDIT_LEDGER if v["verified_category"] == "agriculture"),
        "ledger": VERIFIED_AUDIT_LEDGER
    }

@app.post("/api/verification")
async def submit_verification(payload: VerificationPayload):
    record = {
        "object_id": payload.object_id,
        "verified_category": payload.verified_category,
        "verified_by": payload.verified_by,
        "timestamp_utc": datetime.utcnow().isoformat() + "Z",
        "notes": payload.notes or "Operator confirmed ground truth."
    }
    VERIFIED_AUDIT_LEDGER.append(record)
    return {
        "status": "success",
        "message": "Human verification recorded into active learning retraining dataset",
        "record": record,
        "total_verifications": len(VERIFIED_AUDIT_LEDGER)
    }

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

# Mount static asset folders
for folder in ["js", "data", "assets"]:
    f_path = os.path.join(BASE_DIR, folder)
    if os.path.exists(f_path):
        app.mount(f"/{folder}", StaticFiles(directory=f_path), name=folder)

@app.get("/styles.css")
async def serve_css():
    return FileResponse(os.path.join(BASE_DIR, "styles.css"))

@app.get("/{file_name}")
async def serve_root_files(file_name: str):
    file_path = os.path.join(BASE_DIR, file_name)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"error": "Not Found"})

if __name__ == "__main__":
    print(f"[HeatWatch] Starting FastAPI Production Server on http://localhost:3000")
    uvicorn.run("server:app", host="0.0.0.0", port=3000, reload=False)
