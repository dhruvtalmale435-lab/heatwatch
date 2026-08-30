"""
HeatWatch - ML Feature Engineering Pipeline
Extracts multi-modal features combining satellite physical radiometry,
OSM industrial proximity, ESA WorldCover land fractions, and temporal persistence.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_NAMES = [
    "frp",
    "bright_ti4",
    "bright_ti5",
    "temp_ratio_i4_i5",
    "scan",
    "track",
    "dist_to_facility_m",
    "is_inside_facility",
    "builtup_pct_1km",
    "treecover_pct_1km",
    "cropland_pct_1km",
    "bare_soil_pct_1km",
    "nightlight_radiance",
    "persistence_days_90d"
]

CATEGORY_LABELS = {
    0: "Refinery / Petrochemical Flare",
    1: "Super Thermal Power Plant",
    2: "Coal Mining Seam Fire",
    3: "Vegetation Wildfire",
    4: "Agricultural Stubble Burning",
    5: "Solar Glint / False Positive"
}

def extract_features_from_hotspot(hotspot: Dict[str, Any], facility_context: Dict[str, Any] = None) -> np.ndarray:
    """
    Transforms a single hotspot dictionary into a standardized 14-dimensional feature vector.
    """
    frp = float(hotspot.get("frp", 15.0))
    ti4 = float(hotspot.get("bright_ti4", 330.0))
    ti5 = float(hotspot.get("bright_ti5", 295.0))
    ratio = ti4 / max(ti5, 1.0)
    scan = float(hotspot.get("scan", 0.4))
    track = float(hotspot.get("track", 0.4))
    
    # Context
    facility_context = facility_context or {}
    dist = float(facility_context.get("distance_m", 5000.0))
    is_inside = 1.0 if dist < 150.0 else 0.0
    
    builtup = float(facility_context.get("builtup_pct", 10.0))
    treecover = float(facility_context.get("treecover_pct", 10.0))
    cropland = float(facility_context.get("cropland_pct", 20.0))
    bare_soil = float(facility_context.get("bare_soil_pct", 5.0))
    nightlight = float(facility_context.get("nightlight_radiance", 15.0))
    persistence = float(hotspot.get("persistence_days", 5.0))

    return np.array([
        frp, ti4, ti5, ratio, scan, track,
        dist, is_inside, builtup, treecover, cropland, bare_soil,
        nightlight, persistence
    ], dtype=np.float32)

def generate_synthetic_training_dataset(n_samples: int = 2400) -> (pd.DataFrame, np.ndarray):
    """
    Generates realistic multi-modal training dataset based on ground-truth empirical
    distributions for India's 6 thermal source categories.
    """
    np.random.seed(42)
    samples_per_class = n_samples // 6
    rows = []
    labels = []

    # Class 0: Refinery / Petrochemical Flare
    for _ in range(samples_per_class):
        frp = np.random.gamma(shape=5.0, scale=8.0) + 15.0  # 30-90 MW
        ti4 = np.random.normal(365.0, 15.0)
        ti5 = np.random.normal(300.0, 5.0)
        dist = np.random.exponential(180.0)  # Close to mapped facility (<300m)
        builtup = np.random.uniform(60.0, 95.0)
        treecover = np.random.uniform(0.0, 8.0)
        cropland = np.random.uniform(0.0, 5.0)
        bare_soil = np.random.uniform(5.0, 25.0)
        nightlight = np.random.normal(75.0, 12.0)
        persistence = np.random.uniform(65.0, 90.0)
        rows.append([frp, ti4, ti5, ti4/ti5, 0.38, 0.38, dist, 1.0 if dist < 150 else 0.0, builtup, treecover, cropland, bare_soil, nightlight, persistence])
        labels.append(0)

    # Class 1: Super Thermal Power Plant
    for _ in range(samples_per_class):
        frp = np.random.gamma(shape=4.0, scale=7.0) + 10.0
        ti4 = np.random.normal(348.0, 10.0)
        ti5 = np.random.normal(298.0, 4.0)
        dist = np.random.exponential(250.0)
        builtup = np.random.uniform(50.0, 85.0)
        treecover = np.random.uniform(2.0, 15.0)
        cropland = np.random.uniform(5.0, 20.0)
        bare_soil = np.random.uniform(10.0, 30.0)
        nightlight = np.random.normal(60.0, 10.0)
        persistence = np.random.uniform(55.0, 88.0)
        rows.append([frp, ti4, ti5, ti4/ti5, 0.38, 0.38, dist, 1.0 if dist < 150 else 0.0, builtup, treecover, cropland, bare_soil, nightlight, persistence])
        labels.append(1)

    # Class 2: Coal Mining Seam Fire
    for _ in range(samples_per_class):
        frp = np.random.gamma(shape=3.0, scale=6.0) + 8.0
        ti4 = np.random.normal(338.0, 8.0)
        ti5 = np.random.normal(296.0, 4.0)
        dist = np.random.exponential(400.0)
        builtup = np.random.uniform(20.0, 45.0)
        treecover = np.random.uniform(2.0, 10.0)
        cropland = np.random.uniform(2.0, 15.0)
        bare_soil = np.random.uniform(45.0, 80.0)  # Open-cast coal pit
        nightlight = np.random.normal(35.0, 8.0)
        persistence = np.random.uniform(70.0, 90.0)
        rows.append([frp, ti4, ti5, ti4/ti5, 0.40, 0.40, dist, 1.0 if dist < 150 else 0.0, builtup, treecover, cropland, bare_soil, nightlight, persistence])
        labels.append(2)

    # Class 3: Vegetation Wildfire
    for _ in range(samples_per_class):
        frp = np.random.gamma(shape=6.0, scale=25.0) + 20.0  # High FRP (up to 300+ MW)
        ti4 = np.random.normal(355.0, 20.0)
        ti5 = np.random.normal(295.0, 6.0)
        dist = np.random.uniform(4000.0, 25000.0)  # Far from industrial facilities
        builtup = np.random.uniform(0.0, 5.0)
        treecover = np.random.uniform(65.0, 98.0)  # Dense forest canopy
        cropland = np.random.uniform(0.0, 10.0)
        bare_soil = np.random.uniform(0.0, 10.0)
        nightlight = np.random.uniform(0.0, 4.0)  # Dark wilderness
        persistence = np.random.uniform(1.0, 12.0)  # Transient
        rows.append([frp, ti4, ti5, ti4/ti5, 0.42, 0.42, dist, 0.0, builtup, treecover, cropland, bare_soil, nightlight, persistence])
        labels.append(3)

    # Class 4: Agricultural Stubble Burning
    for _ in range(samples_per_class):
        frp = np.random.gamma(shape=2.5, scale=4.0) + 4.0  # Low-moderate FRP (10-25 MW)
        ti4 = np.random.normal(332.0, 8.0)
        ti5 = np.random.normal(294.0, 3.0)
        dist = np.random.uniform(3000.0, 20000.0)
        builtup = np.random.uniform(0.0, 8.0)
        treecover = np.random.uniform(0.0, 5.0)
        cropland = np.random.uniform(70.0, 98.0)  # High cropland fraction
        bare_soil = np.random.uniform(5.0, 20.0)
        nightlight = np.random.uniform(0.5, 6.0)
        persistence = np.random.uniform(1.0, 5.0)  # Highly transient seasonal burning
        rows.append([frp, ti4, ti5, ti4/ti5, 0.38, 0.38, dist, 0.0, builtup, treecover, cropland, bare_soil, nightlight, persistence])
        labels.append(4)

    # Class 5: Solar Glint / False Positive
    for _ in range(samples_per_class):
        frp = np.random.uniform(1.5, 8.0)  # Very low pseudo-FRP
        ti4 = np.random.normal(325.0, 6.0)
        ti5 = np.random.normal(318.0, 5.0)  # High Ti5 near Ti4 (solar reflection)
        dist = np.random.uniform(1000.0, 15000.0)
        builtup = np.random.uniform(10.0, 40.0)
        treecover = np.random.uniform(0.0, 10.0)
        cropland = np.random.uniform(10.0, 40.0)
        bare_soil = np.random.uniform(40.0, 80.0)  # Solar PV / water bodies / salt flats
        nightlight = np.random.uniform(2.0, 20.0)
        persistence = np.random.uniform(1.0, 3.0)
        rows.append([frp, ti4, ti5, ti4/ti5, 0.38, 0.38, dist, 0.0, builtup, treecover, cropland, bare_soil, nightlight, persistence])
        labels.append(5)

    df = pd.DataFrame(rows, columns=FEATURE_NAMES)
    return df, np.array(labels)
