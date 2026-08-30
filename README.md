# HeatWatch — Satellite Industrial Thermal Intelligence & Anomaly Platform

> **From satellite heat points to actionable regional alerts.**  
> Built for the Smart India Hackathon (SIH 2026).

---

## 🎯 Core Research Insight & Problem Formulation

### The Problem with Traditional Framing
Traditional hackathon projects claim: *"NASA detects fire points -> we use AI to detect if it is an industrial fire"*.  
As revealed by recent developments (NASA FIRMS March/May 2025 update with Static Thermal Anomalies), NASA already screens persistent static industrial and natural sources using inventories. Simply reproducing that classification has limited scientific novelty.

### The HeatWatch Innovation
HeatWatch moves one level higher:
1. **Object-Oriented Thermal Units**: Aggregates individual VIIRS 375m / MODIS 1km satellite detections into persistent **Thermal Objects** (`ST-DBSCAN` clustering) retaining multi-year history, FRP statistics, and centroid stability.
2. **Two-Brain Intelligence System**:
   - **Brain 1 (Source Attribution)**: Multi-factor explainable evidence score (Facility match 30%, Persistence 25%, Built-up context 15%, Land cover 15%, History 15%).
   - **Brain 2 (Behavioural Anomaly Engine)**: Establishes a 90-day historical baseline (Mean FRP, regular footprint) and detects acute surges ($A = 0.40 \Delta FRP + 0.25 \text{Footprint} + 0.15 \text{Displacement} + 0.10 \text{Duration} + 0.10 \text{Pattern}$).
3. **NASA Static Mask Benchmark**: Demonstrates live side-by-side comparison between NASA's static label vs HeatWatch's abnormal flare surge detection.
4. **Unmapped Facility Discovery**: Identifies newly built or unmapped industrial heat emitters using VIIRS Nighttime Lights (DNB) and ESA WorldCover 10m land composition.
5. **Actionable Emergency Triage**: Generates field verification dossiers and Sentinel-2 SWIR false-color spectral previews for District Disaster Management Authorities.

---

## 🚀 Key Web Application Features

1. **GIS Command Center (`/command-map`)**:
   - High-performance Leaflet canvas with custom dark radar styling.
   - Multimodal layer toggles: Raw NASA FIRMS detections, Clustered Thermal Objects, OSM Industrial Plant Polygons, ESA WorldCover 10m buffers, NASA Static Mask, and 2km Population Exposure Risk Buffers.
   - Study Region quick switcher: Jamnagar Petrochemical Corridor, Hazira Heavy Industry Hub, Korba Super Thermal Power Belt, Singrauli Coal Basin, Simlipal Forest Buffer, Patiala Agricultural Stubble Zone.
   - Live time-scrubber timeline for temporal historical playback.
2. **Thermal Object & Telemetry Inspector HUD**:
   - Live physical telemetry (Current FRP, 90-day Baseline Deviation, Brightness Temp in Kelvin, Centroid Stability Index).
   - Dynamic 90-day time-series telemetry charts using Chart.js.
   - ESA WorldCover land-cover composition doughnut chart.
   - Anomaly Engine 5-factor radar breakdown.
   - Human-readable Explainable Evidence checklist.
   - Action recommendation with nearest settlement distance and population exposure.
3. **8-Step Interactive Guided SIH Tour**:
   - Built-in automated presentation tour executing the exact 8-step judging narrative from document pages 12 & 104.
4. **Regional Alert Center (`/alerts`)**:
   - Prioritized incident queue for operator triage, verification confirmation, drone dispatch requests, and instant incident dossier downloads.
5. **NASA Comparison Matrix (`/comparison`)**:
   - Side-by-side architectural and facility-level comparison matrix proving novelty.
6. **Frozen REST API Explorer (`/api`)**:
   - Interactive endpoint tester for `GET /api/hotspots`, `GET /api/hotspots/{id}`, `GET /api/facilities`, `GET /api/alerts`, `GET /api/compare/nasa`, and GeoJSON exporter.

---

## 💻 Running the Web Application Locally

The application is built using modern vanilla Web standards (ES6+ Modules, CSS3, HTML5) with zero mandatory build dependencies:

```bash
# Option 1: Using Python built-in HTTP server
python -m http.server 3000

# Option 2: Using Node.js npx serve
npx serve .
```

Open your browser and navigate to:  
**`http://localhost:3000`**

---

## 🛰️ Data Sources Integrated
- **NASA FIRMS** (VIIRS 375m I-Band, MODIS 1km, Static Thermal Anomaly Mask)
- **OpenStreetMap (OSM)** via Overpass API (Refineries, Power Plants, Storage Tanks, Flare Stacks)
- **ESA WorldCover 10m** (Sentinel-1 & Sentinel-2 Global Land Cover)
- **VIIRS Nighttime Lights (DNB)** (Radiance Intensity in nW/cm²/sr)
- **Copernicus Sentinel-2 MSI** (SWIR B12 2.19µm, RGB B4/B3/B2, NBR Burn Indices)
