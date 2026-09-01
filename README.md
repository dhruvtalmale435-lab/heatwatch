# 🔥 HeatWatch — Satellite Industrial Thermal Intelligence & Anomaly Platform

> **Transforming raw satellite radiometry into facility-aware industrial intelligence, statistical baseline deviation models, and automated disaster triage.**

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![NASA FIRMS](https://img.shields.io/badge/NASA-LANCE%20FIRMS%20NRT-E03C31?style=flat&logo=nasa&logoColor=white)](https://firms.modaps.eosdis.nasa.gov)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Executive Summary

Traditional satellite fire detection platforms (such as raw NASA FIRMS) detect thermal infrared radiometry and mark thermal anomalies as generic 'fire pins' on a map. However, for industrial surveillance, disaster response, and environmental monitoring:

1. **A hotspot inside a petrochemical refinery flare stack is expected operational behaviour**, not an emergency.
2. **A sudden 3.8x surge in thermal radiative power (FRP) with spatial plume expansion** at that same refinery indicates an acute containment failure or uncontrolled blowout requiring urgent triage.
3. **Solar panels and metal roofs trigger optical glint false alarms** during mid-day orbital passes.
4. **Coal seam auto-oxidation fires in mines** require subsurface thermal tracking distinct from agricultural crop residue burning.

**HeatWatch** bridges this critical gap. It ingests live 375m VIIRS & 1km MODIS satellite telemetry, clusters raw radiometry into persistent **Thermal Objects**, contextualizes them with OpenStreetMap industrial boundaries and ESA WorldCover land use, and applies a **Two-Brain Decision Architecture**:
- 🧠 **Brain 1 (Source Attribution):** Multi-modal physics & ML classifier that identifies *what* the heat source is (Refinery Flare, Power Plant, Coal Seam Fire, Forest Wildfire, Crop Stubble, or Solar Glint).
- 🚨 **Brain 2 (Baseline & Anomaly Engine):** Statistical 90-day time-series baseline model that answers *is today's behaviour normal for this exact location?*, generating automated priority alerts (NOMINAL, ELEVATED, HIGH-PRIORITY).

---

## 🏛️ System Architecture

`
                               ┌──────────────────────────────────────────────┐
                               │       LIVE ORBITAL PASS TELEMETRY            │
                               │  NASA FIRMS (VIIRS 375m I-Band, MODIS 1km)   │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           INGESTION & CLEANING               │
                               │  Strict Geofencing, SNR Gating, Temporal Sync│
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │            SPATIOTEMPORAL DBSCAN             │
                               │   Pixel Radiative Clustering -> Thermal Objs │
                               └──────────────────────┬───────────────────────┘
                                                      │
                      ┌───────────────────────────────┴───────────────────────────────┐
                      ▼                                                               ▼
       ┌──────────────────────────────┐                                ┌──────────────────────────────┐
       │   GEOSPATIAL CONTEXTUALIZER  │                                │     TIME-SERIES TELEMETRY    │
       │ OSM Polygons + ESA WorldCover│                                │ 90-Day Rolling Baseline FRP  │
       │ VIIRS Nighttime Lights (DNB) │                                │ Gaussian Anomaly & Deviation │
       └──────────────┬───────────────┘                                └──────────────┬───────────────┘
                      │                                                               │
                      ▼                                                               ▼
       ┌──────────────────────────────┐                                ┌──────────────────────────────┐
       │     BRAIN 1: SOURCE ATTRIB   │                                │   BRAIN 2: ANOMALY ENGINE    │
       │ Trained Random Forest (200t) │                                │ Multi-Factor Deviation Ratio │
       │ 14-Feature Multi-Modal Infr. │                                │ Z-Score + Footprint Dynamics │
       └──────────────┬───────────────┘                                └──────────────┬───────────────┘
                      │                                                               │
                      └───────────────────────────────┬───────────────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │            OPERATIONAL TRIAGE                │
                               │  • High-Priority Anomaly Detection & Alerts  │
                               │  • Sub-Pixel Planck Pyrometry & Emissions    │
                               │  • 1-Page Actionable Incident Dossier Export │
                               │  • Live REST API / GeoJSON Interoperability  │
                               └──────────────────────────────────────────────┘
`

---

## 🇮🇳 Comprehensive All-India Industrial & Environmental Catalog

HeatWatch monitors **58 high-impact industrial and ecological complexes** across India with high-precision coordinates:

| Sector | Count | Major Facilities Monitored |
| :--- | :---: | :--- |
| **Petrochemical Refineries** | 15 | Reliance Jamnagar (68.2 MMTPA), Nayara Vadinar, IOCL Panipat, BPCL Mumbai, BPCL Kochi, IOCL Paradip, IOCL Haldia, HPCL Vizag, HMEL Bathinda, CPCL Manali, BPCL Bina, IOCL Mathura |
| **Super Thermal Power** | 10 | NTPC Vindhyachal (4.7 GW), NTPC Korba (2.6 GW), NTPC Singrauli (2.0 GW), NTPC Sipat, NTPC Ramagundam, Tata & Adani Mundra (8.6 GW), Chandrapur, NTPC Dadri |
| **Integrated Steel Mills** | 8 | Tata Steel Jamshedpur, SAIL Bhilai, SAIL Bokaro, SAIL Rourkela, JSW Vijayanagar (Toranagallu), AM/NS Hazira, Tata Steel Kalinganagar, RINL Vizag |
| **Coal Basins & Mines** | 5 | Jharia Coalfield Seam Fires, Korba Gevra Open-Cast Mine, Singrauli Jayant Coal Pit, Raniganj Coalfield, Bailadila Iron Ore Complex |
| **Chemical & SEZ Hubs** | 3 | Dahej PCPIR Petrochemical Megazone, Ankleshwar Chemical Estate, Hazira Heavy Industrial Zone (Shell/KRIBHCO) |
| **Forest Reserves** | 6 | Simlipal Biosphere Core (Odisha), Bandhavgarh National Park (MP), Garhwal Himalayan Forest Corridor, Jim Corbett (Uttarakhand), Silent Valley (Kerala), Kaziranga (Assam) |
| **Agricultural Stubble** | 6 | Patiala-Sangrur Paddy Stubble, Ludhiana-Khanna, Karnal-Kaithal, Bathinda-Mansa, Amritsar-Tarn Taran, Muzaffarnagar Sugarcane Belt |
| **Solar Park Benchmarks** | 5 | Bhadla Mega Solar Park (2,245 MW Rajasthan), Pavagada Solar (2.0 GW Karnataka), Kurnool Ultra Mega (1.0 GW AP), Rewa Solar (MP), Charanka (Gujarat) |

---

## ✨ Core Features & Platform Capabilities

### 1. Interactive GIS Command Map
- **Leaflet Engine** with NASA GIBS 24-hour real-time satellite imagery basemaps, CartoDB Dark Matter, and OpenStreetMap layers.
- **Multimodal Layer Toggles:** Raw NASA FIRMS 375m points, Attributed Thermal Clusters, OSM Industrial Boundaries, ESA WorldCover 1km Land-Cover Buffers, NASA Static Anomaly Masks, and 2km Population Exposure Risk Buffers.
- **Live Search & Region Selector:** Instant flight navigation to 58+ Indian facilities or 9 curated study corridors.

### 2. Evidence Inspector HUD
- On-demand slide-out telemetry dossier with complete multi-tier diagnostic breakdown:
  - **Step 1:** Sensor metadata, observed FRP (MW), raw confidence, brightness temp (K), acquisition UTC.
  - **Step 2:** Nearest infrastructure distance (e.g. *Inside Facility Perimeter*, *Adjacent Industrial Buffer*, *Open Regional Sector*), ESA WorldCover composition.
  - **Step 3:** Historical FRP deviation ratio vs 30-day baseline mean, risk severity badge (NOMINAL, ELEVATED, HIGH-PRIORITY).
  - **Step 4:** AI Source Attribution confidence and classification breakdown.
  - **Step 5:** Operational Action Plan, nearest population settlement exposure, and field operator verification status.

### 3. Sub-Pixel Pyrometry & Flaring Emissions
- **Planck Blackbody Curve Fitting:** Models radiance distribution across 1.6um (SWIR), 2.2um, 3.7um (MWIR), and 10.8um (TIR).
- **Dozier Dual-Band Inversion:** Resolves sub-pixel sub-surface fire/flare temperature (800 - 1800 K) and true active combustion area.
- **World Bank GGFR Emission Calculator:** Quantifies volumetric gas flaring rates (m3/hr), annual mass combusted, and equivalent metric tons of CO2 emissions.

### 4. Alert Center & Triage Queue
- Fluidly scrollable operational table listing all active alerts, anomalies, and monitored assets across India.
- Category filters (Industrial Fires, Routine Flares, Coal Mining, Wildfires, Agricultural Stubble, Glint Filtered).
- Live keyword search, multi-factor sorting, and 1-click inspection navigation.

### 5. 1-Page Actionable Incident Dossier (Export & Print)
- Clean, ISO-compliant printable PDF/HTML dispatch brief generated dynamically for emergency response teams and State Pollution Control Boards.

### 6. Frozen REST API & GeoJSON Playground
- Interactive playground to test live REST API endpoints, inspect JSON schemas, and export OGC-compliant GeoJSON payloads for GIS integration (QGIS / ArcGIS / Disaster Command Portals).

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9 or higher
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Installation

1. **Clone the repository:**
   `ash
   git clone https://github.com/dhruvtalmale435-lab/HeatWatch.git
   cd HeatWatch
   `

2. **Install Python dependencies:**
   `ash
   pip install requests numpy scikit-learn
   `

3. **Start the Full-Stack HeatWatch Server:**
   `ash
   python dev_server.py
   `

4. **Access the application:**
   - Web Interface: http://127.0.0.1:3000
   - Health Check: http://127.0.0.1:3000/api/health
   - Live Detections API: http://127.0.0.1:3000/api/v1/detections
   - GeoJSON Export: http://127.0.0.1:3000/api/v1/export/geojson

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| /api/health | GET | System health status, ML model readiness, background sync state. |
| /api/v1/detections | GET | Returns all active thermal objects with ML attribution and anomaly scores. |
| /api/v1/detections?region={id} | GET | Filter detections by specific region (e.g. jamnagar, korba, singrauli). |
| /api/v1/facilities | GET | Returns catalog of all 58 Indian industrial and ecological facilities. |
| /api/v1/export/geojson | GET | Standard GeoJSON FeatureCollection of all active thermal anomalies. |
| /api/v1/pyrometry | POST | Calculates sub-pixel temperature, fire area, and CO2 emissions given FRP and MWIR/TIR brightness temps. |
| /api/v1/verify | POST | Logs ground-truth verification tag from field operators into the active learning database. |

---

## 🛠️ Technology Stack

- **Frontend:** Vanilla JavaScript (ES6+ Modules), Semantic HTML5, Custom High-Performance CSS3 (Dark Mode, Glassmorphism, Micro-Animations).
- **Mapping & GIS:** Leaflet 1.9.4, NASA GIBS WMS Layers, OpenStreetMap CartoDB Tiles.
- **Charts & Telemetry:** Chart.js 4.4.1 (Planck Blackbody Curves, 90-Day Historical Time-Series, Multi-Factor Deviation Distributions).
- **Backend & Ingestion:** Python HTTP Server, NASA FIRMS LANCE API Client, Background Threading Auto-Sync.
- **Machine Learning (Brain 1):** Scikit-Learn RandomForestClassifier (200 Estimators, 14 Multi-Modal Features).
- **Anomaly Detection (Brain 2):** Statistical Gaussian Deviation Model, Centroid Stability Vector Tracking, Volumetric FRP Ratio Expansion.

---

## 👥 Authors & Acknowledgments

- Developed for the **Smart India Hackathon (SIH 2024)**.
- Telemetry provided by **NASA LANCE FIRMS** (MODIS & VIIRS active thermal radiometry).
- Basemap and infrastructure boundary data from **OpenStreetMap Contributors** and **ESA WorldCover 10m Land Cover**.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
