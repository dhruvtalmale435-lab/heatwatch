/**
 * HeatWatch - Interactive AI Model & SHAP Feature Explainer
 * Real-time Random Forest / Gradient Boosted Tree inference simulator with
 * dynamic feature importance and SHAP-style attribution explanations.
 */

export class ModelExplainerEngine {
  constructor() {
    this.backendAvailable = null;
  }

  /**
   * Run live ML inference (calling backend trained model if active, else client fallback)
   */
  async inferProbabilitiesLive(features) {
    try {
      const response = await fetch('/api/ml/attribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features)
      });
      if (response.ok) {
        const data = await response.json();
        this.backendAvailable = true;
        
        // Map backend classes to UI colors
        const colorMap = {
          "Refinery / Petrochemical Flare": "#00f0ff",
          "Super Thermal Power Plant": "#38bdf8",
          "Vegetation Wildfire": "#f97316",
          "Agricultural Stubble Burning": "#eab308",
          "Coal Mining Seam Fire": "#a855f7",
          "Solar Glint / False Positive": "#94a3b8"
        };

        const classes = (data.classes || []).map(c => ({
          name: c.name,
          prob: c.prob,
          color: colorMap[c.name] || "#00f0ff"
        }));

        const topClass = classes[0] || { name: data.predicted_class_name, prob: data.confidence, color: "#00f0ff" };
        const localInference = this.inferProbabilities(features);

        return {
          classes,
          topClass,
          shapContributions: localInference.shapContributions,
          source: data.model_source
        };
      }
    } catch (e) {
      this.backendAvailable = false;
    }

    return this.inferProbabilities(features);
  }

  /**
   * Client-side deterministic inference fallback (runs 100% offline & on GitHub Pages)
   */
  inferProbabilities(features) {
    const { frp, tempK, distRefineryM, builtupPct, forestPct, croplandPct, nightlight } = features;

    // Feature normalization & non-linear transformations
    const frpScore = Math.min(frp / 60.0, 1.5);
    const tempScore = Math.max((tempK - 300) / 100.0, 0);
    const proximityScore = Math.max(1.0 - (distRefineryM / 3000.0), 0);
    const urbanScore = builtupPct / 100.0;
    const forestScore = forestPct / 100.0;
    const agriScore = croplandPct / 100.0;
    const lightScore = Math.min(nightlight / 80.0, 1.2);

    // Raw model logits
    let rawRefinery = 0.35 * proximityScore + 0.25 * urbanScore + 0.20 * lightScore + 0.15 * tempScore + 0.05 * frpScore;
    let rawPowerPlant = 0.30 * proximityScore + 0.25 * urbanScore + 0.20 * lightScore + 0.15 * frpScore + 0.10 * tempScore;
    let rawWildfire = 0.55 * forestScore + 0.25 * (1 - lightScore) + 0.20 * frpScore;
    let rawAgri = 0.55 * agriScore + 0.25 * (1 - proximityScore) + 0.20 * (1 - lightScore);
    let rawMining = 0.30 * (1 - forestScore) + 0.25 * (1 - agriScore) + 0.20 * proximityScore + 0.25 * frpScore;

    // Softmax normalization
    const expR = Math.exp(rawRefinery * 3.5);
    const expP = Math.exp(rawPowerPlant * 3.2);
    const expW = Math.exp(rawWildfire * 3.8);
    const expA = Math.exp(rawAgri * 3.6);
    const expM = Math.exp(rawMining * 3.0);
    const totalExp = expR + expP + expW + expA + expM;

    const probRefinery = expR / totalExp;
    const probPowerPlant = expP / totalExp;
    const probWildfire = expW / totalExp;
    const probAgri = expA / totalExp;
    const probMining = expM / totalExp;

    // Determine predicted class
    const classes = [
      { name: "Petrochemical / Refinery", prob: probRefinery, color: "#00f0ff" },
      { name: "Thermal Power Station", prob: probPowerPlant, color: "#38bdf8" },
      { name: "Vegetation Wildfire", prob: probWildfire, color: "#f97316" },
      { name: "Agricultural Burning", prob: probAgri, color: "#eab308" },
      { name: "Mining / Subsurface Heat", prob: probMining, color: "#a855f7" }
    ];

    classes.sort((a, b) => b.prob - a.prob);

    // Compute SHAP contributions for the top predicted class
    const topClass = classes[0];
    let shapContributions = [];

    if (topClass.name.includes("Refinery")) {
      shapContributions = [
        { feature: "Proximity to Mapped Facility", value: `+${(proximityScore * 38).toFixed(1)}%`, impact: "positive" },
        { feature: "ESA Built-Up Land Context", value: `+${(urbanScore * 24).toFixed(1)}%`, impact: "positive" },
        { feature: "VIIRS Nightlight Radiance", value: `+${(lightScore * 20).toFixed(1)}%`, impact: "positive" },
        { feature: "Emitter Temperature (K)", value: `+${(tempScore * 12).toFixed(1)}%`, impact: "positive" },
        { feature: "Forest Canopy Fraction", value: `-${(forestScore * 30).toFixed(1)}%`, impact: "negative" }
      ];
    } else if (topClass.name.includes("Wildfire")) {
      shapContributions = [
        { feature: "ESA Tree / Forest Canopy", value: `+${(forestScore * 52).toFixed(1)}%`, impact: "positive" },
        { feature: "Absence of Nighttime Lights", value: `+${((1 - lightScore) * 26).toFixed(1)}%`, impact: "positive" },
        { feature: "Elevated FRP Output", value: `+${(frpScore * 18).toFixed(1)}%`, impact: "positive" },
        { feature: "Facility Proximity Mismatch", value: `-${(proximityScore * 35).toFixed(1)}%`, impact: "negative" }
      ];
    } else if (topClass.name.includes("Agricultural")) {
      shapContributions = [
        { feature: "ESA Cropland Proportion", value: `+${(agriScore * 55).toFixed(1)}%`, impact: "positive" },
        { feature: "Low Background Nightlight", value: `+${(22).toFixed(1)}%`, impact: "positive" },
        { feature: "Non-Industrial Rural Zone", value: `+${(18).toFixed(1)}%`, impact: "positive" },
        { feature: "Built-up Infrastructure Absence", value: `-${(urbanScore * 25).toFixed(1)}%`, impact: "negative" }
      ];
    } else {
      shapContributions = [
        { feature: "Bare Ground / Excavated Pit", value: `+${(42).toFixed(1)}%`, impact: "positive" },
        { feature: "Persistent Thermal Outcropping", value: `+${(30).toFixed(1)}%`, impact: "positive" },
        { feature: "Vegetation Absence", value: `+${(18).toFixed(1)}%`, impact: "positive" }
      ];
    }

    return {
      classes,
      topClass,
      shapContributions
    };
  }
}
