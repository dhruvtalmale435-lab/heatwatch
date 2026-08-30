/**
 * HeatWatch - Interactive API Playground & Data Exporter
 * Implements the frozen API endpoints from Document Page 10 & 102
 */

import { THERMAL_OBJECTS, OSM_FACILITIES, RAW_FIRMS_DETECTIONS, HISTORICAL_FRP_DATA } from './data.js';

export class ApiPlayground {
  constructor() {
    this.endpoints = {
      'GET /api/health': () => ({
        status: "healthy",
        service: "HeatWatch-Intelligence-API",
        version: "2.4.0-sih-prod",
        uptime_seconds: 489201,
        active_satellite_sources: ["VIIRS_SNPP_375M", "VIIRS_NOAA20", "MODIS_TERRA", "SENTINEL2_MSI"],
        database_layer: "PostgreSQL 16 + PostGIS 3.4"
      }),

      "GET /api/statistics": () => ({
        total_monitored_assets: 52,
        active_live_hotspots: 266,
        high_priority_anomalies: 2,
        human_verified_records_count: 14,
        model_versions: {
          brain_1_attribution: "XGBoost_v1.2 + EvidenceRules",
          brain_2_anomaly: "StatisticalBaseline_v2.0 (Isolation Forest Ready)"
        }
      }),

      "POST /api/verification": () => ({
        status: "success",
        message: "Ground-truth verdict successfully logged to continuous learning ledger.",
        record: {
          object_id: "OBJ-1045",
          verified_category: "industrial",
          verified_by: "District_Officer_Gujarat",
          timestamp_utc: "2026-08-28T07:45:12Z",
          retraining_status: "QUEUED_FOR_RETRAINING"
        }
      }),

      'GET /api/hotspots': () => ({
        type: "FeatureCollection",
        count: THERMAL_OBJECTS.length,
        timestamp: new Date().toISOString(),
        features: THERMAL_OBJECTS.map(obj => ({
          type: "Feature",
          id: obj.id,
          geometry: {
            type: "Point",
            coordinates: [obj.coordinates[1], obj.coordinates[0]]
          },
          properties: {
            name: obj.name,
            category: obj.primaryCategory,
            category_label: obj.categoryLabel,
            status: obj.status,
            confidence_score: obj.evidenceScore,
            current_frp_mw: obj.thermal.currentFRP,
            historical_mean_frp_mw: obj.thermal.historicalMeanFRP,
            frp_deviation_factor: obj.thermal.frpDeviationRatio,
            matched_facility: obj.matchedFacility.name,
            recommended_action: obj.recommendedAction
          }
        }))
      }),

      'GET /api/hotspots/OBJ-1045': () => {
        const obj = THERMAL_OBJECTS.find(o => o.id === "OBJ-1045");
        return {
          id: obj.id,
          name: obj.name,
          coordinates: { latitude: obj.coordinates[0], longitude: obj.coordinates[1] },
          category: obj.primaryCategory,
          subtype: obj.subtype,
          confidence: obj.confidence,
          evidence_score: obj.evidenceScore,
          facility: {
            name: obj.matchedFacility.name,
            type: obj.matchedFacility.type,
            osm_id: obj.matchedFacility.osmId,
            distance_m: obj.matchedFacility.distanceMeters,
            tags: obj.matchedFacility.tags
          },
          thermal_profile: {
            current_frp: obj.thermal.currentFRP,
            historical_mean_frp: obj.thermal.historicalMeanFRP,
            deviation_factor: obj.thermal.frpDeviationRatio,
            brightness_temp_k: obj.thermal.currentBrightnessTempK,
            centroid_stability: obj.thermal.centroidStabilityScore
          },
          persistence: {
            first_seen: obj.thermal.firstSeen,
            last_seen: obj.thermal.lastSeen,
            total_detections: obj.thermal.totalDetections,
            active_days: obj.thermal.activeDays,
            rate: obj.thermal.persistenceRate
          },
          anomaly_engine: {
            total_score: obj.anomalyFormula.totalAnomalyScore,
            status: obj.status,
            formula: "0.40*FRP_dev + 0.25*Footprint + 0.15*Displacement + 0.10*Duration + 0.10*Pattern"
          },
          evidence_points: obj.evidencePoints.map(e => e.text),
          nasa_comparison: obj.nasaComparison,
          recommended_action: obj.recommendedAction
        };
      },

      'GET /api/hotspots/OBJ-1045/history': () => ({
        object_id: "OBJ-1045",
        unit: "Fire Radiative Power (MW)",
        time_span_days: 90,
        baseline_mean_mw: 42.1,
        history: HISTORICAL_FRP_DATA["OBJ-1045"]
      }),

      'GET /api/facilities': () => ({
        type: "FeatureCollection",
        count: OSM_FACILITIES.length,
        features: OSM_FACILITIES.map(fac => ({
          type: "Feature",
          id: fac.id,
          geometry: {
            type: "Polygon",
            coordinates: [fac.polygon.map(coord => [coord[1], coord[0]])]
          },
          properties: {
            name: fac.name,
            type: fac.type,
            attributes: fac.attributes
          }
        }))
      }),

      'GET /api/alerts': () => ({
        queue_status: "ACTIVE",
        critical_alerts_count: THERMAL_OBJECTS.filter(o => o.status === 'high_priority').length,
        elevated_alerts_count: THERMAL_OBJECTS.filter(o => o.status === 'elevated').length,
        alerts: THERMAL_OBJECTS.filter(o => o.status !== 'normal').map(obj => ({
          alert_id: `ALT-${obj.id}`,
          target_object: obj.id,
          facility_name: obj.matchedFacility.name,
          severity: obj.status,
          frp_deviation: `${obj.thermal.frpDeviationRatio}x baseline`,
          recommended_action: obj.recommendedAction,
          nearest_population: obj.nearestSettlement
        }))
      }),

      'GET /api/compare/nasa': () => ({
        comparison_benchmark: "HeatWatch AI vs NASA FIRMS Static Thermal Anomalies (March 2025 Release)",
        matrix: THERMAL_OBJECTS.map(obj => ({
          id: obj.id,
          nasa_firms_static_mask: obj.nasaComparison.nasaLabel,
          heatwatch_multimodal_ai: obj.nasaComparison.heatwatchLabel,
          status_assessment: obj.nasaComparison.agreementStatus,
          novelty_delta: obj.nasaComparison.explanation
        }))
      }),

      'POST /api/ingest/firms': () => ({
        status: "success",
        message: "Simulated FIRMS satellite packet parsed & clustered into ST-DBSCAN objects",
        ingested_records: RAW_FIRMS_DETECTIONS.length,
        recomputed_clusters: THERMAL_OBJECTS.length,
        timestamp: new Date().toISOString()
      })
    };
  }

  getEndpointResponse(endpointName) {
    const handler = this.endpoints[endpointName];
    if (handler) {
      return JSON.stringify(handler(), null, 2);
    }
    return JSON.stringify({ error: "Endpoint not found" }, null, 2);
  }

  exportGeoJson(filename = "heatwatch_thermal_intelligence.geojson") {
    const geojson = this.endpoints['GET /api/hotspots']();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  generateIncidentDossier(objectId) {
    const obj = THERMAL_OBJECTS.find(o => o.id === objectId) || THERMAL_OBJECTS[0];
    const dossierText = `
================================================================================
HEATWATCH SATELLITE THERMAL INTELLIGENCE - ACTIONABLE INCIDENT DOSSIER
CONFIDENTIAL - FOR DISTRICT DISASTER MANAGEMENT & SAFETY REGULATORS
================================================================================
Generated: ${new Date().toISOString()}
Platform: HeatWatch Multimodal AI Early Warning System

1. TARGET THERMAL OBJECT IDENTIFICATION
--------------------------------------------------------------------------------
Object ID:            ${obj.id}
Object Name:          ${obj.name}
Classification:       ${obj.categoryLabel} (${obj.subtype})
Status Level:         ${obj.statusLabel}
Evidence Score:       ${(obj.evidenceScore * 100).toFixed(1)}% (Confidence: ${obj.confidence})
Centroid Coordinates: ${obj.coordinates[0].toFixed(5)}° N, ${obj.coordinates[1].toFixed(5)}° E

2. PHYSICAL SATELLITE TELEMETRY (VIIRS 375m / MODIS)
--------------------------------------------------------------------------------
Current FRP:          ${obj.thermal.currentFRP} MW
90-Day Baseline FRP:  ${obj.thermal.historicalMeanFRP} MW (Surge Factor: ${obj.thermal.frpDeviationRatio}x)
Brightness Temp:      ${obj.thermal.currentBrightnessTempK} K
Footprint Area:       ${obj.thermal.footprintAreaHa} Ha (Historical: ${obj.thermal.historicalFootprintHa} Ha)
Centroid Stability:   ${obj.thermal.centroidStabilityScore} (Fixed location index)
Historical Duration:  ${obj.thermal.activeDays} active days across ${obj.thermal.totalDetections} detections

3. FACILITY & INFRASTRUCTURE CONTEXT
--------------------------------------------------------------------------------
Matched Facility:     ${obj.matchedFacility.name}
Facility Type:        ${obj.matchedFacility.type}
OSM ID:               ${obj.matchedFacility.osmId}
Distance to Boundary: ${obj.matchedFacility.distanceMeters} meters
Land Cover (1km):     ${obj.landCover.industrialBuiltUp || 0}% Industrial/Built-up, ${obj.landCover.vegetationTree || 0}% Forest, ${obj.landCover.cropland || 0}% Cropland

4. NASA FIRMS VS HEATWATCH BENCHMARK
--------------------------------------------------------------------------------
NASA Static Mask:     ${obj.nasaComparison.nasaLabel}
HeatWatch Verdict:    ${obj.nasaComparison.heatwatchLabel}
Novelty Assessment:   ${obj.nasaComparison.explanation}

5. FIELD VERIFICATION ACTION PLAN
--------------------------------------------------------------------------------
Recommended Action:   ${obj.recommendedAction}
Nearest Population:   ${obj.nearestSettlement.name} (${obj.nearestSettlement.distanceKm} km, Est. Pop: ${obj.nearestSettlement.populationEstimate})
Emergency Action:     Dispatch regional rapid assessment unit.

================================================================================
END OF DOSSIER - HEATWATCH DECISION SUPPORT PLATFORM
================================================================================
    `;

    const blob = new Blob([dossierText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `HeatWatch_Incident_Dossier_${obj.id}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }
}
