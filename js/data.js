/**
 * HeatWatch - Master Combined Data Store & Regional Catalogs
 * Combines curated detailed benchmark objects with the comprehensive All-India catalog.
 */

import { ALL_INDIA_FACILITIES } from './india-data.js';

export { ALL_INDIA_FACILITIES };

export const STUDY_REGIONS = [
  {
    id: "all_india",
    name: "🇮🇳 All-India Overview (50+ Industrial Facilities)",
    center: [22.5937, 78.9629],
    zoom: 5,
    description: "Subcontinent-wide industrial surveillance across all major refineries, super thermal power plants, steel mills, and coal basins."
  },
  {
    id: "jamnagar",
    name: "Jamnagar Petrochemical Corridor (Gujarat)",
    center: [22.3590, 69.8660],
    zoom: 14,
    description: "World's largest refining hub (RIL Moti Khavdi) with intense persistent flaring, cracking units, and marine terminal."
  },
  {
    id: "hazira",
    name: "Hazira Heavy Industry & LNG Hub (Gujarat)",
    center: [21.1180, 72.6510],
    zoom: 14,
    description: "Steel manufacturing, LNG import terminal, fertilizer complexes, and petrochemical plants."
  },
  {
    id: "korba",
    name: "Korba Super Thermal Power & Coal Belt (Chhattisgarh)",
    center: [22.3780, 82.7230],
    zoom: 13,
    description: "Super thermal power generation cluster, aluminum smelting, and open-cast coal mines."
  },
  {
    id: "singrauli",
    name: "Singrauli Energy Hub (Madhya Pradesh)",
    center: [24.0980, 82.6710],
    zoom: 13,
    description: "Heavy coal extraction pit, pithead thermal power stations, and industrial ash ponds."
  },
  {
    id: "jharia",
    name: "Jharia Coalfield Mine Fires (Jharkhand)",
    center: [23.7420, 86.4150],
    zoom: 14,
    description: "Century-old subterranean coal seam auto-oxidation fires with high risk to local settlements."
  },
  {
    id: "simlipal",
    name: "Simlipal Biosphere Buffer (Odisha)",
    center: [21.8500, 86.3500],
    zoom: 11,
    description: "Protected dense forest canopy with rapid spreading seasonal biomass wildfire."
  },
  {
    id: "patiala",
    name: "Patiala Agrarian Corridor (Punjab)",
    center: [30.3398, 76.3869],
    zoom: 12,
    description: "Seasonal agricultural residue / crop stubble burning zone across high cropland fraction."
  }
];

export const THERMAL_OBJECTS = [
  {
    id: "OBJ-1045",
    name: "Jamnagar Polypropylene Cracker Flare Complex #4",
    regionId: "jamnagar",
    centroid: [22.3615, 69.8640],
    coordinates: [22.3615, 69.8640],
    categoryGroup: "industrial_fire",
    primaryCategory: "industrial",
    categoryLabel: "Industrial Refinery Flare Escalation",
    subtype: "Refinery / Petrochemical Facility",
    status: "high_priority",
    statusLabel: "HIGH-PRIORITY ANOMALY",
    evidenceScore: 0.91,
    confidence: "High (91%)",
    
    spatialContext: {
      matchedFacility: {
        name: "Jamnagar Mega-Refinery & Petrochemical Complex",
        type: "Petrochemical & Refinery Plant",
        osmId: "way/98234101",
        distanceMeters: 210,
        tags: {
          "landuse": "industrial",
          "industrial": "petrochemical",
          "man_made": "flare",
          "operator": "Reliance Industries Ltd",
          "hazard_class": "Class 1 High Seveso"
        }
      },
      landCoverComposition: {
        industrialBuiltUpPct: 76.4,
        bareSoilPavedPct: 15.2,
        waterBodyPct: 5.1,
        treeCoverForestPct: 3.3,
        croplandPct: 0.0
      },
      nighttimeLightsRadiance: 84.6
    },

    matchedFacility: {
      name: "Jamnagar Mega-Refinery & Petrochemical Complex",
      type: "Petrochemical & Refinery Plant",
      osmId: "way/98234101",
      distanceMeters: 210,
      tags: {
        "landuse": "industrial",
        "industrial": "petrochemical",
        "man_made": "flare",
        "operator": "Reliance Industries Ltd",
        "hazard_class": "Class 1 High Seveso"
      }
    },
    
    thermal: {
      currentFRP: 68.4,
      historicalMeanFRP: 18.2,
      frpDeviationRatio: 3.76,
      currentBrightnessTempK: 368.5,
      historicalMeanTempK: 335.2,
      sensor: "VIIRS SNPP 375m (I-Band 3.74µm)",
      detectionTime: "2026-08-28 02:18 UTC",
      firstSeen: "2024-03-12",
      lastSeen: "2026-08-28",
      totalDetections: 142,
      activeDays: 94,
      persistenceRate: "92.4% (Multi-year persistent)",
      centroidStabilityScore: 0.96,
      footprintAreaHa: 8.4,
      historicalFootprintHa: 2.2,
      adjacentHotspotsDetected: 3
    },
    
    landCover: {
      industrialBuiltUp: 76.4,
      bareSoilPaved: 15.2,
      waterBody: 5.1,
      vegetationTree: 3.3,
      cropland: 0.0
    },
    
    nighttimeLight: {
      radianceValue: 84.6,
      backgroundRatio: "12.4x ambient",
      classification: "Intense Industrial Glow"
    },
    
    historicalProfile: {
      rollingMeanFRP: 18.2,
      rollingStdDevFRP: 4.8,
      frpSurgeRatio: 3.76,
      historicalFootprintHa: 2.2,
      footprintExpansionRatio: 3.81,
      centroidDriftMeters: 140,
      anomalyScore: 0.883,
      statisticalZScore: 10.45
    },

    anomalyFormula: {
      frpDeviationScore: 0.40 * 0.95,
      footprintExpansionScore: 0.25 * 0.88,
      centroidDisplacementScore: 0.15 * 0.72,
      durationDeviationScore: 0.10 * 0.90,
      temporalPatternScore: 0.10 * 0.85,
      totalAnomalyScore: 0.883
    },

    radiometricEstimates: {
      methodologyNote: "Derived physical estimate (Medium Confidence)",
      estimatedSourceTempK: 1620,
      estimatedSourceAreaM2: 17.4,
      estimatedDailyFlaredGasM3: 165528,
      estimatedDailyCo2Tonnes: 455.2
    },

    humanVerification: {
      isVerified: true,
      verifiedCategory: "industrial",
      verifiedBy: "Disaster_Control_Gujarat",
      verificationTimestamp: "2026-08-28 06:15 UTC",
      notes: "Verified: Unplanned hydrocracker flare escalation."
    },
    
    evidencePoints: [
      { text: "Persistent fixed thermal location active >90 days over 2 years", verified: true, type: "pro-industrial" },
      { text: "OSM mapped petrochemical refinery polygon 210m from centroid", verified: true, type: "pro-industrial" },
      { text: "ESA WorldCover verifies 76.4% industrial/built-up surface context", verified: true, type: "pro-industrial" },
      { text: "High Nighttime Lights radiance (84.6 nW/cm²/sr) confirms electrified heavy industry", verified: true, type: "pro-industrial" },
      { text: "Current FRP (68.4 MW) is 3.76× above 90-day baseline (18.2 MW)", verified: true, type: "anomaly-trigger" },
      { text: "Thermal footprint expanded +281% beyond designated flare stack perimeter", verified: true, type: "anomaly-trigger" },
      { text: "Multiple adjacent auxiliary thermal pixels ignited in storage tank sector", verified: true, type: "anomaly-trigger" }
    ],
    
    nasaComparison: {
      nasaLabel: "Static Thermal Anomaly (Industrial Mask)",
      heatwatchLabel: "High-Priority Abnormal Industrial Incident",
      agreementStatus: "Categorical Alignment / Critical Severity Upgrade",
      explanation: "NASA FIRMS screens this location as a routine static industrial source based on historical inventories. HeatWatch identifies an acute 3.76× thermal surge and uncontained spatial flare-up requiring immediate operator verification."
    },
    
    spectralData: {
      sentinel2Acquisition: "2026-08-27 05:42 UTC (Cloud Cover: 2%)",
      swir2Radiance: 0.94,
      swir1Radiance: 0.81,
      ndvi: 0.08,
      nbr: -0.42,
      smokeAerosolIndex: 2.8,
      plumeDetected: true,
      plumeDirection: "South-West (18 km/h wind)"
    },
    
    glintFilter: {
      passed: true,
      glintProbability: 0.02,
      albedoReflectance: 0.08,
      solarElevationDeg: 48.2,
      statusLabel: "PASSED: Verified High-Temp Thermal Emitter (Solar/Glint Rejected)"
    },

    spatialDynamics: {
      centroidStabilityPct: 99.4,
      isStationary: true,
      spreadVelocityKmH: 0.0,
      motionType: "Stationary Facility Stack (Zero Spread)",
      driftVectorMeters: 12,
      plumeDispersion: "South-West (18 km/h)"
    },

    hazardProximity: {
      isEncroaching: false,
      facilityStatus: "Inside Designated Industrial Boundary",
      nearestInfrastructure: "Jamnagar Polypropylene Cracker Unit #4 (210m)",
      threatLevel: "CRITICAL_INTERNAL_SURGE",
      bufferDistanceKm: 0.21,
      summary: "Critical internal surge within licensed refinery perimeter; adjacent storage tank sector threatened."
    },

    recommendedAction: "CRITICAL: Urgent field verification required. Notify District Disaster Management Authority (DDMA) & Industrial Safety Directorate. Cross-check plant telemetry for emergency pressure release valve status.",
    nearestSettlement: {
      name: "Moti Khavdi Settlement",
      distanceKm: 1.8,
      populationEstimate: "14,500 residents"
    }
  },
  
  {
    id: "OBJ-1082",
    name: "Hazira Heavy LNG & Metallurgical Flare Cluster",
    regionId: "hazira",
    centroid: [21.1165, 72.6530],
    coordinates: [21.1165, 72.6530],
    categoryGroup: "routine_flare",
    primaryCategory: "industrial",
    categoryLabel: "Routine Industrial Gas Flare",
    subtype: "LNG Terminal / Gas Regasification",
    status: "normal",
    statusLabel: "ROUTINE PERSISTENT FLARING",
    evidenceScore: 0.94,
    confidence: "High (94%)",
    
    matchedFacility: {
      name: "Hazira LNG Terminal & Cryogenic Storage",
      type: "LNG & Gas Processing",
      osmId: "way/74102934",
      distanceMeters: 140,
      tags: {
        "landuse": "industrial",
        "man_made": "storage_tank",
        "industrial": "gas",
        "operator": "Shell / TotalEnergies JV"
      }
    },
    
    thermal: {
      currentFRP: 38.2,
      historicalMeanFRP: 35.8,
      frpDeviationRatio: 1.07,
      currentBrightnessTempK: 395.0,
      historicalMeanTempK: 390.4,
      sensor: "VIIRS SNPP 375m",
      detectionTime: "2026-08-28 01:54 UTC",
      firstSeen: "2023-08-10",
      lastSeen: "2026-08-28",
      totalDetections: 210,
      activeDays: 180,
      persistenceRate: "96.2% (Steady continuous flare)",
      centroidStabilityScore: 0.98,
      footprintAreaHa: 2.1,
      historicalFootprintHa: 2.0,
      adjacentHotspotsDetected: 0
    },
    
    landCover: {
      industrialBuiltUp: 82.1,
      waterBody: 14.5,
      bareSoilPaved: 3.4,
      vegetationTree: 0.0,
      cropland: 0.0
    },
    
    nighttimeLight: {
      radianceValue: 92.3,
      backgroundRatio: "14.8x ambient",
      classification: "Intense Port & Terminal Lighting"
    },
    
    anomalyFormula: {
      frpDeviationScore: 0.40 * 0.08,
      footprintExpansionScore: 0.25 * 0.05,
      centroidDisplacementScore: 0.15 * 0.02,
      durationDeviationScore: 0.10 * 0.05,
      temporalPatternScore: 0.10 * 0.04,
      totalAnomalyScore: 0.058
    },
    
    evidencePoints: [
      { text: "Continuous multi-year thermal signature coinciding with licensed flare tip", verified: true, type: "pro-industrial" },
      { text: "140m from registered Cryogenic Gas Terminal polygon", verified: true, type: "pro-industrial" },
      { text: "82.1% industrial port land classification", verified: true, type: "pro-industrial" },
      { text: "Thermal power output (38.2 MW) closely matches historical average (35.8 MW)", verified: true, type: "normal-behavior" },
      { text: "No spatial expansion or spillover beyond containment boundary", verified: true, type: "normal-behavior" }
    ],
    
    nasaComparison: {
      nasaLabel: "Static Thermal Anomaly (Gas Flare)",
      heatwatchLabel: "Normal Industrial Operational Flare (Nominal)",
      agreementStatus: "Full Agreement (Verified Safe)",
      explanation: "Both NASA FIRMS and HeatWatch recognize this as a known industrial flare. HeatWatch verifies that operating parameters remain within safe baseline bounds."
    },
    
    spectralData: {
      sentinel2Acquisition: "2026-08-26 05:48 UTC",
      swir2Radiance: 0.82,
      swir1Radiance: 0.65,
      ndvi: 0.02,
      nbr: -0.15,
      smokeAerosolIndex: 0.4,
      plumeDetected: false,
      plumeDirection: "West"
    },
    
    glintFilter: {
      passed: true,
      glintProbability: 0.01,
      albedoReflectance: 0.06,
      solarElevationDeg: 46.5,
      statusLabel: "PASSED: Verified High-Temp Emitter (Glint/Solar Rejected)"
    },

    spatialDynamics: {
      centroidStabilityPct: 99.8,
      isStationary: true,
      spreadVelocityKmH: 0.0,
      motionType: "Stationary Facility Stack (Zero Spread)",
      driftVectorMeters: 6,
      plumeDispersion: "West (8 km/h)"
    },

    hazardProximity: {
      isEncroaching: false,
      facilityStatus: "Inside Designated Port & Terminal Area",
      nearestInfrastructure: "Shell Hazira Cryogenic Storage (140m)",
      threatLevel: "NOMINAL_OPERATION",
      bufferDistanceKm: 0.14,
      summary: "Normal operational gas flaring; within safe licensed buffer zone."
    },

    recommendedAction: "Routine automated monitoring. No operator dispatch required.",
    nearestSettlement: {
      name: "Hazira Port Village",
      distanceKm: 3.4,
      populationEstimate: "4,200 residents"
    }
  },
  
  {
    id: "OBJ-2019",
    name: "Korba Super Thermal Power Ash Disposal & Flare Vent",
    regionId: "korba",
    centroid: [22.3785, 82.7245],
    coordinates: [22.3785, 82.7245],
    categoryGroup: "industrial_fire",
    primaryCategory: "industrial",
    categoryLabel: "Power Plant Overheating & Spillover",
    subtype: "Thermal Power Station (Coal-Fired)",
    status: "elevated",
    statusLabel: "ELEVATED THERMAL ANOMALY",
    evidenceScore: 0.88,
    confidence: "High (88%)",
    
    matchedFacility: {
      name: "NTPC Korba Super Thermal Power Station (2,600 MW)",
      type: "Coal Thermal Power Plant",
      osmId: "way/61209384",
      distanceMeters: 180,
      tags: {
        "power": "plant",
        "plant:source": "coal",
        "man_made": "chimney",
        "operator": "NTPC Limited"
      }
    },
    
    thermal: {
      currentFRP: 112.5,
      historicalMeanFRP: 58.4,
      frpDeviationRatio: 1.93,
      currentBrightnessTempK: 448.6,
      historicalMeanTempK: 388.1,
      sensor: "MODIS Terra & VIIRS NOAA-20",
      detectionTime: "2026-08-28 03:10 UTC",
      firstSeen: "2023-01-15",
      lastSeen: "2026-08-28",
      totalDetections: 384,
      activeDays: 290,
      persistenceRate: "89.5% (High persistence)",
      centroidStabilityScore: 0.88,
      footprintAreaHa: 8.4,
      historicalFootprintHa: 5.1,
      adjacentHotspotsDetected: 1
    },
    
    landCover: {
      industrialBuiltUp: 68.2,
      bareSoilPaved: 18.3,
      vegetationTree: 9.1,
      waterBody: 4.4,
      cropland: 0.0
    },
    
    nighttimeLight: {
      radianceValue: 68.9,
      backgroundRatio: "9.2x ambient",
      classification: "Heavy Industrial Grid"
    },
    
    anomalyFormula: {
      frpDeviationScore: 0.40 * 0.62,
      footprintExpansionScore: 0.25 * 0.45,
      centroidDisplacementScore: 0.15 * 0.35,
      durationDeviationScore: 0.10 * 0.40,
      temporalPatternScore: 0.10 * 0.50,
      totalAnomalyScore: 0.503
    },
    
    evidencePoints: [
      { text: "High multi-year detection count adjacent to 2.6 GW power generating units", verified: true, type: "pro-industrial" },
      { text: "OSM mapped cooling towers and boiler chimneys 180m from centroid", verified: true, type: "pro-industrial" },
      { text: "FRP elevated to 1.93× baseline during uncustomary daytime transition", verified: true, type: "anomaly-trigger" },
      { text: "Thermal boundary spreading toward coal conveyor storage corridor", verified: true, type: "anomaly-trigger" }
    ],
    
    nasaComparison: {
      nasaLabel: "Static Thermal Anomaly (Power Plant)",
      heatwatchLabel: "Elevated Power Facility Thermal Output",
      agreementStatus: "Context Refined",
      explanation: "NASA categorizes as static coal power plant. HeatWatch flags secondary heat spillover near the fuel conveyor feeder."
    },
    
    spectralData: {
      sentinel2Acquisition: "2026-08-25 05:32 UTC",
      swir2Radiance: 0.74,
      swir1Radiance: 0.58,
      ndvi: 0.12,
      nbr: -0.28,
      smokeAerosolIndex: 1.4,
      plumeDetected: true,
      plumeDirection: "North-East"
    },
    
    glintFilter: {
      passed: true,
      glintProbability: 0.03,
      albedoReflectance: 0.11,
      solarElevationDeg: 51.4,
      statusLabel: "PASSED: Verified High-Temp Emitter (Glint/Solar Rejected)"
    },

    spatialDynamics: {
      centroidStabilityPct: 88.5,
      isStationary: true,
      spreadVelocityKmH: 0.0,
      motionType: "Stationary Facility Ash Vent (Zero Spread)",
      driftVectorMeters: 85,
      plumeDispersion: "North-East (12 km/h)"
    },

    hazardProximity: {
      isEncroaching: false,
      facilityStatus: "Inside Power Plant Perimeter",
      nearestInfrastructure: "NTPC Coal Conveyor Belt & Stockpile (180m)",
      threatLevel: "ELEVATED_FACILITY_RISK",
      bufferDistanceKm: 0.18,
      summary: "Elevated boiler/ash heat gradient encroaching toward internal coal conveyor corridor."
    },

    recommendedAction: "Issue operational warning to plant safety supervisor. Verify thermal boundary of coal stockpile yard.",
    nearestSettlement: {
      name: "Jamnipali Township",
      distanceKm: 2.1,
      populationEstimate: "28,000 residents"
    }
  },

  {
    id: "OBJ-3041",
    name: "Simlipal Biosphere Core Reserve Buffer Zone",
    regionId: "simlipal",
    centroid: [21.8500, 86.3500],
    coordinates: [21.8500, 86.3500],
    primaryCategory: "wildfire",
    categoryGroup: "forest_fire",
    primaryCategory: "wildfire",
    categoryLabel: "Active Forest Canopy Wildfire",
    subtype: "Dense Forest Canopy Fire Front",
    status: "high_priority",
    statusLabel: "HIGH-PRIORITY ACTIVE WILDFIRE",
    evidenceScore: 0.94,
    confidence: "Very High (94%)",
    
    matchedFacility: {
      name: "Simlipal National Park & Tiger Reserve Core Sector",
      type: "Protected Biosphere / Dense Forest",
      osmId: "relation/12839401",
      distanceMeters: 120,
      tags: {
        "boundary": "protected_area",
        "leisure": "nature_reserve",
        "protect_class": "2",
        "operator": "Odisha Forest Department"
      }
    },
    
    thermal: {
      currentFRP: 86.4,
      historicalMeanFRP: 2.1,
      frpDeviationRatio: 41.1,
      currentBrightnessTempK: 388.2,
      historicalMeanTempK: 298.0,
      sensor: "VIIRS NOAA-20 & MODIS Terra",
      detectionTime: "2026-08-28 03:45 UTC",
      firstSeen: "2026-08-28",
      lastSeen: "2026-08-28",
      totalDetections: 12,
      activeDays: 1,
      persistenceRate: "1.2% (Rapid non-persistent front)",
      centroidStabilityScore: 0.18,
      footprintAreaHa: 18.2,
      historicalFootprintHa: 0.0,
      adjacentHotspotsDetected: 6
    },
    
    landCover: {
      vegetationTree: 88.6,
      bareSoilPaved: 5.2,
      waterBody: 4.1,
      cropland: 2.1,
      industrialBuiltUp: 0.0
    },
    
    nighttimeLight: {
      radianceValue: 0.4,
      backgroundRatio: "0.1x ambient",
      classification: "Unlit Pristine Forest Biosphere"
    },
    
    anomalyFormula: {
      frpDeviationScore: 0.40 * 0.99,
      footprintExpansionScore: 0.25 * 0.95,
      centroidDisplacementScore: 0.15 * 0.92,
      durationDeviationScore: 0.10 * 0.20,
      temporalPatternScore: 0.10 * 0.90,
      totalAnomalyScore: 0.881
    },
    
    evidencePoints: [
      { text: "NASA FIRMS live satellite telemetry detects 86.4 MW active advancing fire front", verified: true, type: "anomaly-trigger" },
      { text: "88.6% Dense Forest Canopy verified by ESA WorldCover (Zero Industrial Land)", verified: true, type: "pro-wildfire" },
      { text: "Rapid centroid migration (3.8 km/h) confirms moving flame front, not stationary factory stack", verified: true, type: "pro-wildfire" },
      { text: "Zero industrial infrastructure within 45km buffer", verified: true, type: "pro-wildfire" }
    ],
    
    nasaComparison: {
      nasaLabel: "Vegetation Thermal Anomaly",
      heatwatchLabel: "High-Priority Forest Canopy Wildfire Front",
      agreementStatus: "Categorical Alignment / Rapid Action",
      explanation: "Both systems classify as natural vegetation fire. HeatWatch calculates forward spread rate (3.8 km/h SW) and provides immediate hazard buffer alerting to Baripada forest division."
    },
    
    spectralData: {
      sentinel2Acquisition: "2026-08-28 05:42 UTC",
      swir2Radiance: 0.89,
      swir1Radiance: 0.76,
      ndvi: 0.42,
      nbr: -0.58,
      smokeAerosolIndex: 4.2,
      plumeDetected: true,
      plumeDirection: "South-West (18 km/h wind dispersion)"
    },
    
    glintFilter: {
      passed: true,
      glintProbability: 0.01,
      albedoReflectance: 0.05,
      solarElevationDeg: 54.0,
      statusLabel: "PASSED: Verified Forest Canopy Combustion Core"
    },

    spatialDynamics: {
      centroidStabilityPct: 18.5,
      isStationary: false,
      spreadVelocityKmH: 3.8,
      motionType: "Advancing Active Fire Front (3.8 km/h)",
      driftVectorMeters: 1450,
      plumeDispersion: "South-West (18 km/h wind dispersion)"
    },

    hazardProximity: {
      isEncroaching: true,
      facilityStatus: "Canopy Wildfire 1.8km from Peripheral Power Line Corridor",
      nearestInfrastructure: "Baripada High-Voltage Grid & Substation (1.8 km)",
      threatLevel: "HIGH_ENCROACHMENT_THREAT",
      bufferDistanceKm: 1.8,
      summary: "Active forest fire advancing southwest toward Baripada peripheral power corridor."
    },

    recommendedAction: "CRITICAL: Deploy State Disaster Response Force (SDRF) & Odisha Forest Fire Wing. Establish aerial firebreak along southern ridge.",
    nearestSettlement: {
      name: "Baripada Forest Village",
      distanceKm: 2.8,
      populationEstimate: "3,200 residents"
    }
  },

  {
    id: "OBJ-8021",
    name: "Bhadla Mega Solar Park Photovoltaic Glint & Reflection Zone",
    regionId: "jamnagar",
    centroid: [27.5380, 71.9160],
    coordinates: [27.5380, 71.9160],
    categoryGroup: "glint_filtered",
    primaryCategory: "solar_glint",
    categoryLabel: "Solar PV Glint / High Albedo Reflection",
    subtype: "Utility-Scale Photovoltaic Power Plant",
    status: "nominal",
    statusLabel: "FALSE ALARM REJECTED (GLINT)",
    evidenceScore: 0.98,
    confidence: "Filtered (98% Glint Certainty)",
    
    matchedFacility: {
      name: "Bhadla Solar Park (2,245 MW Solar PV Array)",
      type: "Solar Power Generation",
      osmId: "way/99120481",
      distanceMeters: 80,
      tags: {
        "power": "plant",
        "plant:source": "solar",
        "landuse": "industrial",
        "operator": "NTPC / Adani Green"
      }
    },
    
    thermal: {
      currentFRP: 0.0,
      historicalMeanFRP: 0.0,
      frpDeviationRatio: 0.0,
      currentBrightnessTempK: 312.4,
      historicalMeanTempK: 311.0,
      sensor: "VIIRS NOAA-20 (Mid-Day Glint Pass)",
      detectionTime: "2026-08-28 06:15 UTC",
      firstSeen: "2024-01-01",
      lastSeen: "2026-08-28",
      totalDetections: 0,
      activeDays: 0,
      persistenceRate: "0.0% (Optical reflection filtered)",
      centroidStabilityScore: 0.99,
      footprintAreaHa: 0.0,
      historicalFootprintHa: 0.0,
      adjacentHotspotsDetected: 0
    },
    
    landCover: {
      bareSoilPaved: 72.4,
      industrialBuiltUp: 26.2,
      vegetationTree: 0.0,
      waterBody: 1.4,
      cropland: 0.0
    },
    
    nighttimeLight: {
      radianceValue: 4.8,
      backgroundRatio: "0.8x ambient",
      classification: "Unlit Desert Solar Array"
    },
    
    anomalyFormula: {
      frpDeviationScore: 0.0,
      footprintExpansionScore: 0.0,
      centroidDisplacementScore: 0.0,
      durationDeviationScore: 0.0,
      temporalPatternScore: 0.0,
      totalAnomalyScore: 0.0
    },
    
    evidencePoints: [
      { text: "Solar PV spectral albedo score (0.42) matches photovoltaic glass reflection profile", verified: true, type: "normal-behavior" },
      { text: "OSM confirms 2.2 GW Bhadla Solar Park polygon directly beneath coordinates", verified: true, type: "normal-behavior" },
      { text: "NASA FIRMS raw infrared sensor flags optical glint under solar angle 58.4°", verified: true, type: "normal-behavior" },
      { text: "HeatWatch AI spectral discriminator automatically rejects false positive without alerting emergency services", verified: true, type: "normal-behavior" }
    ],
    
    nasaComparison: {
      nasaLabel: "False Alarm Potential (Solar Glint)",
      heatwatchLabel: "Filtered False Alarm (Confirmed Solar PV Array)",
      agreementStatus: "False Alarm Prevented",
      explanation: "NASA FIRMS raw data occasionally triggers false alarms over utility-scale solar panels during high solar zenith angles. HeatWatch automatically identifies solar geometry and suppresses the false alert."
    },
    
    spectralData: {
      sentinel2Acquisition: "2026-08-28 05:50 UTC",
      swir2Radiance: 0.12,
      swir1Radiance: 0.18,
      ndvi: 0.02,
      nbr: 0.05,
      smokeAerosolIndex: 0.0,
      plumeDetected: false,
      plumeDirection: "None"
    },
    
    glintFilter: {
      passed: false,
      glintProbability: 0.98,
      albedoReflectance: 0.42,
      solarElevationDeg: 58.4,
      statusLabel: "REJECTED: Solar Panel Optical Reflection (False Alarm Filtered)"
    },

    spatialDynamics: {
      centroidStabilityPct: 99.9,
      isStationary: true,
      spreadVelocityKmH: 0.0,
      motionType: "Stationary Solar PV Array (Zero Combustion)",
      driftVectorMeters: 0,
      plumeDispersion: "None (Zero Smoke / Clean Solar)"
    },

    hazardProximity: {
      isEncroaching: false,
      facilityStatus: "Inside Bhadla Solar Park Perimeter (Normal Operation)",
      nearestInfrastructure: "Bhadla 765kV Power Evacuation Substation (120m)",
      threatLevel: "NOMINAL",
      bufferDistanceKm: 0.12,
      summary: "Normal solar generation; zero fire hazard detected."
    },

    recommendedAction: "No action required. False alarm successfully suppressed by AI optical albedo filter.",
    nearestSettlement: {
      name: "Bhadla Village",
      distanceKm: 4.2,
      populationEstimate: "1,800 residents"
    }
  },

  {
    id: "OBJ-7011",
    name: "Jharia Underground Coal Seam Fire Cluster #14",
    regionId: "jharia",
    centroid: [23.7420, 86.4150],
    coordinates: [23.7420, 86.4150],
    categoryGroup: "mining_fire",
    primaryCategory: "industrial",
    categoryLabel: "Subterranean Coal Seam Auto-Oxidation Fire",
    subtype: "Underground Coal Seam Fire",
    status: "high_priority",
    statusLabel: "CHRONIC SEVERE FIRE HAZARD",
    evidenceScore: 0.96,
    confidence: "Very High (96%)",
    
    matchedFacility: {
      name: "BCCL Kusunda / Lodna Open Cast Mine & Seam",
      type: "Coal Mining & Extraction",
      osmId: "way/10928374",
      distanceMeters: 90,
      tags: {
        "landuse": "quarry",
        "resource": "coal",
        "operator": "Bharat Coking Coal Limited (BCCL)"
      }
    },
    
    thermal: {
      currentFRP: 135.0,
      historicalMeanFRP: 84.0,
      frpDeviationRatio: 1.61,
      currentBrightnessTempK: 462.0,
      historicalMeanTempK: 410.5,
      sensor: "VIIRS NOAA-20 & NOAA-21",
      detectionTime: "2026-08-28 02:45 UTC",
      firstSeen: "2020-01-01",
      lastSeen: "2026-08-28",
      totalDetections: 620,
      activeDays: 480,
      persistenceRate: "98.8% (Chronic multi-decade fire)",
      centroidStabilityScore: 0.92,
      footprintAreaHa: 14.5,
      historicalFootprintHa: 12.0,
      adjacentHotspotsDetected: 4
    },
    
    landCover: {
      bareSoilPaved: 58.4,
      industrialBuiltUp: 34.2,
      vegetationTree: 4.1,
      waterBody: 3.3,
      cropland: 0.0
    },
    
    nighttimeLight: {
      radianceValue: 42.1,
      backgroundRatio: "6.8x ambient",
      classification: "Mining & Rail Head Lighting"
    },
    
    anomalyFormula: {
      frpDeviationScore: 0.40 * 0.75,
      footprintExpansionScore: 0.25 * 0.65,
      centroidDisplacementScore: 0.15 * 0.40,
      durationDeviationScore: 0.10 * 0.85,
      temporalPatternScore: 0.10 * 0.70,
      totalAnomalyScore: 0.678
    },
    
    evidencePoints: [
      { text: "Highest multi-year persistence in national catalog (>98% detection frequency)", verified: true, type: "pro-industrial" },
      { text: "Coincides with BCCL Open Cast Coal mining lease polygon", verified: true, type: "pro-industrial" },
      { text: "Thermal radiation surging +61% above baseline indicating subsurface oxygen ingress", verified: true, type: "anomaly-trigger" },
      { text: "Thermal gradient migrating within 380m of Dhanbad-Chandrapura railway alignment", verified: true, type: "anomaly-trigger" }
    ],
    
    nasaComparison: {
      nasaLabel: "Static Coal Mine Fire (Industrial Mask)",
      heatwatchLabel: "High-Priority Subsurface Fire Surge",
      agreementStatus: "Severe Risk Upgrade",
      explanation: "NASA FIRMS historical mask treats Jharia as routine mine heat. HeatWatch detects acute lateral seam propagation toward railway transport corridor."
    },
    
    spectralData: {
      sentinel2Acquisition: "2026-08-24 05:22 UTC",
      swir2Radiance: 0.88,
      swir1Radiance: 0.72,
      ndvi: 0.04,
      nbr: -0.38,
      smokeAerosolIndex: 2.1,
      plumeDetected: true,
      plumeDirection: "South-East"
    },
    
    glintFilter: {
      passed: true,
      glintProbability: 0.01,
      albedoReflectance: 0.14,
      solarElevationDeg: 49.8,
      statusLabel: "PASSED: Verified Coal Combustion Core (Not Glint)"
    },

    spatialDynamics: {
      centroidStabilityPct: 92.4,
      isStationary: true,
      spreadVelocityKmH: 0.02,
      motionType: "Slow Subsurface Seam Migration (0.02 km/h)",
      driftVectorMeters: 380,
      plumeDispersion: "South-East (Dense toxic SO2/CO plume)"
    },

    hazardProximity: {
      isEncroaching: true,
      facilityStatus: "Subsurface Fire Migrating toward Critical Transport Link",
      nearestInfrastructure: "Dhanbad-Chandrapura Railway Line (380m)",
      threatLevel: "CRITICAL_INFRASTRUCTURE_THREAT",
      bufferDistanceKm: 0.38,
      summary: "Underground coal fire front is within 380m of vital railway line & Kusunda settlement."
    },

    recommendedAction: "CRITICAL: Notify Directorate General of Mines Safety (DGMS) & BCCL Fire Management. Thermal trenching and nitrogen flushing recommended.",
    nearestSettlement: {
      name: "Kusunda Basti Settlement",
      distanceKm: 0.65,
      populationEstimate: "18,400 residents"
    }
  },

  {
    id: "OBJ-4012",
    name: "Patiala-Nabha Paddy Residue Agricultural Burn Strip",
    regionId: "patiala",
    centroid: [30.3456, 76.4120],
    coordinates: [30.3456, 76.4120],
    categoryGroup: "agriculture_fire",
    primaryCategory: "agriculture",
    categoryLabel: "Agricultural Residue / Crop Stubble Burning",
    subtype: "Paddy Stubble Burning",
    status: "elevated",
    statusLabel: "SEASONAL AGRICULTURAL FIRE",
    evidenceScore: 0.95,
    confidence: "Very High (95%)",
    
    matchedFacility: {
      name: "Agrarian Cropland Sector (No Fixed Industry)",
      type: "Agricultural Field / Farmland",
      osmId: "way/44928172",
      distanceMeters: 4800,
      tags: {
        "landuse": "farmland",
        "crop": "paddy_wheat_rotation"
      }
    },
    
    thermal: {
      currentFRP: 48.0,
      historicalMeanFRP: 4.2,
      frpDeviationRatio: 11.4,
      currentBrightnessTempK: 365.4,
      historicalMeanTempK: 302.1,
      sensor: "VIIRS Suomi-NPP (Daytime Pass)",
      detectionTime: "2026-08-28 07:22 UTC",
      firstSeen: "2026-08-26",
      lastSeen: "2026-08-28",
      totalDetections: 4,
      activeDays: 3,
      persistenceRate: "3.2% (Transient seasonal episodic)",
      centroidStabilityScore: 0.15,
      footprintAreaHa: 6.2,
      historicalFootprintHa: 0.0,
      adjacentHotspotsDetected: 8
    },
    
    landCover: {
      cropland: 91.4,
      vegetationTree: 4.2,
      bareSoilPaved: 2.8,
      waterBody: 1.6,
      industrialBuiltUp: 0.0
    },
    
    nighttimeLight: {
      radianceValue: 1.2,
      backgroundRatio: "0.4x ambient",
      classification: "Unlit Rural Farmland"
    },
    
    anomalyFormula: {
      frpDeviationScore: 0.40 * 0.98,
      footprintExpansionScore: 0.25 * 0.90,
      centroidDisplacementScore: 0.15 * 0.95,
      durationDeviationScore: 0.10 * 0.20,
      temporalPatternScore: 0.10 * 0.85,
      totalAnomalyScore: 0.812
    },
    
    evidencePoints: [
      { text: "91.4% Cropland land-cover verified by ESA WorldCover", verified: true, type: "pro-agri" },
      { text: "Zero industrial polygons within 4.8 km radius", verified: true, type: "pro-agri" },
      { text: "Extremely low persistence rate (3.2%) — classic episodic stubble burn pattern", verified: true, type: "pro-agri" },
      { text: "Coincides with post-harvest paddy residue clearing season", verified: true, type: "pro-agri" }
    ],
    
    nasaComparison: {
      nasaLabel: "Vegetation Fire Anomaly",
      heatwatchLabel: "Agricultural Crop Stubble Burning",
      agreementStatus: "Categorical Alignment",
      explanation: "Both systems agree this is open biomass burning. HeatWatch attributes it specifically to paddy stubble using crop calendar and high cropland fraction."
    },
    
    spectralData: {
      sentinel2Acquisition: "2026-08-27 05:52 UTC",
      swir2Radiance: 0.61,
      swir1Radiance: 0.48,
      ndvi: 0.22,
      nbr: -0.34,
      smokeAerosolIndex: 3.4,
      plumeDetected: true,
      plumeDirection: "South-East (heading toward Delhi NCR)"
    },
    
    glintFilter: {
      passed: true,
      glintProbability: 0.04,
      albedoReflectance: 0.18,
      solarElevationDeg: 58.2,
      statusLabel: "PASSED: Verified Biomass Flame (Episodic Agriculture)"
    },

    spatialDynamics: {
      centroidStabilityPct: 24.5,
      isStationary: false,
      spreadVelocityKmH: 1.6,
      motionType: "Moving Field Harvest Line (1.6 km/h)",
      driftVectorMeters: 540,
      plumeDispersion: "South-East (heading toward Delhi NCR)"
    },

    hazardProximity: {
      isEncroaching: false,
      facilityStatus: "Open Farmland (4.8 km from nearest processing facility)",
      nearestInfrastructure: "Patiala Grain Storage Silos (4.8 km)",
      threatLevel: "AIR_QUALITY_HAZARD",
      bufferDistanceKm: 4.8,
      summary: "Stubble burning poses major regional air quality hazard; no immediate structural asset risk."
    },

    recommendedAction: "Log into State Pollution Control Board (PPCB) crop-burning audit register for air quality index modeling.",
    nearestSettlement: {
      name: "Sanaur Village",
      distanceKm: 1.4,
      populationEstimate: "8,900 residents"
    }
  }
];

// Combine raw detections
export const RAW_FIRMS_DETECTIONS = [
  // Jamnagar Points (Calibrated to RIL Mega-Refinery Flare Corridor)
  { id: "RAW-101", lat: 22.3615, lon: 69.8640, frp: 68.4, tempK: 368.5, sat: "VIIRS SNPP", time: "2026-08-28 02:18", clusterId: "OBJ-1045", conf: "high" },
  { id: "RAW-102", lat: 22.3628, lon: 69.8655, frp: 42.1, tempK: 355.0, sat: "VIIRS NOAA-20", time: "2026-08-28 02:18", clusterId: "OBJ-1045", conf: "high" },
  { id: "RAW-103", lat: 22.3605, lon: 69.8625, frp: 31.5, tempK: 348.2, sat: "VIIRS SNPP", time: "2026-08-28 02:18", clusterId: "OBJ-1045", conf: "high" },
  { id: "RAW-104", lat: 22.3630, lon: 69.8670, frp: 18.4, tempK: 340.1, sat: "MODIS Terra", time: "2026-08-28 05:30", clusterId: "OBJ-1045", conf: "nominal" },
  
  // Hazira Normal Flare Points (Calibrated to Hazira Industrial Corridor)
  { id: "RAW-201", lat: 21.1165, lon: 72.6530, frp: 38.2, tempK: 395.0, sat: "VIIRS SNPP", time: "2026-08-28 01:54", clusterId: "OBJ-1082", conf: "high" },
  { id: "RAW-202", lat: 21.1170, lon: 72.6540, frp: 18.1, tempK: 370.0, sat: "VIIRS NOAA-20", time: "2026-08-28 01:54", clusterId: "OBJ-1082", conf: "nominal" },

  // Korba Super Thermal Power Points (Calibrated to NTPC Korba Power Island)
  { id: "RAW-301", lat: 22.3785, lon: 82.7245, frp: 112.5, tempK: 448.6, sat: "MODIS Terra", time: "2026-08-28 03:10", clusterId: "OBJ-2019", conf: "high" },
  { id: "RAW-302", lat: 22.3795, lon: 82.7260, frp: 45.0, tempK: 402.0, sat: "VIIRS NOAA-20", time: "2026-08-28 03:10", clusterId: "OBJ-2019", conf: "nominal" },
  
  // Jharia Coalfield Fire Points (Calibrated to Kusunda Open Cast Pit)
  { id: "RAW-701", lat: 23.7420, lon: 86.4150, frp: 135.0, tempK: 462.0, sat: "VIIRS NOAA-20", time: "2026-08-28 02:45", clusterId: "OBJ-7011", conf: "high" },
  { id: "RAW-702", lat: 23.7440, lon: 86.4180, frp: 62.0, tempK: 420.0, sat: "VIIRS NOAA-20", time: "2026-08-28 02:45", clusterId: "OBJ-7011", conf: "high" },

  // Simlipal Wildfire Points (Active Advancing Canopy Wildfire Front)
  { id: "RAW-501", lat: 21.8500, lon: 86.3500, frp: 86.4, tempK: 388.2, sat: "VIIRS NOAA-20", time: "2026-08-28 03:45", clusterId: "OBJ-3041", conf: "high" },
  { id: "RAW-502", lat: 21.8520, lon: 86.3530, frp: 52.0, tempK: 374.0, sat: "MODIS Terra", time: "2026-08-28 05:40", clusterId: "OBJ-3041", conf: "nominal" },

  // Patiala Agriculture Points (Calibrated to Nabha-Patiala Paddy Belt)
  { id: "RAW-601", lat: 30.3456, lon: 76.4120, frp: 48.0, tempK: 365.4, sat: "VIIRS Suomi-NPP", time: "2026-08-28 07:22", clusterId: "OBJ-4012", conf: "nominal" },
  { id: "RAW-602", lat: 30.3480, lon: 76.4150, frp: 35.2, tempK: 352.0, sat: "VIIRS Suomi-NPP", time: "2026-08-28 07:22", clusterId: "OBJ-4012", conf: "nominal" },

  // Bhadla Solar Glint (Optical Reflection Rejection)
  { id: "RAW-801", lat: 27.5380, lon: 71.9160, frp: 0.0, tempK: 312.4, sat: "VIIRS NOAA-20", time: "2026-08-28 06:15", clusterId: "OBJ-8021", conf: "nominal" }
];

export const OSM_FACILITIES = ALL_INDIA_FACILITIES.map((fac, idx) => ({
  id: fac.id,
  name: fac.name,
  type: fac.type,
  coordinates: fac.coordinates,
  polygon: [
    [fac.coordinates[0] + 0.007, fac.coordinates[1] - 0.008],
    [fac.coordinates[0] + 0.008, fac.coordinates[1] + 0.010],
    [fac.coordinates[0] - 0.007, fac.coordinates[1] + 0.011],
    [fac.coordinates[0] - 0.008, fac.coordinates[1] - 0.007]
  ],
  attributes: {
    state: fac.state,
    city: fac.city,
    capacity: fac.capacity,
    operator: fac.operator,
    units: fac.units
  }
}));

export const HISTORICAL_FRP_DATA = {
  "OBJ-1045": [
    { day: "Day -90", frp: 17.8, baseline: 18.2, threshold: 36.4 },
    { day: "Day -60", frp: 18.5, baseline: 18.2, threshold: 36.4 },
    { day: "Day -30", frp: 17.9, baseline: 18.2, threshold: 36.4 },
    { day: "Day -7",  frp: 19.4, baseline: 18.2, threshold: 36.4 },
    { day: "Day -1",  frp: 38.2, baseline: 18.2, threshold: 36.4 },
    { day: "TODAY",   frp: 68.4, baseline: 18.2, threshold: 36.4 } // 3.76x surge
  ],
  "OBJ-7011": [
    { day: "Day -90", frp: 22.0, baseline: 24.5, threshold: 49.0 },
    { day: "Day -60", frp: 25.1, baseline: 24.5, threshold: 49.0 },
    { day: "Day -30", frp: 23.8, baseline: 24.5, threshold: 49.0 },
    { day: "Day -7",  frp: 34.0, baseline: 24.5, threshold: 49.0 },
    { day: "Day -1",  frp: 48.0, baseline: 24.5, threshold: 49.0 },
    { day: "TODAY",   frp: 62.5, baseline: 24.5, threshold: 49.0 }
  ],
  "OBJ-1082": [
    { day: "Day -90", frp: 14.2, baseline: 15.0, threshold: 30.0 },
    { day: "Day -30", frp: 15.1, baseline: 15.0, threshold: 30.0 },
    { day: "TODAY",   frp: 16.2, baseline: 15.0, threshold: 30.0 }
  ],
  "OBJ-2019": [
    { day: "Day -90", frp: 24.0, baseline: 26.4, threshold: 52.8 },
    { day: "Day -30", frp: 27.1, baseline: 26.4, threshold: 52.8 },
    { day: "TODAY",   frp: 48.5, baseline: 26.4, threshold: 52.8 }
  ],
  "OBJ-3041": [
    { day: "Day -30", frp: 0.0, baseline: 8.0, threshold: 16.0 },
    { day: "Day -1",  frp: 45.0, baseline: 8.0, threshold: 16.0 },
    { day: "TODAY",   frp: 148.5, baseline: 8.0, threshold: 16.0 } // Wildfire
  ],
  "OBJ-4012": [
    { day: "Day -30", frp: 0.0, baseline: 12.0, threshold: 24.0 },
    { day: "TODAY",   frp: 24.0, baseline: 12.0, threshold: 24.0 }
  ]
};

export const DEMO_STORY_STEPS = [
  {
    step: 1,
    title: "1. Ingest Raw NASA FIRMS Detections",
    description: "Satellite detects high-temperature infrared pixels over the Jamnagar industrial belt. Raw FIRMS only tells you WHERE heat is detected, leaving its nature ambiguous.",
    actionHighlight: "Show raw FIRMS points on the map without any facility or land-use context.",
    targetObjectId: "OBJ-1045",
    mapLayers: { rawFirms: true, thermalClusters: false, osmFacilities: false, worldCoverBuffers: false, nasaStaticMask: false, riskBuffers: false },
    zoomCoordinates: [22.4682, 70.0514],
    zoomLevel: 13
  },
  {
    step: 2,
    title: "2. Activate Multimodal Geospatial Context Layers",
    description: "Overlay OpenStreetMap industrial plant polygons and ESA WorldCover 10m land classifications to anchor the thermal anomalies in real-world infrastructure.",
    actionHighlight: "Turn on OSM facilities layer (refinery polygons) and ESA WorldCover raster buffers.",
    targetObjectId: "OBJ-1045",
    mapLayers: { rawFirms: true, thermalClusters: false, osmFacilities: true, worldCoverBuffers: true, nasaStaticMask: false, riskBuffers: true },
    zoomCoordinates: [22.4682, 70.0514],
    zoomLevel: 14
  },
  {
    step: 3,
    title: "3. Cluster Points into Persistent Thermal Object #1045",
    description: "ST-DBSCAN spatiotemporal clustering aggregates multiple individual satellite detections across 90 days into a single persistent facility-level entity.",
    actionHighlight: "Observe creation of Thermal Object #OBJ-1045 with 92.4% historical persistence.",
    targetObjectId: "OBJ-1045",
    mapLayers: { rawFirms: true, thermalClusters: true, osmFacilities: true, worldCoverBuffers: true, nasaStaticMask: false, riskBuffers: true },
    zoomCoordinates: [22.4682, 70.0514],
    zoomLevel: 14
  },
  {
    step: 4,
    title: "4. Brain 1: Explainable Source Attribution",
    description: "The Evidence Engine evaluates 5 dimensions: Facility Match (30%), Persistence (25%), Built-up Context (15%), Land Cover (15%), and Consistency (15%), giving 91% Confidence for Petrochemical Refinery.",
    actionHighlight: "Open Evidence Score breakdown showing why it is classified as Persistent Industrial Source.",
    targetObjectId: "OBJ-1045",
    mapLayers: { rawFirms: false, thermalClusters: true, osmFacilities: true, worldCoverBuffers: true, nasaStaticMask: false, riskBuffers: true },
    zoomCoordinates: [22.4682, 70.0514],
    zoomLevel: 14
  },
  {
    step: 5,
    title: "5. Brain 2: Establish 90-Day Historical Baseline",
    description: "A petrochemical flare isn't dangerous just because it emits heat every day. HeatWatch calculates a normal historical baseline (Mean FRP = 18.2 MW, designated flare stack footprint).",
    actionHighlight: "View 90-day time-series telemetry chart comparing historical mean against current surge.",
    targetObjectId: "OBJ-1045",
    mapLayers: { rawFirms: false, thermalClusters: true, osmFacilities: true, worldCoverBuffers: false, nasaStaticMask: false, riskBuffers: true },
    zoomCoordinates: [22.4682, 70.0514],
    zoomLevel: 14
  },
  {
    step: 6,
    title: "6. Acute Anomaly Detection: 3.8× Surge + Footprint Expansion",
    description: "Today's satellite pass records 68.4 MW (3.76× baseline) with +281% spatial footprint expansion spreading into chemical storage tanks. Status flips from NORMAL to HIGH-PRIORITY ANOMALY.",
    actionHighlight: "Thermal status badge escalates to HIGH-PRIORITY ANOMALY (Anomaly Score 0.883).",
    targetObjectId: "OBJ-1045",
    mapLayers: { rawFirms: true, thermalClusters: true, osmFacilities: true, worldCoverBuffers: true, nasaStaticMask: false, riskBuffers: true },
    zoomCoordinates: [22.4682, 70.0514],
    zoomLevel: 15
  },
  {
    step: 7,
    title: "7. NASA Static Mask Side-by-Side Comparison",
    description: "NASA FIRMS's 2025 static anomaly layer still flags this as a routine 'Static Industrial Source'. HeatWatch differentiates by exposing the abnormal flare escalation.",
    actionHighlight: "Compare NASA label (Routine Static Mask) vs HeatWatch label (Critical Incident Outbreak).",
    targetObjectId: "OBJ-1045",
    mapLayers: { rawFirms: true, thermalClusters: true, osmFacilities: true, worldCoverBuffers: false, nasaStaticMask: true, riskBuffers: true },
    zoomCoordinates: [22.4682, 70.0514],
    zoomLevel: 14
  },
  {
    step: 8,
    title: "8. Actionable Human Verification & Emergency Dispatch",
    description: "Rather than claiming automatic certainty, HeatWatch generates a prioritized action dossier with Sentinel-2 spectral verification for District Disaster Management Authorities.",
    actionHighlight: "Inspect Field Verification Action Plan, nearest community exposure (Moti Khavdi, 1.8km), and export GeoJSON report.",
    targetObjectId: "OBJ-1045",
    mapLayers: { rawFirms: true, thermalClusters: true, osmFacilities: true, worldCoverBuffers: true, nasaStaticMask: true, riskBuffers: true },
    zoomCoordinates: [22.4682, 70.0514],
    zoomLevel: 14
  }
];
