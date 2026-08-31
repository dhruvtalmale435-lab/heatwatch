/**
 * HeatWatch - Analytics & Data Visualization Engine
 * Integrates Chart.js for FRP time-series baselines, land-cover distributions,
 * anomaly radar breakdowns, regional telemetry, Planck spectral curves, and SHAP bars.
 */

import { HISTORICAL_FRP_DATA, THERMAL_OBJECTS, getHistoricalFrpForObject } from './data.js';
import { SatellitePyrometryEngine } from './pyrometry.js';

export class HeatWatchAnalytics {
  constructor() {
    this.pyrometry = new SatellitePyrometryEngine();
    this.charts = {};
  }

  // Update FRP Baseline Time-Series Chart (with 90-day day scrubber highlight)
  renderFrpTimeSeriesChart(canvasId, objOrId, highlightedDayIndex = 90) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const dataPoints = getHistoricalFrpForObject(objOrId);
    if (!dataPoints || !dataPoints.length) return;

    const labels = dataPoints.map(d => d.day);
    const frpValues = dataPoints.map(d => d.frp);
    const baselineValues = dataPoints.map(d => d.baseline);
    const thresholdValues = dataPoints.map(d => d.threshold);

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Observed FRP (MW)',
            data: frpValues,
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            fill: true,
            tension: 0.25,
            borderWidth: 2.5,
            pointBackgroundColor: (context) => {
              const index = context.dataIndex;
              if (index === highlightedDayIndex - 1) return '#ffffff';
              const val = context.dataset.data[index];
              return val > (baselineValues[index] * 1.7) ? '#ff4747' : '#00f0ff';
            },
            pointBorderColor: (context) => {
              const index = context.dataIndex;
              return index === highlightedDayIndex - 1 ? '#00f0ff' : 'transparent';
            },
            pointBorderWidth: (context) => {
              const index = context.dataIndex;
              return index === highlightedDayIndex - 1 ? 3 : 1;
            },
            pointRadius: (context) => {
              const index = context.dataIndex;
              if (index === highlightedDayIndex - 1) return 8;
              return index % 5 === 0 ? 3 : 0;
            },
            pointHoverRadius: 8
          },
          {
            label: '90-Day Baseline Mean',
            data: baselineValues,
            borderColor: 'rgba(255, 255, 255, 0.45)',
            borderDash: [5, 5],
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0
          },
          {
            label: '2× Baseline Anomaly Threshold',
            data: thresholdValues,
            borderColor: 'rgba(255, 71, 71, 0.65)',
            borderDash: [3, 3],
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#9ca3af',
              font: { family: 'Inter', size: 11 },
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: '#0e1524',
            titleColor: '#00f0ff',
            bodyColor: '#fff',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            borderWidth: 1,
            callbacks: {
              afterLabel: function(context) {
                const dayObj = dataPoints[context.dataIndex];
                if (dayObj) {
                  return `Date: ${dayObj.date} | Status: ${dayObj.status.toUpperCase()}`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#6b7280',
              font: { family: 'JetBrains Mono', size: 9 },
              maxTicksLimit: 12
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#6b7280', font: { family: 'JetBrains Mono', size: 10 } },
            title: { display: true, text: 'Fire Radiative Power (MW)', color: '#9ca3af' }
          }
        }
      }
    });
  }

  // Update ESA WorldCover Land-Cover Composition Chart
  renderLandCoverDoughnut(canvasId, landCoverData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = [];
    const values = [];
    const colors = [];

    if (landCoverData.industrialBuiltUp) {
      labels.push('Industrial / Built-up');
      values.push(landCoverData.industrialBuiltUp);
      colors.push('#00f0ff');
    }
    if (landCoverData.bareSoilPaved) {
      labels.push('Bare / Excavated Ground');
      values.push(landCoverData.bareSoilPaved);
      colors.push('#a855f7');
    }
    if (landCoverData.vegetationTree) {
      labels.push('Tree / Forest Cover');
      values.push(landCoverData.vegetationTree);
      colors.push('#10b981');
    }
    if (landCoverData.cropland) {
      labels.push('Cropland / Agriculture');
      values.push(landCoverData.cropland);
      colors.push('#eab308');
    }
    if (landCoverData.waterBody) {
      labels.push('Water Body');
      values.push(landCoverData.waterBody);
      colors.push('#3b82f6');
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#0e1524',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#9ca3af',
              font: { family: 'Inter', size: 10 },
              boxWidth: 10
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  // Anomaly Score Breakdown Radar Chart
  renderAnomalyRadar(canvasId, anomalyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['FRP Deviation', 'Spatial Footprint', 'Centroid Drift', 'Duration Spike', 'Temporal Pattern'],
        datasets: [{
          label: 'Anomaly Weight Metric',
          data: [
            (anomalyData.frpDeviationScore || 0.3) * 2.5,
            (anomalyData.footprintExpansionScore || 0.2) * 4.0,
            (anomalyData.centroidDisplacementScore || 0.1) * 6.6,
            (anomalyData.durationDeviationScore || 0.1) * 10.0,
            (anomalyData.temporalPatternScore || 0.1) * 10.0
          ],
          borderColor: '#ff4747',
          backgroundColor: 'rgba(255, 71, 71, 0.2)',
          pointBackgroundColor: '#ff4747',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#ff4747'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: {
              color: '#9ca3af',
              font: { family: 'Inter', size: 10 }
            },
            ticks: {
              display: false,
              max: 1.0,
              min: 0
            }
          }
        }
      }
    });
  }

  // Planck Spectral Radiance Curve Chart (VIIRS Nightfire Pyrometry)
  renderPlanckCurveChart(canvasId, tempK = 1620) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const { wavelengths, radiances } = this.pyrometry.generatePlanckCurve(tempK);

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: wavelengths.map(l => `${l} µm`),
        datasets: [
          {
            label: `Planck Radiance @ ${tempK} K`,
            data: radiances,
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.15)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 3,
            pointBackgroundColor: '#ff4747'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#00f0ff', font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => `Radiance: ${context.parsed.y} W/(m²·sr·µm)`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Wavelength (µm) — SWIR to MWIR', color: '#9ca3af' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#6b7280', font: { family: 'JetBrains Mono', size: 9 } }
          },
          y: {
            title: { display: true, text: 'Spectral Radiance B(λ,T)', color: '#9ca3af' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#6b7280', font: { family: 'JetBrains Mono', size: 9 } }
          }
        }
      }
    });
  }

  // Render Regional Thermal Overview
  renderRegionalOverview(canvasId, selectedId = 'OBJ-1045', activeObj = null) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const defaultPeers = [
      { id: 'FAC-REF-01', name: 'Jamnagar Petrochem', frp: 68.4, baseline: 18.2 },
      { id: 'FAC-REF-03', name: 'Panipat Refinery', frp: 45.0, baseline: 45.0 },
      { id: 'FAC-REF-08', name: 'Paradip Refinery', frp: 40.0, baseline: 40.0 },
      { id: 'FAC-PWR-01', name: 'Vindhyachal Power', frp: 65.0, baseline: 65.0 },
      { id: 'FAC-PWR-02', name: 'Korba Thermal', frp: 58.4, baseline: 58.4 },
      { id: 'FAC-STL-01', name: 'Tata Steel', frp: 48.0, baseline: 48.0 },
      { id: 'FAC-MINE-01', name: 'Jharia Coal', frp: 55.0, baseline: 55.0 },
      { id: 'FAC-CHEM-03', name: 'Hazira Hub', frp: 35.8, baseline: 35.8 }
    ];

    let comparativeFacilities = [...defaultPeers];

    if (activeObj) {
      const activeCleanId = String(activeObj.id || activeObj.regionId || '').replace(/^(FAC-|OBJ-)/, '');
      const activeName = activeObj.name ? activeObj.name.split('(')[0].trim().slice(0, 18) : 'Selected Facility';
      const activeFrp = activeObj.thermal?.currentFRP !== undefined ? Number(activeObj.thermal.currentFRP) : 35.0;
      const activeBase = activeObj.thermal?.historicalMeanFRP !== undefined ? Number(activeObj.thermal.historicalMeanFRP) : 30.0;

      const existingIdx = comparativeFacilities.findIndex(f => f.id.includes(activeCleanId) || activeObj.id.includes(f.id.replace('FAC-', '')));
      if (existingIdx >= 0) {
        comparativeFacilities[existingIdx].frp = activeFrp;
        comparativeFacilities[existingIdx].baseline = activeBase;
        comparativeFacilities[existingIdx].name = activeName;
      } else {
        // Insert active facility at the beginning
        comparativeFacilities.unshift({
          id: activeObj.id.startsWith('FAC-') ? activeObj.id : `FAC-${activeCleanId}`,
          name: activeName,
          frp: activeFrp,
          baseline: activeBase
        });
        if (comparativeFacilities.length > 8) {
          comparativeFacilities.pop();
        }
      }
    }

    const labels = comparativeFacilities.map(f => f.name);
    const currentFRP = comparativeFacilities.map(f => f.frp);
    const baselineFRP = comparativeFacilities.map(f => f.baseline);

    const cleanSelected = String(selectedId || '').replace(/^(FAC-|OBJ-)/, '');
    const bgColors = comparativeFacilities.map(f => {
      const isMatch = f.id.includes(cleanSelected) || cleanSelected.includes(f.id.replace('FAC-', '')) || (activeObj && f.name.includes(activeObj.name.split(' ')[0]));
      return isMatch ? '#00f0ff' : 'rgba(56, 189, 248, 0.45)';
    });

    const borderColors = comparativeFacilities.map(f => {
      const isMatch = f.id.includes(cleanSelected) || cleanSelected.includes(f.id.replace('FAC-', '')) || (activeObj && f.name.includes(activeObj.name.split(' ')[0]));
      return isMatch ? '#ffffff' : 'transparent';
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Observed FRP (MW)',
            data: currentFRP,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 2,
            borderRadius: 4
          },
          {
            label: '90-Day Baseline Mean (MW)',
            data: baselineFRP,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#9ca3af', font: { family: 'Inter', size: 11 } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 9 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y: {
            ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: 'MW', color: '#6b7280' }
          }
        }
      }
    });
  }

  updateAllAnalytics(obj) {
    if (!obj) return;
    const objId = obj.id || 'OBJ-1045';

    // 1. Time-Series Baseline Charts (Analytics Tab + Sidebar)
    this.renderFrpTimeSeriesChart('canvas-analytics-timeseries', obj, 90);
    this.renderFrpTimeSeriesChart('sidebar-frp-chart', obj, 90);

    // 2. Land Cover Composition Doughnut (Sidebar)
    if (obj.landCover) {
      this.renderLandCoverDoughnut('sidebar-landcover-chart', obj.landCover);
    }

    // 3. Anomaly Radar Chart (Sidebar)
    if (obj.anomalyFormula) {
      this.renderAnomalyRadar('sidebar-radar-chart', obj.anomalyFormula);
    } else {
      const frpRatio = obj.thermal?.frpDeviationRatio || 1.0;
      this.renderAnomalyRadar('sidebar-radar-chart', {
        frpDeviationScore: Math.min(1.0, (frpRatio / 3.0) * 0.4),
        footprintExpansionScore: 0.15,
        centroidDisplacementScore: 0.05,
        durationDeviationScore: 0.20,
        temporalPatternScore: 0.15
      });
    }

    // 4. Regional Overview Bar (Analytics Tab)
    this.renderRegionalOverview('canvas-regional-overview', objId, obj);

    // 5. Planck Distribution Curve (Pyrometry Tab)
    const tempK = obj.thermal?.currentBrightnessTempK || 368.5;
    this.renderPlanckCurveChart('canvas-planck-curve', Math.round(tempK * 4.2));
  }
}
