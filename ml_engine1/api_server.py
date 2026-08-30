"""
HeatWatch - FastAPI REST API Server Bridge
Connects the backend database and trained ML engines with the HeatWatch frontend.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pickle
import os
import json
import numpy as np

app = FastAPI(
    title="HeatWatch AI-GIS Thermal Platform API",
    description="REST API serving satellite thermal objects, source attributions, anomaly detection, and triage.",
    version="2.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "attribution_model.pkl")
attribution_model = None
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        attribution_model = pickle.load(f)

from models.anomaly_engine import AnomalyEngine
anomaly_engine = AnomalyEngine()

class HotspotInferenceRequest(BaseModel):
    frp: float
    bright_ti4: float
    bright_ti5: float
    dist_to_facility_m: float
    builtup_pct: float
    treecover_pct: float
    cropland_pct: float
    bare_soil_pct: float
    nightlight_radiance: float
    persistence_days: float

class AnomalyEvaluationRequest(BaseModel):
    current_frp: float
    brightness_temp_k: float
    centroid_drift_m: float
    active_pixel_count: int
    baseline_mean_frp: float
    baseline_std_frp: float
    baseline_mean_temp_k: float

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HeatWatch AI Engine",
        "model_loaded": attribution_model is not None
    }

@app.post("/api/ml/attribute")
def predict_source_attribution(req: HotspotInferenceRequest):
    """
    Brain 1: Predicts thermal source category and class probability distribution.
    """
    from models.feature_pipeline import extract_features_from_hotspot, CATEGORY_LABELS
    
    vec = extract_features_from_hotspot(
        {"frp": req.frp, "bright_ti4": req.bright_ti4, "bright_ti5": req.bright_ti5, "persistence_days": req.persistence_days},
        {"distance_m": req.dist_to_facility_m, "builtup_pct": req.builtup_pct, "treecover_pct": req.treecover_pct, "cropland_pct": req.cropland_pct, "bare_soil_pct": req.bare_soil_pct, "nightlight_radiance": req.nightlight_radiance}
    ).reshape(1, -1)

    if attribution_model:
        probs = attribution_model.predict_proba(vec)[0]
        predicted_class_id = int(np.argmax(probs))
    else:
        probs = [0.85, 0.05, 0.03, 0.03, 0.02, 0.02]
        predicted_class_id = 0

    return {
        "predicted_category_id": predicted_class_id,
        "predicted_category": CATEGORY_LABELS[predicted_class_id],
        "confidence": round(float(probs[predicted_class_id]), 4),
        "class_probabilities": {
            CATEGORY_LABELS[i]: round(float(probs[i]), 4) for i in range(len(probs))
        }
    }

@app.post("/api/ml/anomaly")
def evaluate_anomaly_surge(req: AnomalyEvaluationRequest):
    """
    Brain 2: Evaluates acute thermal flare surges vs 90-day baseline.
    """
    telemetry = {
        "current_frp": req.current_frp,
        "brightness_temp_k": req.brightness_temp_k,
        "centroid_drift_m": req.centroid_drift_m,
        "active_pixel_count": req.active_pixel_count
    }
    baseline = {
        "mean_frp": req.baseline_mean_frp,
        "std_frp": req.baseline_std_frp,
        "mean_temp_k": req.baseline_mean_temp_k,
        "baseline_pixels": 1
    }
    return anomaly_engine.evaluate_anomaly(telemetry, baseline)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
