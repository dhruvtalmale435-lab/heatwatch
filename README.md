# ?? HeatWatch — Satellite Industrial Thermal Radiometry & Anomaly Intelligence Platform

<div align="center">

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026_Finalist-orange.svg?style=for-the-badge&logo=target)](https://sih.gov.in/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![NASA FIRMS NRT](https://img.shields.io/badge/NASA-FIRMS_LANCE_NRT-red.svg?style=for-the-badge&logo=nasa)](https://firms.modaps.eosdis.nasa.gov/)
[![ESA Copernicus](https://img.shields.io/badge/ESA-Copernicus_Sentinel-003399.svg?style=for-the-badge&logo=esa)](https://dataspace.copernicus.eu/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Random_Forest_Ensemble-F7931E.svg?style=for-the-badge&logo=scikit-learn)](https://scikit-learn.org/)
[![Leaflet GIS](https://img.shields.io/badge/GIS-Leaflet_Engine-199900.svg?style=for-the-badge&logo=leaflet)](https://leafletjs.com/)

**From Raw Satellite Infrared Hotspots to Prioritized Industrial Incident Intelligence**

[Live Features](#-key-capabilities) • [Scientific Architecture](#-system-architecture) • [ML Attribution Pipeline](#-two-tier-intelligence-engine) • [Quickstart](#-quickstart-guide) • [API Reference](#-rest-api-endpoints)

</div>

---

## ?? Executive Summary

Traditional satellite hotspot platforms (such as basic NASA FIRMS or generic fire maps) provide point coordinates where infrared heat is detected. However, **raw hotspots do not explain what caused the heat, whether it is routine industrial operation, or whether it represents a critical operational surge**.

**HeatWatch** closes the critical intelligence gap between orbital radiometry and ground disaster response:
1. **Object-Oriented Thermal Clustering**: Aggregates raw 375m VIIRS pixels into persistent **Thermal Objects** (`ST-DBSCAN`) retaining multi-year history, centroid stability, and flare footprint geometry.
2. **Two-Tier Physics & Machine Learning Pipeline**:
   - **Engine 1 (Source Classification)**: Random Forest model (14 radiometric and geospatial features) predicting industrial flaring vs agricultural burning vs wildfire vs urban noise.
   - **Engine 2 (Statistical Baseline Deviation)**: Dynamic 90-day operational baseline modeling normal capacity and triggering alerts when Radiative Power (FRP) surges abnormally ($\ge 3.0\times$ baseline).
3. **Nationwide Industrial Footprint**: Overlays OpenStreetMap (OSM) plant boundaries, ESA WorldCover 10m land cover rasters, and VIIRS Nighttime Lights (DNB) across **58+ key industrial complexes throughout India**.
4. **Actionable Disaster Management Triage**: Automated 1-page Official Incident Triage Dossiers, settlement vulnerability exposure buffers, and Sentinel-2 SWIR false-color spectral verification.

---

## ??? System Architecture

```
                                  ORBITAL SENSING
      VIIRS SNPP (375m)  •  NOAA-20 / NOAA-21  •  MODIS Terra/Aqua (1km)
                                        ¦
                                        ?
                           DATA INGESTION & SYNC DAEMON
                 NASA LANCE FIRMS NRT API (India Area Coverage)
                                        ¦
                        +-------------------------------+
                        ?                               ?
               SPATIAL-TEMPORAL                GEOSPATIAL CONTEXT
               ST-DBSCAN CLUSTERING            ENRICHMENT PIPELINE
            (Pixel-to-Object Formation)         • OSM Industrial Plant Polygons
                        ¦                       • ESA WorldCover 10m Rasters
                        ¦                       • VIIRS Nighttime Lights (DNB)
                        +-------------------------------+
                                        ?
                        TWO-TIER INTELLIGENCE ENGINE
  +---------------------------------------------------------------------------+
  ¦                                                                           ¦
  ?                                                                           ?
ENGINE 1: SOURCE ATTRIBUTION                                 ENGINE 2: BASELINE & ANOMALY
Random Forest Classifier (14 Features)                       Statistical 90-Day Time-Series
  • Radiative Power (FRP MW)                                   • Dynamic Facility Median FRP
  • Brightness Temp (I-4 & I-5 Band)                           • Acute Surge Ratio (?FRP)
  • Nightlight Radiance (nW/cm²/sr)                            • Footprint Expansion (+281%)
  • Land Cover Composition (% Built/Tree/Crop)                 • Centroid Stack Displacement
  • Distance to Known Plant Perimeter                          • Escalation: Normal ? High Priority
  ¦                                                                           ¦
  +---------------------------------------------------------------------------+
                                        ?
                        MISSION-CONTROL PRESENTATION LAYER
  +---------------------------------------------------------------------------+
  ?                  ?                  ?                  ?                  ?
GIS Command Map   Analytics & Baseline   SIH Jury Tour    Alert Center   Incident Dossier
(Leaflet + GIBS)  (90-Day Time Series)  (10-Step Guided) (Triage Queue)  (1-Page Official)
```

---

## ?? Two-Tier Intelligence Engine

### Engine 1: Multi-Spectral Source Attribution
Trained on multi-sensor radiometry with high-confidence cross-validation:
$$\hat{y} = \arg\max_{c} P(C = c \mid \mathbf{x})$$
where $\mathbf{x} \in \mathbb{R}^{14}$ encompasses:
* **Thermal Features**: FRP ($\text{MW}$), Brightness Temperature $T_{3.74\mu\text{m}}$ ($\text{K}$), Brightness Temp Delta $\Delta T_{3.74-11.45}$, Day/Night flag.
* **Geospatial Context**: Nearest facility distance ($d_{\text{fac}}$), Facility category, Inside boundary boolean.
* **Land & Albedo**: Built-up %, Tree cover %, Cropland %, Water %, Bare ground % (ESA WorldCover 10m).
* **Nighttime Radiance**: Nightlights intensity $L_{\text{DNB}}$ ($\text{nW}\cdot\text{cm}^{-2}\cdot\text{sr}^{-1}$).

### Engine 2: Statistical Baseline Anomaly Detection
Operational safety cannot be determined by classification alone. HeatWatch continuously calculates:
$$\text{Anomaly Score} = w_1 \left(\frac{\text{FRP}_{\text{obs}}}{\mu_{\text{baseline}}}\right) + w_2 \left(\frac{A_{\text{footprint}}}{A_{\text{norm}}}\right) + w_3 \cdot d_{\text{centroid}} + w_4 \cdot \text{Persistence}$$

| Operational State | Deviation Factor | Severity Level | Action Protocol |
| :--- | :--- | :--- | :--- |
| **Normal Operational Flaring** | $0.5\times - 1.5\times$ | ?? `NORMAL` | Passive continuous logging |
| **Elevated Plant Load** | $1.5\times - 2.8\times$ | ?? `ELEVATED` | Automated watch notice |
| **Acute Flare Surge / Fire Incident** | $\ge 3.0\times$ | ?? `HIGH PRIORITY` | Instant Disaster Authority Triage |

---

## ?? Key Capabilities

### 1. GIS Command Center
* Multi-satellite raster basemaps with NASA GIBS NRT layers.
* Filter by sector: **Refineries**, **Thermal Power**, **Steel Plants**, **Coal Mines**, **Chemicals**, **Agricultural Stubble**, **Forest Reserves**, and **Solar Parks**.
* Real-time spatial search across 58+ facilities nationwide (Jamnagar, Nayara Vadinar, Panipat, Paradip, Singrauli, Korba, Vindhyachal, Tata Steel Jamshedpur, Simlipal, Patiala, etc.).

### 2. Analytics & 90-Day Baseline Deep-Dive
* Interactive time-series charts displaying 90 days of daily FRP measurements against operational mean and $+3\sigma$ threshold lines.
* Cross-facility regional comparison bar charts dynamically highlighting the active asset.
* 4 real-time KPI cards: Observed FRP, Baseline Mean, Radiative Temp (K / °C), and Attribution Confidence.

### 3. Sub-Pixel Pyrometry & Emissions Calculator
* **Planck Radiation Curve Fitting**:
  $$B(\lambda, T) = \frac{2hc^2}{\lambda^5 \left(e^{\frac{hc}{\lambda k_B T}} - 1\right)}$$
* Interactive emitter temperature slider ($500\,\text{K} - 2200\,\text{K}$) calculating sub-pixel flare area ($A_{\text{flare}} \approx 17.4\,\text{m}^2$).
* **World Bank GGFR Emission Estimator**: Converts flared natural gas volume into daily and annual $\text{CO}_2$ metric tonnes.

### 4. 10-Step Interactive SIH Jury Tour Mode
* Step-by-step presentation flow built into the UI.
* Transitions smoothly between the GIS Command Map and Analytics views, showcasing the entire end-to-end detection-to-decision pipeline.

### 5. Official Incident Triage Dossier
* Generates an official, printable 1-page Incident Dossier for District Disaster Management Authorities (DDMA) with nearest settlement distances, population exposure estimates, and field verification sign-off checklists.

---

## ? Quickstart Guide

### Option 1: Standalone Web Application (Zero Dependencies)
You can launch the frontend immediately using any static web server:

```bash
# Using Python
python -m http.server 3000

# Or using Node.js
npx serve .
```
Open **`http://localhost:3000`** in your browser.

---

### Option 2: Full-Stack Dev Server with Live Background Sync
To run the automated 15-minute NASA FIRMS sync daemon with machine learning inference:

```bash
# 1. Install dependencies
pip install scikit-learn numpy requests

# 2. Start the full-stack server
python dev_server.py
```
* **Web UI**: `http://localhost:3000`
* **Live Ingestion Endpoint**: `http://localhost:3000/api/firms/sync`
* **Health Endpoint**: `http://localhost:3000/api/health`

---

## ?? Repository Structure

```
SIHFIREDETECTION/
+-- backend/
¦   +-- live_service.py         # NASA FIRMS sync, ST-DBSCAN & RF inference service
+-- data/
¦   +-- live_firms_india.json   # Live telemetry cache for all India facilities
+-- js/
¦   +-- analytics.js            # Chart.js time-series & regional bar charts
¦   +-- app.js                  # Main application controller & event coordinator
¦   +-- data.js                 # Thermal objects, baselines & SIH tour definitions
¦   +-- demo-story.js           # 10-Step guided SIH presentation tour engine
¦   +-- firms-fetcher.js        # NASA FIRMS API client with fallback telemetry
¦   +-- india-data.js           # 58+ Indian industrial complexes & metadata
¦   +-- map.js                  # Leaflet radar canvas, layers & spatial filters
+-- ml_engine1/
¦   +-- models/                 # Model training & feature engineering pipelines
¦   +-- data_ingestion/         # FIRMS data verification & calibration scripts
+-- attribution_model.pkl       # Trained Random Forest classifier (14 features)
+-- model_metadata.json         # Feature definitions, class mappings & metrics
+-- dev_server.py               # Full-stack Python server with auto-sync daemon
+-- index.html                  # Master application interface
+-- styles.css                  # Mission-control geospatial design system
+-- README.md                   # Project documentation
```

---

## ?? REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server status, satellite feeds, and active anomaly count |
| `GET` | `/api/firms/sync` | Triggers on-demand NASA FIRMS fetch & ML attribution |
| `GET` | `/api/hotspots` | Returns active thermal objects with ML attribution |
| `GET` | `/api/facilities` | Returns all 58+ Indian industrial assets with baselines |
| `GET` | `/api/alerts` | Returns active high-priority triage incident list |
| `GET` | `/api/export/geojson` | Exports standard GeoJSON FeatureCollection for GIS software |

---

## ??? Earth Observation Data Providers

* **NASA LANCE FIRMS**: VIIRS S-NPP (375m), NOAA-20, NOAA-21, MODIS Terra/Aqua.
* **NASA GIBS WMS**: Corrected Reflectance True-Color Imagery & Night Lights.
* **ESA Copernicus**: Sentinel-2 MSI Multi-Spectral Instrument (SWIR B12, B8A, RGB).
* **OpenStreetMap**: Global industrial infrastructure polygons via Overpass API.
* **ESA WorldCover 10m**: Global land cover raster classification.

---

## ?? Smart India Hackathon (SIH 2026)

* **Problem Statement**: Satellite Thermal Hotspot Source Attribution & Industrial Anomaly Detection.
* **Team**: HeatWatch Engineering Lab
* **License**: MIT Open Source License
