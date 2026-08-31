/**
 * HeatWatch - Analytics & Data Visualization Engine
 * Integrates Chart.js for FRP time-series baselines, land-cover distributions,
 * anomaly radar breakdowns, regional telemetry, Planck spectral curves, and SHAP bars.
 */

import { HISTORICAL_FRP_DATA, THERMAL_OBJECTS } from './data.js';
import { SatellitePyrometryEngine } from './pyrometry.js';

export class HeatWatchAnalytics {
  constructor() {
    this.pyrometry = new SatellitePyrometryEngine();
    this.charts = {
      frpTimeSeries: null,
      landCoverDoughnut: null,
      anomalyRadar: null,
      regionalFRPBar: null,
      planckCurve: null,
      shapBar: null
    };
  }

  // Update FRP Baseline Time-Series Chart (with 90-day day scrubber highlight)
  renderFrpTimeSeriesChart(canvasId, objectId, highlightedDayIndex = 90) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    let dataPoints = HISTORICAL_FRP_DATA[objectId];
    if (!dataPoints || !dataPoints.length) {
      dataPoints = [];
      const startDate = new Date("2026-06-01T00:00:00Z");
      for (let i = 0; i < 90; i++) {
        const curDate = new Date(startDate.getTime() + i * 86400000);
        dataPoints.push({
          dayIndex: i + 1,
          day: `Day ${i + 1}`,
          date: curDate.toISOString().substring(0, 10),
          frp: 0,
          baseline: 0,
          threshold: 0,
          tempK: 298,
          status: "inactive"
        });
      }
    }

    const labels = dataPoints.map(d => d.day);
    const frpValues = dataPoints.map(d => d.frp);
    const baselineValues = dataPoints.map(d => d.baseline);
    const thresholdValues = dataPoints.map(d => d.threshold);

    if (this.charts.frpTimeSeries) {
      this.charts.frpTimeSeries.destroy();
    }

    this.charts.frpTimeSeries = new Chart(ctx, {
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

    if (this.charts.landCoverDoughnut) {
      this.charts.landCoverDoughnut.destroy();
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

    this.charts.landCoverDoughnut = new Chart(ctx, {
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

    if (this.charts.anomalyRadar) {
      this.charts.anomalyRadar.destroy();
    }

    this.charts.anomalyRadar = new Chart(ctx, {
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

    if (this.charts.planckCurve) {
      this.charts.planckCurve.destroy();
    }

    this.charts.planckCurve = new Chart(ctx, {
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
  renderRegionalOverview(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts.regionalFRPBar) {
      this.charts.regionalFRPBar.destroy();
    }

    const labels = THERMAL_OBJECTS.map(o => o.id);
    const currentFRP = THERMAL_OBJECTS.map(o => o.thermal.currentFRP);
    const baselineFRP = THERMAL_OBJECTS.map(o => o.thermal.historicalMeanFRP);

    this.charts.regionalFRPBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Current FRP (MW)',
            data: currentFRP,
            backgroundColor: '#00f0ff',
            borderRadius: 4
          },
          {
            label: 'Historical Baseline Mean (MW)',
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
            ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } },
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
}
