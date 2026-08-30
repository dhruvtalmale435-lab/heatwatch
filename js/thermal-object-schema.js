/**
 * HeatWatch 3.1 - Standardized Thermal Object Schema & Contracts
 * The central data structure consumed by Brain 1 (Attribution), Brain 2 (Anomaly),
 * GIS Command Center, and Human-in-the-Loop active learning.
 */

export const ThermalObjectSchema = {
  // 1. Identity & Classification
  id: "string",                   // e.g. "OBJ-1045"
  name: "string",                 // Human-readable identifier
  studyRegionId: "string",        // e.g. "jamnagar", "singrauli"
  centroid: [0.0, 0.0],           // [latitude, longitude]
  primaryCategory: "string",      // "industrial" | "wildfire" | "agriculture" | "mining" | "unclassified"
  categoryLabel: "string",
  subtype: "string",
  status: "string",               // "nominal" | "elevated" | "high_priority"
  statusLabel: "string",
  evidenceScore: 0.0,             // 0.0 to 1.0 (Brain 1 attribution confidence)
  
  // 2. Spatial Context (OSM & Land-Cover)
  spatialContext: {
    matchedFacility: {
      name: "string",
      type: "string",
      osmId: "string",
      distanceMeters: 0,
      tags: {}
    },
    landCoverComposition: {
      industrialBuiltUpPct: 0.0,
      treeCoverForestPct: 0.0,
      croplandPct: 0.0,
      bareSoilPavedPct: 0.0,
      waterBodyPct: 0.0
    },
    nighttimeLightsRadiance: 0.0 // nW/cm²/sr (VIIRS DNB)
  },

  // 3. Observed Thermal Telemetry
  thermalMetrics: {
    currentFRP: 0.0,              // MW (VIIRS / MODIS)
    currentBrightnessTempK: 0.0,  // Kelvin (VIIRS I4 Band 3.74µm)
    activePixelCount: 0,
    footprintAreaHa: 0.0,
    sensor: "string",
    detectionTimeUTC: "string",
    persistenceDays: 0,
    totalDetectionsHistorical: 0
  },

  // 4. Brain 2: 90-Day Statistical Baseline & Anomaly Profile
  historicalProfile: {
    rollingMeanFRP: 0.0,          // 90-day mean (μ)
    rollingStdDevFRP: 0.0,        // 90-day std dev (σ)
    frpSurgeRatio: 1.0,           // currentFRP / rollingMeanFRP
    historicalFootprintHa: 0.0,
    footprintExpansionRatio: 1.0,
    centroidDriftMeters: 0.0,
    anomalyScore: 0.0,            // 0.0 to 1.0 (Weighted statistical score)
    statisticalZScore: 0.0
  },

  // 5. Derived Radiometric Estimates (Secondary Analysis)
  radiometricEstimates: {
    methodologyNote: "Derived physical estimate with medium confidence",
    estimatedSourceTempK: 0,
    estimatedSourceAreaM2: 0.0,
    estimatedDailyFlaredGasM3: 0,
    estimatedDailyCo2Tonnes: 0.0
  },

  // 6. Human Review & Active Learning State
  humanVerification: {
    isVerified: false,
    verifiedCategory: null,       // "industrial" | "wildfire" | "agriculture" | "false_alarm"
    verifiedBy: null,
    verificationTimestamp: null,
    notes: ""
  }
};
