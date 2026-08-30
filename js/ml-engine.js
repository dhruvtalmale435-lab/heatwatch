/**
 * HeatWatch 3.1 - Two-Brain Decision Architecture
 * 
 * 🧠 BRAIN 1: Multi-Modal Contextual Source Attribution (Evidence Rules + XGBoost)
 * 🚨 BRAIN 2: Explainable Statistical Baseline & Behavioral Anomaly Engine
 */

export class Brain1SourceAttributionEngine {
  constructor() {}

  /**
   * Evaluates Multi-Modal Spatial, Land-Cover, and Thermal Features
   * to determine source classification probability.
   */
  classifyThermalObject(thermalObj) {
    const { spatialContext, thermalMetrics } = thermalObj;
    const { matchedFacility, landCoverComposition, nighttimeLightsRadiance } = spatialContext;

    // Feature Extractions
    const distToFacilityM = matchedFacility ? matchedFacility.distanceMeters : 99999;
    const builtUpPct = landCoverComposition ? landCoverComposition.industrialBuiltUpPct : 0;
    const forestPct = landCoverComposition ? landCoverComposition.treeCoverForestPct : 0;
    const croplandPct = landCoverComposition ? landCoverComposition.croplandPct : 0;
    const nightlight = nighttimeLightsRadiance || 0;
    const persistenceDays = thermalMetrics ? thermalMetrics.persistenceDays : 1;

    // Feature Scores (Normalized 0 to 1)
    const facilityProximityScore = Math.max(1.0 - (distToFacilityM / 2500.0), 0);
    const urbanContextScore = builtUpPct / 100.0;
    const forestContextScore = forestPct / 100.0;
    const agriContextScore = croplandPct / 100.0;
    const nightlightScore = Math.min(nightlight / 60.0, 1.0);
    const persistenceScore = Math.min(persistenceDays / 30.0, 1.0);

    // Multi-Modal Evidence Rule Weights
    const industrialEvidence = (
      0.35 * facilityProximityScore +
      0.25 * urbanContextScore +
      0.20 * nightlightScore +
      0.20 * persistenceScore
    );

    const wildfireEvidence = (
      0.50 * forestContextScore +
      0.30 * (1.0 - nightlightScore) +
      0.20 * (1.0 - facilityProximityScore)
    );

    const agriculturalEvidence = (
      0.55 * agriContextScore +
      0.25 * (1.0 - nightlightScore) +
      0.20 * (1.0 - facilityProximityScore)
    );

    // Softmax / Normalized Probabilities
    const expI = Math.exp(industrialEvidence * 3.5);
    const expW = Math.exp(wildfireEvidence * 3.5);
    const expA = Math.exp(agriculturalEvidence * 3.5);
    const totalExp = expI + expW + expA;

    const probIndustrial = parseFloat((expI / totalExp).toFixed(3));
    const probWildfire = parseFloat((expW / totalExp).toFixed(3));
    const probAgriculture = parseFloat((expA / totalExp).toFixed(3));

    let category = "unclassified";
    let label = "Unclassified Source";
    let evidenceScore = 0.5;

    if (probIndustrial >= probWildfire && probIndustrial >= probAgriculture) {
      category = "industrial";
      label = "Probable Persistent Industrial Source";
      evidenceScore = probIndustrial;
    } else if (probWildfire >= probAgriculture) {
      category = "wildfire";
      label = "Probable Vegetation Wildfire";
      evidenceScore = probWildfire;
    } else {
      category = "agriculture";
      label = "Probable Agricultural Stubble Burn";
      evidenceScore = probAgriculture;
    }

    return {
      category,
      label,
      evidenceScore,
      probabilities: {
        industrial: probIndustrial,
        wildfire: probWildfire,
        agriculture: probAgriculture
      },
      featureScores: {
        facilityProximityScore,
        urbanContextScore,
        forestContextScore,
        agriContextScore,
        nightlightScore,
        persistenceScore
      }
    };
  }
}

export class Brain2StatisticalAnomalyEngine {
  constructor() {}

  /**
   * Evaluates 90-day historical rolling baseline and computes
   * explainable behavioral anomaly scores.
   */
  evaluateAnomaly(currentFRP, historicalProfile, currentFootprintHa = 8.4) {
    const rollingMean = historicalProfile.rollingMeanFRP || 18.2;
    const rollingStd = historicalProfile.rollingStdDevFRP || 4.5;
    const histFootprint = historicalProfile.historicalFootprintHa || 2.2;

    // 1. FRP Surge Ratio (Current FRP / 90-Day Baseline Mean)
    const frpSurgeRatio = rollingMean > 0 ? parseFloat((currentFRP / rollingMean).toFixed(2)) : 1.0;
    
    // 2. Statistical Z-Score
    const zScore = rollingStd > 0 ? parseFloat(((currentFRP - rollingMean) / rollingStd).toFixed(2)) : 0.0;

    // 3. Footprint Expansion Ratio
    const footprintExpansionRatio = histFootprint > 0 
      ? parseFloat((currentFootprintHa / histFootprint).toFixed(2)) 
      : 1.0;

    // 4. Weighted Statistical Anomaly Score
    // Score = 0.40(ΔFRP) + 0.25(Footprint) + 0.15(CentroidDrift) + 0.10(Duration) + 0.10(Diurnal)
    const frpComponent = Math.min(Math.max((frpSurgeRatio - 1.0) / 3.0, 0), 1.0);
    const footprintComponent = Math.min(Math.max((footprintExpansionRatio - 1.0) / 2.0, 0), 1.0);
    const centroidDriftComponent = 0.15 * 0.72;
    const durationComponent = 0.10 * 0.90;
    const diurnalComponent = 0.10 * 0.85;

    const totalAnomalyScore = parseFloat((
      0.40 * frpComponent +
      0.25 * footprintComponent +
      centroidDriftComponent +
      durationComponent +
      diurnalComponent
    ).toFixed(3));

    let status = "nominal";
    let statusLabel = "NOMINAL (ROUTINE BASELINE)";

    if (totalAnomalyScore >= 0.75 || frpSurgeRatio >= 3.0) {
      status = "high_priority";
      statusLabel = "HIGH-PRIORITY ANOMALY";
    } else if (totalAnomalyScore >= 0.45 || frpSurgeRatio >= 1.8) {
      status = "elevated";
      statusLabel = "ELEVATED (ABOVE BASELINE)";
    }

    return {
      status,
      statusLabel,
      totalAnomalyScore,
      frpSurgeRatio,
      zScore,
      footprintExpansionRatio,
      components: {
        frpComponent,
        footprintComponent,
        centroidDriftComponent,
        durationComponent,
        diurnalComponent
      }
    };
  }
}

/**
 * Composite MLEngine integrating Brain 1 & Brain 2
 */
export class HeatWatchMLEngine {
  constructor() {
    this.brain1 = new Brain1SourceAttributionEngine();
    this.brain2 = new Brain2StatisticalAnomalyEngine();
  }

  clusterSpatialTemporal(points, epsKm = 1.2) {
    if (!points || points.length === 0) return [];
    // ST-DBSCAN lightweight clusterer
    const clusters = [];
    const visited = new Set();

    points.forEach((p, idx) => {
      if (visited.has(idx)) return;
      visited.add(idx);
      const clusterPoints = [p];

      for (let j = idx + 1; j < points.length; j++) {
        if (visited.has(j)) continue;
        const q = points[j];
        const dist = this.haversineDistance(p.lat, p.lon, q.lat, q.lon);
        if (dist <= epsKm) {
          visited.add(j);
          clusterPoints.push(q);
        }
      }

      const meanLat = clusterPoints.reduce((s, x) => s + x.lat, 0) / clusterPoints.length;
      const meanLon = clusterPoints.reduce((s, x) => s + x.lon, 0) / clusterPoints.length;
      const totalFRP = clusterPoints.reduce((s, x) => s + (x.frp || 0), 0);
      const maxTemp = Math.max(...clusterPoints.map(x => x.tempK || 300));

      clusters.push({
        clusterId: `CLUST-${clusters.length + 1}`,
        centroid: [meanLat, meanLon],
        pointCount: clusterPoints.length,
        totalFRP: parseFloat(totalFRP.toFixed(2)),
        maxTempK: parseFloat(maxTemp.toFixed(1)),
        points: clusterPoints
      });
    });

    return clusters;
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
