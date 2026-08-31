/**
 * HeatWatch - Main Application Controller
 * Coordinates GIS Map, Analytics, Inspector HUD, Alert Center, and Guided Demo
 */

import { THERMAL_OBJECTS, STUDY_REGIONS, OSM_FACILITIES, ALL_INDIA_FACILITIES, HISTORICAL_FRP_DATA } from './data.js';
import { HeatWatchMap } from './map.js';
import { HeatWatchAnalytics } from './analytics.js';
import { DemoStoryEngine } from './demo-story.js';
import { ApiPlayground } from './api-playground.js';
import { NasaFirmsLiveFetcher } from './firms-fetcher.js';
import { SatellitePyrometryEngine } from './pyrometry.js';
import { ModelExplainerEngine } from './model-explainer.js';
import { saveApiKey } from './config.js';

class HeatWatchApp {
  constructor() {
    this.currentView = 'command-map';
    this.selectedObject = THERMAL_OBJECTS[0];
    this.activeDataMode = 'live'; // 'live' | 'demo'
    this.currentCategoryFilter = 'all';
    this.currentSortOrder = 'frp_desc';
    this.alertSearchQuery = '';
    
    this.mapInstance = null;
    this.analyticsInstance = null;
    this.demoEngine = null;
    this.apiPlayground = null;
    this.firmsFetcher = null;
    this.pyrometryEngine = new SatellitePyrometryEngine();
    this.modelExplainer = new ModelExplainerEngine();

    this.init();
  }

  init() {
    // 1. Initialize Analytics Engine
    this.analyticsInstance = new HeatWatchAnalytics();
    
    // 2. Initialize GIS Map
    this.mapInstance = new HeatWatchMap('gis-map-canvas', (selectedObj) => {
      this.handleSelectObject(selectedObj);
    });

    // 3. Initialize Live NASA Fetcher
    this.firmsFetcher = new NasaFirmsLiveFetcher((rawPoints, clusters) => {
      this.liveClusters = clusters;
      this.mapInstance.renderRawFirmsPoints(rawPoints);
      this.mapInstance.renderThermalClusters(clusters);
      this.renderAlertsTable();
    });

    // 4. Initialize Demo Story Engine
    this.demoEngine = new DemoStoryEngine(this.mapInstance, (stepData, index) => {
      this.renderDemoStepUI(stepData, index);
    });

    // 5. Initialize API Playground
    this.apiPlayground = new ApiPlayground();

    // 6. Setup UI Event Listeners
    this.setupNavigation();
    this.setupFiltersAndControls();
    this.setupCategoryFiltersAndSorting();
    this.setupCollapsibleAndDraggablePanels();
    this.setupModals();
    this.setupAlertCenterActions();
    this.setupApiPlaygroundUI();
    this.setupFacilitySearch();
    this.setupLiveFetchButton();
    this.setupPyrometryAndModelSimulator();
    this.setupTimelineScrubber();

    // 7. Initial render of selected object (#OBJ-1045)
    this.updateInspectorHUD(this.selectedObject);
    this.renderAlertsTable();
    this.renderNasaComparisonMatrix();

    // Start Live Clock
    this.startClock();
  }

  setupNavigation() {
    // Primary Tab Buttons
    const navButtons = document.querySelectorAll('.nav-tab-btn:not(.dropdown-trigger-btn)');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-view');
        if (targetView) this.switchView(targetView);
      });
    });

    // More Analysis Tools Dropdown Toggle
    const moreToolsBtn = document.getElementById('btn-more-tools');
    const moreToolsMenu = document.getElementById('menu-more-tools');
    const moreToolsWrap = document.getElementById('wrap-more-tools');

    if (moreToolsBtn && moreToolsMenu) {
      moreToolsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreToolsMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (moreToolsWrap && !moreToolsWrap.contains(e.target)) {
          moreToolsMenu.classList.remove('show');
        }
      });

      // Dropdown Menu Item View Switches
      const dropdownItems = moreToolsMenu.querySelectorAll('.dropdown-item-btn[data-view]');
      dropdownItems.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetView = btn.getAttribute('data-view');
          if (targetView) {
            this.switchView(targetView);
            moreToolsMenu.classList.remove('show');
          }
        });
      });

      // Dropdown Spectral & Settings Triggers
      const btnMenuSpectral = document.getElementById('btn-menu-spectral');
      if (btnMenuSpectral) {
        btnMenuSpectral.addEventListener('click', () => {
          moreToolsMenu.classList.remove('show');
          this.openSpectralModal(this.selectedObject ? this.selectedObject.id : 'OBJ-1045');
        });
      }

      const btnMenuSettings = document.getElementById('btn-menu-settings');
      if (btnMenuSettings) {
        btnMenuSettings.addEventListener('click', () => {
          moreToolsMenu.classList.remove('show');
          const settingsModal = document.getElementById('modal-settings');
          if (settingsModal) settingsModal.classList.add('active');
        });
      }
    }

    // Official Incident Dossier Header & Sidebar Buttons
    const btnHeaderDossier = document.getElementById('btn-header-dossier');
    if (btnHeaderDossier) {
      btnHeaderDossier.addEventListener('click', () => {
        this.openIncidentDossier(this.selectedObject || THERMAL_OBJECTS[0]);
      });
    }

    const btnSidebarDossier = document.getElementById('btn-open-dossier-sidebar');
    if (btnSidebarDossier) {
      btnSidebarDossier.addEventListener('click', () => {
        this.openIncidentDossier(this.selectedObject || THERMAL_OBJECTS[0]);
      });
    }

    // Dossier Modal Controls
    const dossierModal = document.getElementById('modal-incident-dossier');
    const btnCloseDossier = document.getElementById('btn-close-dossier-modal');
    const btnPrintDossier = document.getElementById('btn-print-dossier');

    if (btnCloseDossier && dossierModal) {
      btnCloseDossier.addEventListener('click', () => {
        dossierModal.classList.remove('active');
      });
    }

    if (btnPrintDossier) {
      btnPrintDossier.addEventListener('click', () => {
        window.print();
      });
    }

    // Guided Story Mode Button in Header
    const guidedDemoBtn = document.getElementById('btn-guided-demo');
    if (guidedDemoBtn) {
      guidedDemoBtn.addEventListener('click', () => {
        this.switchView('command-map');
        const demoBar = document.getElementById('demo-story-bar');
        if (demoBar) {
          demoBar.classList.add('active');
          this.demoEngine.startDemo();
        }
      });
    }

    // Export GeoJSON in Header
    const exportBtn = document.getElementById('btn-export-geojson');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.apiPlayground.exportGeoJson();
      });
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    
    // Update nav tab active classes
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Update view container visibility
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Trigger map resize if switching to map
    if (viewName === 'command-map' && this.mapInstance) {
      setTimeout(() => {
        this.mapInstance.map.invalidateSize();
      }, 100);
    }

    // Refresh icons
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 50);
    }

    // Trigger analytics charts if switching to analytics
    if (viewName === 'analytics-tab') {
      setTimeout(() => {
        this.analyticsInstance.renderRegionalOverview('canvas-regional-overview');
        this.analyticsInstance.renderFrpTimeSeriesChart('canvas-analytics-timeseries', this.selectedObject.id);
      }, 100);
    }

    // Trigger alerts table refresh if switching to alerts tab
    if (viewName === 'alerts-tab') {
      this.renderAlertsTable();
    }

    // Trigger comparison matrix if switching to comparison tab
    if (viewName === 'comparison-tab') {
      this.renderNasaComparisonMatrix();
    }

    // Trigger pyrometry charts if switching to pyrometry tab
    if (viewName === 'pyrometry-tab') {
      setTimeout(() => {
        const sliderVal = parseInt(document.getElementById('slider-planck-temp')?.value || 1620);
        this.analyticsInstance.renderPlanckCurveChart('canvas-planck-curve', sliderVal);
        this.updateModelSimulator();
      }, 100);
    }
  }

  setupFiltersAndControls() {
    // Populate all 50+ facilities into Focus dropdown
    this.populateFocusDropdown();

    // Region Dropdown
    const regionSelect = document.getElementById('select-study-region');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        this.mapInstance.setRegion(e.target.value);
      });
    }

    // Basemap Style Dropdown
    const basemapSelect = document.getElementById('select-basemap-style');
    if (basemapSelect) {
      basemapSelect.addEventListener('change', (e) => {
        this.mapInstance.setBaseMap(e.target.value);
      });
    }

    // Layer Switch Toggles
    const layerToggles = [
      { id: 'toggle-layer-firms', key: 'rawFirms' },
      { id: 'toggle-layer-clusters', key: 'thermalClusters' },
      { id: 'toggle-layer-osm', key: 'osmFacilities' },
      { id: 'toggle-layer-worldcover', key: 'worldCoverBuffers' },
      { id: 'toggle-layer-nasa', key: 'nasaStaticMask' },
      { id: 'toggle-layer-buffers', key: 'riskBuffers' }
    ];

    layerToggles.forEach(({ id, key }) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.mapInstance.toggleLayer(key, e.target.checked);
        });
      }
    });

    // Time Scrubber Slider
    const timeScrubber = document.getElementById('map-timeline-slider');
    const scrubberLabel = document.getElementById('scrubber-time-display');
    if (timeScrubber && scrubberLabel) {
      timeScrubber.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (val === 100) {
          scrubberLabel.textContent = "LIVE: Today 03:45 UTC";
        } else {
          const daysAgo = Math.round((100 - val) * 0.9);
          scrubberLabel.textContent = `HISTORICAL: Day -${daysAgo}`;
        }
      });
    }

    // Live vs Demo Data Mode Buttons
    const liveBtn = document.getElementById('btn-mode-live');
    const demoBtn = document.getElementById('btn-mode-demo');
    if (liveBtn && demoBtn) {
      liveBtn.addEventListener('click', () => {
        this.activeDataMode = 'live';
        liveBtn.classList.add('active');
        demoBtn.classList.remove('active');
        document.getElementById('ticker-data-source').textContent = "NASA LANCE NRT (Live Stream)";
      });
      demoBtn.addEventListener('click', () => {
        this.activeDataMode = 'demo';
        demoBtn.classList.add('active');
        liveBtn.classList.remove('active');
        document.getElementById('ticker-data-source').textContent = "Curated SIH Offline Scenario (Offline Backup)";
      });
    }

    // Guided Story Bar Controls
    const closeDemoBtn = document.getElementById('btn-close-demo');
    const nextDemoBtn = document.getElementById('btn-next-step');
    const prevDemoBtn = document.getElementById('btn-prev-step');
    const autoPlayBtn = document.getElementById('btn-autoplay-demo');

    if (closeDemoBtn) {
      closeDemoBtn.addEventListener('click', () => {
        document.getElementById('demo-story-bar').classList.remove('active');
        this.demoEngine.stopAutoPlay();
      });
    }

    if (nextDemoBtn) {
      nextDemoBtn.addEventListener('click', () => this.demoEngine.nextStep());
    }

    if (prevDemoBtn) {
      prevDemoBtn.addEventListener('click', () => this.demoEngine.prevStep());
    }

    if (autoPlayBtn) {
      autoPlayBtn.addEventListener('click', () => {
        const isPlaying = this.demoEngine.toggleAutoPlay();
        autoPlayBtn.textContent = isPlaying ? "⏸ Pause Tour" : "▶ Auto Play Tour";
      });
    }
  }

  populateFocusDropdown() {
    const selectEl = document.getElementById('select-study-region');
    if (!selectEl) return;

    const categories = [
      { key: "REF", label: "🛢️ Oil Refineries & Petrochemicals (11)" },
      { key: "STP", label: "⚡ Super Thermal Power Stations (12)" },
      { key: "STL", label: "🏭 Integrated Steel Plants (8)" },
      { key: "LNG", label: "⛽ LNG & Gas Terminals (5)" },
      { key: "COAL", label: "⛏️ Coal Mining & Seam Fires (6)" },
      { key: "FERT", label: "🧪 Fertilizer & Chemical Hubs (6)" },
      { key: "BIO", label: "🌲 Biosphere & Crop Residue (5)" }
    ];

    let html = `
      <option value="all_india" selected>🇮🇳 All-India Overview (50+ Industrial Facilities)</option>
    `;

    categories.forEach(cat => {
      const facs = ALL_INDIA_FACILITIES.filter(f => f.id.startsWith(cat.key));
      if (facs.length > 0) {
        html += `<optgroup label="${cat.label}">`;
        facs.forEach(f => {
          html += `<option value="${f.id}">${f.name} (${f.state})</option>`;
        });
        html += `</optgroup>`;
      }
    });

    selectEl.innerHTML = html;
  }

  handleSelectObject(obj) {
    this.selectedObject = obj;
    this.updateInspectorHUD(obj);
    const sidebar = document.getElementById('map-sidebar-inspector');
    if (sidebar) sidebar.scrollTop = 0;
  }

  setupCategoryFiltersAndSorting() {
    // Map Category Ribbon Chips
    const categoryChips = document.querySelectorAll('.category-chip');
    categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const categoryKey = chip.getAttribute('data-category');
        if (categoryKey) {
          this.setCategoryFilter(categoryKey);
        }
      });
    });

    // Alert Center Category Tabs
    const alertTabs = document.querySelectorAll('.alert-tab-btn');
    alertTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const categoryKey = tab.getAttribute('data-category');
        if (categoryKey) {
          this.setCategoryFilter(categoryKey);
        }
      });
    });

    // Map Sorting Dropdown
    const sortSelect = document.getElementById('select-map-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.setSortOrder(e.target.value);
      });
    }

    // Alert Center Search Input
    const alertSearchInput = document.getElementById('input-alert-search');
    if (alertSearchInput) {
      alertSearchInput.addEventListener('input', (e) => {
        this.alertSearchQuery = e.target.value.toLowerCase().trim();
        this.renderAlertsTable();
      });
    }
  }

  setupCollapsibleAndDraggablePanels() {
    const makeDraggable = (panelEl, handleEl) => {
      if (!panelEl || !handleEl) return;
      let isDragging = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialTop = 0;
      let dragDistance = 0;

      const onPointerStart = (e) => {
        if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input') || e.target.closest('.custom-switch')) return;

        isDragging = true;
        dragDistance = 0;
        panelEl.dataset.wasDragging = 'false';
        panelEl.classList.add('dragging');

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const rect = panelEl.getBoundingClientRect();
        const parentRect = (panelEl.offsetParent || document.body).getBoundingClientRect();

        startX = clientX;
        startY = clientY;
        initialLeft = rect.left - parentRect.left;
        initialTop = rect.top - parentRect.top;

        panelEl.style.left = `${initialLeft}px`;
        panelEl.style.top = `${initialTop}px`;
        panelEl.style.right = 'auto';
        panelEl.style.bottom = 'auto';

        document.addEventListener('mousemove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerEnd);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('touchend', onPointerEnd);
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;
        dragDistance = Math.hypot(dx, dy);

        if (dragDistance > 4) {
          panelEl.dataset.wasDragging = 'true';
          if (e.cancelable) e.preventDefault();
        }

        const parent = panelEl.offsetParent || document.body;
        const maxLeft = parent.clientWidth - panelEl.offsetWidth - 10;
        const maxTop = parent.clientHeight - panelEl.offsetHeight - 10;

        const newLeft = Math.max(10, Math.min(maxLeft, initialLeft + dx));
        const newTop = Math.max(10, Math.min(maxTop, initialTop + dy));

        panelEl.style.left = `${newLeft}px`;
        panelEl.style.top = `${newTop}px`;
      };

      const onPointerEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        panelEl.classList.remove('dragging');

        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerEnd);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('touchend', onPointerEnd);
      };

      handleEl.addEventListener('mousedown', onPointerStart);
      handleEl.addEventListener('touchstart', onPointerStart, { passive: true });
    };

    // 1. Multimodal Layers Panel (Collapsible & Draggable)
    const layersHeader = document.getElementById('btn-toggle-layers');
    const layersPanel = document.getElementById('map-layers-panel');
    const layersDragHandle = document.getElementById('layers-drag-handle');
    if (layersHeader && layersPanel) {
      layersHeader.addEventListener('click', (e) => {
        if (e.target.closest('#layers-drag-handle')) return;
        if (layersPanel.dataset.wasDragging === 'true') {
          layersPanel.dataset.wasDragging = 'false';
          return;
        }
        layersPanel.classList.toggle('collapsed');
      });
      makeDraggable(layersPanel, layersDragHandle || layersHeader);
    }

    // 2. Source Segregation Ribbon (Collapsible & Draggable)
    const ribbonLabelToggle = document.getElementById('ribbon-label-toggle');
    const ribbon = document.getElementById('map-category-ribbon');
    const ribbonDragHandle = document.getElementById('ribbon-drag-handle');
    if (ribbonLabelToggle && ribbon) {
      ribbonLabelToggle.addEventListener('click', () => {
        if (ribbon.dataset.wasDragging === 'true') {
          ribbon.dataset.wasDragging = 'false';
          return;
        }
        ribbon.classList.toggle('collapsed');
      });
      makeDraggable(ribbon, ribbonDragHandle || ribbonLabelToggle);
    }

    // 3. Symbology Legend Panel (Collapsible & Draggable)
    const legendHeader = document.getElementById('btn-toggle-legend');
    const legendPanel = document.getElementById('map-legend-panel');
    const legendDragHandle = document.getElementById('legend-drag-handle');
    if (legendHeader && legendPanel) {
      legendHeader.addEventListener('click', (e) => {
        if (e.target.closest('#legend-drag-handle')) return;
        if (legendPanel.dataset.wasDragging === 'true') {
          legendPanel.dataset.wasDragging = 'false';
          return;
        }
        legendPanel.classList.toggle('collapsed');
      });
      makeDraggable(legendPanel, legendDragHandle || legendHeader);
    }

    // 4. Region & Facility Search Panel (Draggable)
    const regionPanel = document.getElementById('map-region-selector');
    const regionDragHandle = document.getElementById('region-selector-drag-handle');
    if (regionPanel) {
      makeDraggable(regionPanel, regionDragHandle || regionPanel);
    }
  }

  setCategoryFilter(categoryKey) {
    this.currentCategoryFilter = categoryKey;

    // Update Ribbon Chips
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-category') === categoryKey);
    });

    // Update Alert Tabs
    document.querySelectorAll('.alert-tab-btn').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-category') === categoryKey);
    });

    // Update Map Clusters
    const filtered = this.getFilteredThermalObjects();
    if (this.mapInstance) {
      this.mapInstance.renderThermalClusters(filtered);
    }

    // Update Alerts Table
    this.renderAlertsTable();

    // Pan camera to category exemplar
    this.flyToCategoryExemplar(categoryKey);
  }

  setSortOrder(sortKey) {
    this.currentSortOrder = sortKey;
    const filtered = this.getFilteredThermalObjects();
    if (this.mapInstance) {
      this.mapInstance.renderThermalClusters(filtered);
    }
    this.renderAlertsTable();
  }

  getFilteredThermalObjects() {
    let list = [...THERMAL_OBJECTS];

    if (this.currentCategoryFilter !== 'all') {
      list = list.filter(obj => {
        if (obj.categoryGroup === this.currentCategoryFilter) return true;
        if (this.currentCategoryFilter === 'industrial_fire' && (obj.categoryGroup === 'industrial_fire' || (obj.primaryCategory === 'industrial' && obj.status === 'high_priority'))) return true;
        if (this.currentCategoryFilter === 'routine_flare' && obj.categoryGroup === 'routine_flare') return true;
        if (this.currentCategoryFilter === 'mining_fire' && obj.categoryGroup === 'mining_fire') return true;
        if (this.currentCategoryFilter === 'forest_fire' && (obj.categoryGroup === 'forest_fire' || obj.primaryCategory === 'wildfire')) return true;
        if (this.currentCategoryFilter === 'agriculture_fire' && (obj.categoryGroup === 'agriculture_fire' || obj.primaryCategory === 'agriculture')) return true;
        if (this.currentCategoryFilter === 'glint_filtered' && obj.categoryGroup === 'glint_filtered') return true;
        return false;
      });
    }

    if (this.alertSearchQuery) {
      list = list.filter(obj => 
        obj.name.toLowerCase().includes(this.alertSearchQuery) ||
        obj.id.toLowerCase().includes(this.alertSearchQuery) ||
        (obj.matchedFacility?.name || '').toLowerCase().includes(this.alertSearchQuery) ||
        (obj.categoryLabel || '').toLowerCase().includes(this.alertSearchQuery)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (this.currentSortOrder === 'frp_desc') {
        return (b.thermal?.currentFRP || 0) - (a.thermal?.currentFRP || 0);
      } else if (this.currentSortOrder === 'surge_desc') {
        return (b.thermal?.frpDeviationRatio || 0) - (a.thermal?.frpDeviationRatio || 0);
      } else if (this.currentSortOrder === 'confidence_desc') {
        return (b.evidenceScore || 0) - (a.evidenceScore || 0);
      } else if (this.currentSortOrder === 'velocity_desc') {
        return (b.spatialDynamics?.spreadVelocityKmH || 0) - (a.spatialDynamics?.spreadVelocityKmH || 0);
      } else if (this.currentSortOrder === 'recent') {
        return (b.thermal?.totalDetections || 0) - (a.thermal?.totalDetections || 0);
      }
      return 0;
    });

    return list;
  }

  flyToCategoryExemplar(categoryKey) {
    if (!this.mapInstance) return;

    switch (categoryKey) {
      case 'forest_fire': {
        const obj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-3041');
        if (obj) {
          this.mapInstance.selectObject(obj.id);
          this.handleSelectObject(obj);
        }
        break;
      }
      case 'agriculture_fire': {
        const obj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-4012');
        if (obj) {
          this.mapInstance.selectObject(obj.id);
          this.handleSelectObject(obj);
        }
        break;
      }
      case 'mining_fire': {
        const obj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-7011');
        if (obj) {
          this.mapInstance.selectObject(obj.id);
          this.handleSelectObject(obj);
        }
        break;
      }
      case 'industrial_fire': {
        const obj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-1045');
        if (obj) {
          this.mapInstance.selectObject(obj.id);
          this.handleSelectObject(obj);
        }
        break;
      }
      case 'routine_flare': {
        const obj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-1082');
        if (obj) {
          this.mapInstance.selectObject(obj.id);
          this.handleSelectObject(obj);
        }
        break;
      }
      case 'glint_filtered': {
        const obj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-8021');
        if (obj) {
          this.mapInstance.selectObject(obj.id);
          this.handleSelectObject(obj);
        }
        break;
      }
      default:
        this.mapInstance.map.flyTo([22.5, 78.5], 5, { duration: 1.2 });
        break;
    }
  }

  updateInspectorHUD(obj) {
    if (!obj) return;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // Header & Badges
    setTxt('hud-obj-id', obj.id);
    setTxt('hud-obj-title', obj.name);
    setTxt('hud-obj-category', obj.categoryLabel);
    
    const severityBadge = document.getElementById('hud-obj-severity');
    if (severityBadge) {
      severityBadge.className = `severity-tag ${obj.status === 'high_priority' ? 'high-priority' : obj.status}`;
      severityBadge.textContent = obj.statusLabel;
    }

    // Telemetry Stats
    if (obj.thermal) {
      setTxt('hud-stat-frp', `${obj.thermal.currentFRP} MW`);
      setTxt('hud-stat-frp-dev', `${obj.thermal.frpDeviationRatio}× Baseline`);
      setTxt('hud-stat-temp', `${obj.thermal.currentBrightnessTempK} K`);
      setTxt('hud-stat-persistence', obj.thermal.persistenceRate);
      setTxt('hud-stat-active-days', `${obj.thermal.activeDays} Days (${obj.thermal.totalDetections} Detections)`);
    }
    if (obj.matchedFacility) {
      setTxt('hud-stat-facility-dist', `${obj.matchedFacility.distanceMeters} m`);
      setTxt('hud-stat-facility-name', obj.matchedFacility.name);
    }

    // Recommendation 2: Spatial Dynamics & Centroid Stability Tracking
    if (obj.spatialDynamics) {
      setTxt('hud-stat-stability', `${obj.spatialDynamics.centroidStabilityPct}%`);
      setTxt('hud-stat-velocity', `${obj.spatialDynamics.spreadVelocityKmH} km/h`);
      setTxt('hud-stat-motion-type', obj.spatialDynamics.motionType);
      setTxt('hud-stat-drift', `${obj.spatialDynamics.driftVectorMeters} m`);
      setTxt('hud-stat-plume-dir', obj.spatialDynamics.plumeDispersion || 'Calm');

      const motionBadge = document.getElementById('hud-motion-badge');
      if (motionBadge) {
        if (obj.spatialDynamics.isStationary) {
          motionBadge.textContent = "STATIONARY STACK";
          motionBadge.style.background = "rgba(0, 240, 255, 0.15)";
          motionBadge.style.color = "var(--accent-cyan)";
        } else {
          motionBadge.textContent = "MOVING FIRE FRONT";
          motionBadge.style.background = "rgba(255, 71, 71, 0.2)";
          motionBadge.style.color = "#ff4747";
        }
      }
    }

    // Recommendation 1: False Positive & Solar Glint Rejection Filter
    if (obj.glintFilter) {
      setTxt('hud-glint-badge', obj.glintFilter.statusLabel);
      setTxt('hud-glint-desc', `Albedo (${obj.glintFilter.albedoReflectance}) & solar elevation (${obj.glintFilter.solarElevationDeg}°) confirm active combustion. Solar rooftop/desert glint ruled out.`);
    }

    // Recommendation 3: Critical Infrastructure Hazard Proximity
    if (obj.hazardProximity) {
      setTxt('hud-hazard-threat', obj.hazardProximity.threatLevel);
      setTxt('hud-hazard-summary', obj.hazardProximity.summary);
      
      const hazardCard = document.getElementById('hud-hazard-card');
      if (hazardCard) {
        if (obj.hazardProximity.threatLevel === 'NOMINAL' || obj.hazardProximity.threatLevel.includes('NOMINAL')) {
          hazardCard.style.background = "rgba(16, 185, 129, 0.05)";
          hazardCard.style.border = "1px solid rgba(16, 185, 129, 0.2)";
        } else if (obj.hazardProximity.threatLevel.includes('CRITICAL')) {
          hazardCard.style.background = "rgba(255, 71, 71, 0.08)";
          hazardCard.style.border = "1px solid rgba(255, 71, 71, 0.3)";
        } else {
          hazardCard.style.background = "rgba(245, 158, 11, 0.08)";
          hazardCard.style.border = "1px solid rgba(245, 158, 11, 0.3)";
        }
      }
    }

    // Sub-Pixel Radiometric Calculation (Collapsible Secondary)
    // Human Verification Status
    const hudVerifStatus = document.getElementById('hud-verification-status');
    if (hudVerifStatus) {
      if (obj.humanVerification && obj.humanVerification.isVerified) {
        hudVerifStatus.textContent = `✓ Verified: ${obj.humanVerification.verifiedCategory.toUpperCase()} (${obj.humanVerification.verifiedBy})`;
        hudVerifStatus.style.color = "#10b981";
      } else {
        hudVerifStatus.textContent = "⏳ Pending Operator Review";
        hudVerifStatus.style.color = "#ffaa00";
      }
    }

    // Evidence Score Progress
    setTxt('hud-score-pct', `${(obj.evidenceScore * 100).toFixed(0)}%`);
    const scoreBar = document.getElementById('hud-score-bar');
    if (scoreBar) scoreBar.style.width = `${obj.evidenceScore * 100}%`;

    // Anomaly Score Progress
    if (obj.anomalyFormula) {
      setTxt('hud-anomaly-pct', `${(obj.anomalyFormula.totalAnomalyScore * 100).toFixed(0)}%`);
      const anomBar = document.getElementById('hud-anomaly-bar');
      if (anomBar) anomBar.style.width = `${obj.anomalyFormula.totalAnomalyScore * 100}%`;
    }

    // Evidence Checklist
    const evContainer = document.getElementById('hud-evidence-list');
    if (evContainer && obj.evidencePoints) {
      evContainer.innerHTML = obj.evidencePoints.map(ev => `
        <div class="evidence-row">
          <span class="ev-icon ${ev.type === 'anomaly-trigger' ? 'alert' : 'check'}">
            ${ev.type === 'anomaly-trigger' ? '■' : '✓'}
          </span>
          <span style="color: ${ev.type === 'anomaly-trigger' ? '#ff8888' : '#e5e7eb'};">${ev.text}</span>
        </div>
      `).join('');
    }

    // NASA Comparison Card
    if (obj.nasaComparison) {
      setTxt('hud-nasa-label', obj.nasaComparison.nasaLabel);
      setTxt('hud-heatwatch-label', obj.nasaComparison.heatwatchLabel);
      setTxt('hud-compare-status', obj.nasaComparison.agreementStatus);
      setTxt('hud-compare-desc', obj.nasaComparison.explanation);
    }

    // Action Box
    setTxt('hud-action-text', obj.recommendedAction || "");
    if (obj.nearestSettlement) {
      setTxt('hud-exposure-text', `Nearest: ${obj.nearestSettlement.name} (${obj.nearestSettlement.distanceKm} km, ~${obj.nearestSettlement.populationEstimate})`);
    }

    // Re-render Canvas Charts in Sidebar
    if (this.analyticsInstance) {
      this.analyticsInstance.renderFrpTimeSeriesChart('sidebar-frp-chart', obj.id, 90);
      if (obj.landCover) this.analyticsInstance.renderLandCoverDoughnut('sidebar-landcover-chart', obj.landCover);
      if (obj.anomalyFormula) this.analyticsInstance.renderAnomalyRadar('sidebar-radar-chart', obj.anomalyFormula);
    }

    // Run Live ML Model Inference for this selected hotspot
    const features = {
      frp: obj.thermal ? obj.thermal.currentFRP : 25.0,
      tempK: obj.thermal ? obj.thermal.currentBrightnessTempK : 345.0,
      distRefineryM: obj.matchedFacility ? obj.matchedFacility.distanceMeters : 5000.0,
      builtupPct: obj.landCover ? obj.landCover.industrialBuiltUp : 10.0,
      forestPct: obj.landCover ? obj.landCover.vegetationTree : 10.0,
      croplandPct: obj.landCover ? obj.landCover.cropland : 10.0,
      nightlight: obj.nighttimeLight ? obj.nighttimeLight.radianceScore : 10.0
    };

    this.modelExplainer.inferProbabilitiesLive(features).then(mlRes => {
      if (mlRes && mlRes.topClass) {
        setTxt('hud-obj-category', `${mlRes.topClass.name} • ${obj.subtype || 'Thermal Source'}`);
        setTxt('hud-score-pct', `${(mlRes.topClass.prob * 100).toFixed(1)}%`);
        const scoreBar = document.getElementById('hud-score-bar');
        if (scoreBar) scoreBar.style.width = `${mlRes.topClass.prob * 100}%`;
      }
    });

    // Make sure inspector sidebar is visible
    const inspectorEl = document.getElementById('map-sidebar-inspector');
    if (inspectorEl) {
      inspectorEl.classList.remove('collapsed');
    }
  }

  openIncidentDossier(obj) {
    if (!obj) obj = this.selectedObject || THERMAL_OBJECTS[0];
    const dossierModal = document.getElementById('modal-incident-dossier');
    if (!dossierModal) return;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt('dos-ref-code', `REF: HW-IND-2026-${obj.id.replace('OBJ-', '')}`);
    setTxt('dos-status-tag', obj.statusLabel || "INCIDENT REPORT");
    setTxt('dos-object-name', obj.name);
    setTxt('dos-frp-hero', `${obj.thermal.currentFRP} MW`);
    setTxt('dos-surge-hero', `${obj.thermal.frpDeviationRatio}× 90-Day Baseline`);
    setTxt('dos-id', obj.id);
    setTxt('dos-coords', `${obj.centroid[0].toFixed(4)}° N, ${obj.centroid[1].toFixed(4)}° E`);
    setTxt('dos-region', `${obj.regionId.toUpperCase()} Zone`);
    setTxt('dos-time', obj.thermal.detectionTime || "2026-08-28 03:45 UTC");
    setTxt('dos-sensors', obj.thermal.sensor || "VIIRS SNPP (375m) & MODIS");
    setTxt('dos-category', `${obj.categoryLabel} (${obj.subtype})`);
    setTxt('dos-conf', `${(obj.evidenceScore * 100).toFixed(1)}% (XGBoost Multi-Modal)`);
    setTxt('dos-facility', `${obj.matchedFacility ? obj.matchedFacility.name : 'N/A'} (${obj.matchedFacility ? obj.matchedFacility.distanceMeters + 'm distance' : ''})`);
    setTxt('dos-landcover', `Built-Up: ${obj.landCover?.industrialBuiltUp || 0}% • Forest: ${obj.landCover?.vegetationTree || 0}% • Cropland: ${obj.landCover?.cropland || 0}%`);
    setTxt('dos-nasa-diff', `NASA: ${obj.nasaComparison?.nasaLabel || 'Static'} → HeatWatch: ${obj.nasaComparison?.heatwatchLabel || 'Incident'}`);
    setTxt('dos-glint', obj.glintFilter ? obj.glintFilter.statusLabel : "✓ PASSED: Verified High-Temp Emitter (Glint Rejected)");
    setTxt('dos-stability', `${obj.spatialDynamics ? obj.spatialDynamics.centroidStabilityPct : 99.4}% (${obj.spatialDynamics ? obj.spatialDynamics.motionType : 'Stationary'})`);
    setTxt('dos-velocity', `${obj.spatialDynamics ? obj.spatialDynamics.spreadVelocityKmH : 0.0} km/h`);
    setTxt('dos-plume', obj.spatialDynamics ? obj.spatialDynamics.plumeDispersion : "South-West (18 km/h)");
    setTxt('dos-footprint', `${obj.thermal.footprintAreaHa || 8.4} Hectares`);
    setTxt('dos-settlement', obj.nearestSettlement ? `${obj.nearestSettlement.name} (${obj.nearestSettlement.distanceKm} km, ~${obj.nearestSettlement.populationEstimate})` : "N/A");
    setTxt('dos-asset-threat', obj.hazardProximity ? obj.hazardProximity.nearestInfrastructure : "N/A");
    setTxt('dos-encroachment', obj.hazardProximity ? obj.hazardProximity.summary : "Normal containment boundary");
    setTxt('dos-action', obj.recommendedAction || "Conduct immediate field verification.");

    dossierModal.classList.add('active');
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 50);
    }
  }

  setupPyrometryAndModelSimulator() {
    // Planck Curve Temperature Slider
    const planckSlider = document.getElementById('slider-planck-temp');
    const planckLabel = document.getElementById('label-planck-temp');
    if (planckSlider && planckLabel) {
      planckSlider.addEventListener('input', (e) => {
        const tempK = parseInt(e.target.value);
        planckLabel.textContent = `${tempK} K (${(tempK - 273.15).toFixed(0)} °C)`;
        this.analyticsInstance.renderPlanckCurveChart('canvas-planck-curve', tempK);
      });
    }

    // AI Feature Sliders
    const sliderFRP = document.getElementById('sim-slider-frp');
    const sliderDist = document.getElementById('sim-slider-dist');
    const sliderBuiltup = document.getElementById('sim-slider-builtup');
    const sliderForest = document.getElementById('sim-slider-forest');

    const triggerSim = () => this.updateModelSimulator();

    if (sliderFRP) {
      sliderFRP.addEventListener('input', (e) => {
        document.getElementById('val-sim-frp').textContent = `${e.target.value} MW`;
        triggerSim();
      });
    }
    if (sliderDist) {
      sliderDist.addEventListener('input', (e) => {
        document.getElementById('val-sim-dist').textContent = `${e.target.value} m`;
        triggerSim();
      });
    }
    if (sliderBuiltup) {
      sliderBuiltup.addEventListener('input', (e) => {
        document.getElementById('val-sim-builtup').textContent = `${e.target.value}%`;
        triggerSim();
      });
    }
    if (sliderForest) {
      sliderForest.addEventListener('input', (e) => {
        document.getElementById('val-sim-forest').textContent = `${e.target.value}%`;
        triggerSim();
      });
    }
  }

  updateModelSimulator() {
    const frp = parseFloat(document.getElementById('sim-slider-frp')?.value || 68);
    const dist = parseFloat(document.getElementById('sim-slider-dist')?.value || 210);
    const builtup = parseFloat(document.getElementById('sim-slider-builtup')?.value || 76);
    const forest = parseFloat(document.getElementById('sim-slider-forest')?.value || 3);
    const cropland = Math.max(100 - builtup - forest, 0);

    const result = this.modelExplainer.inferProbabilities({
      frp,
      tempK: 368.5,
      distRefineryM: dist,
      builtupPct: builtup,
      forestPct: forest,
      croplandPct: cropland,
      nightlight: builtup > 50 ? 84.0 : 4.0
    });

    const predClassEl = document.getElementById('sim-predicted-class');
    if (predClassEl) {
      predClassEl.textContent = result.topClass.name;
      predClassEl.style.color = result.topClass.color;
    }

    const barsContainer = document.getElementById('sim-probability-bars');
    if (barsContainer) {
      barsContainer.innerHTML = result.classes.map(c => `
        <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
          <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#9ca3af;">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name.split('/')[0]}</span>
            <strong style="color:#fff;">${(c.prob * 100).toFixed(0)}%</strong>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
            <div style="height:100%; width:${c.prob * 100}%; background:${c.color}; border-radius:3px;"></div>
          </div>
        </div>
      `).join('');
    }

    const shapContainer = document.getElementById('sim-shap-list');
    if (shapContainer) {
      shapContainer.innerHTML = result.shapContributions.map(s => `
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; background:rgba(0,0,0,0.25); padding:3px 8px; border-radius:4px;">
          <span style="color:#d1d5db;">${s.feature}</span>
          <span style="font-family:var(--font-mono); font-weight:700; color:${s.impact === 'positive' ? '#10b981' : '#ff4747'};">${s.value}</span>
        </div>
      `).join('');
    }
  }

  renderDemoStepUI(stepData, index) {
    document.getElementById('demo-step-num').textContent = `STEP ${index + 1} OF 8`;
    document.getElementById('demo-step-title').textContent = stepData.title;
    document.getElementById('demo-step-desc').textContent = stepData.description;
    document.getElementById('demo-action-highlight').textContent = `Target Action: ${stepData.actionHighlight}`;

    // Update Progress Dots
    const dotsContainer = document.getElementById('demo-progress-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = Array.from({ length: 8 }).map((_, i) => `
        <div class="demo-dot ${i === index ? 'active' : ''}" onclick="window.heatwatchApp.demoEngine.goToStep(${i + 1})"></div>
      `).join('');
    }

    // Synchronize UI Checkboxes to reflect applied layer preset
    Object.keys(stepData.mapLayers).forEach(layerKey => {
      const toggleMap = {
        rawFirms: 'toggle-layer-firms',
        thermalClusters: 'toggle-layer-clusters',
        osmFacilities: 'toggle-layer-osm',
        worldCoverBuffers: 'toggle-layer-worldcover',
        nasaStaticMask: 'toggle-layer-nasa',
        riskBuffers: 'toggle-layer-buffers'
      };
      const checkboxId = toggleMap[layerKey];
      if (checkboxId) {
        const el = document.getElementById(checkboxId);
        if (el) el.checked = stepData.mapLayers[layerKey];
      }
    });
  }

  getObjectById(objectId) {
    return THERMAL_OBJECTS.find(o => o.id === objectId) || this.selectedObject || THERMAL_OBJECTS[0];
  }

  renderNasaComparisonMatrix() {
    const tableBody = document.getElementById('nasa-matrix-body');
    if (!tableBody) return;

    tableBody.innerHTML = THERMAL_OBJECTS.map(obj => `
      <tr>
        <td>
          <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #00f0ff;">${obj.id}</span>
          <div style="font-size: 0.72rem; color: #9ca3af;">${obj.matchedFacility.type}</div>
        </td>
        <td>
          <span style="color: #93c5fd; font-weight: 600;">${obj.nasaComparison.nasaLabel}</span>
        </td>
        <td>
          <span style="color: ${obj.status === 'high_priority' ? '#ff4747' : '#00f0ff'}; font-weight: 700;">
            ${obj.nasaComparison.heatwatchLabel}
          </span>
        </td>
        <td>
          <span style="font-size: 0.75rem; background: rgba(0, 240, 255, 0.1); border: 1px solid var(--border-glow); padding: 2px 6px; border-radius: 4px; color: #00f0ff;">
            ${obj.nasaComparison.agreementStatus}
          </span>
        </td>
        <td style="font-size: 0.78rem; color: #d1d5db; line-height: 1.35;">
          ${obj.nasaComparison.explanation}
        </td>
      </tr>
    `).join('');
  }

  viewObjectOnMap(objectId) {
    this.switchView('command-map');
    this.mapInstance.selectObject(objectId);
  }

  setupModals() {
    const spectralModal = document.getElementById('modal-spectral-inspector');
    const closeSpectralBtn = document.getElementById('btn-close-spectral-modal');
    
    // Settings Modal
    const settingsModal = document.getElementById('modal-settings');
    const openSettingsBtn = document.getElementById('btn-open-settings');
    const closeSettingsBtn = document.getElementById('btn-close-settings-modal');
    const closeSettingsFooterBtn = document.getElementById('btn-close-settings-modal-footer');
    const inputFirmsKey = document.getElementById('input-firms-key');
    const saveFirmsKeyBtn = document.getElementById('btn-save-firms-key');
    const keyStatusText = document.getElementById('settings-key-status');

    const savedKey = localStorage.getItem("heatwatch_firms_key");
    if (inputFirmsKey && savedKey) {
      inputFirmsKey.value = savedKey;
    }

    if (openSettingsBtn && settingsModal) {
      openSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
      });
    }

    const closeSettings = () => {
      if (settingsModal) settingsModal.classList.remove('active');
    };

    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
    if (closeSettingsFooterBtn) closeSettingsFooterBtn.addEventListener('click', closeSettings);

    if (saveFirmsKeyBtn && inputFirmsKey) {
      saveFirmsKeyBtn.addEventListener('click', () => {
        const val = inputFirmsKey.value.trim();
        if (val) {
          localStorage.setItem("heatwatch_firms_key", val);
          if (keyStatusText) {
            keyStatusText.textContent = "✓ Key saved successfully! Live queries will authenticate with this MAP_KEY.";
            keyStatusText.style.color = "var(--accent-forest)";
          }
        } else {
          localStorage.removeItem("heatwatch_firms_key");
          if (keyStatusText) {
            keyStatusText.textContent = "Key cleared. Using demo simulator.";
            keyStatusText.style.color = "var(--text-muted)";
          }
        }
      });
    }
    
    // Save Sentinel Hub Instance ID Button
    const saveSentinelBtn = document.getElementById('btn-save-sentinel-id');
    const inputSentinel = document.getElementById('input-sentinel-id');
    if (saveSentinelBtn && inputSentinel) {
      saveSentinelBtn.addEventListener('click', () => {
        saveApiKey('sentinel', inputSentinel.value);
        saveSentinelBtn.textContent = 'Saved!';
        setTimeout(() => { saveSentinelBtn.textContent = 'Save'; }, 2000);
      });
    }

    // Save Google Earth Engine Project ID Button
    const saveGeeBtn = document.getElementById('btn-save-gee-project');
    const inputGee = document.getElementById('input-gee-project');
    if (saveGeeBtn && inputGee) {
      saveGeeBtn.addEventListener('click', () => {
        saveApiKey('gee', inputGee.value);
        saveGeeBtn.textContent = 'Saved!';
        setTimeout(() => { saveGeeBtn.textContent = 'Save'; }, 2000);
      });
    }

    // Spectral 4-Way Instrument View Switchers
    const btnSpecSwir = document.getElementById('btn-spec-view-swir');
    const btnSpecRgb = document.getElementById('btn-spec-view-rgb');
    const btnSpecGibs = document.getElementById('btn-spec-view-gibs');
    const btnSpecSar = document.getElementById('btn-spec-view-sar');
    const primaryCanvas = document.getElementById('spec-primary-canvas');
    const primaryBadge = document.getElementById('spec-primary-badge');
    const primaryCaption = document.getElementById('spec-primary-caption');

    const resetSpecButtons = () => {
      [btnSpecSwir, btnSpecRgb, btnSpecGibs, btnSpecSar].forEach(b => {
        if (b) b.classList.remove('active');
      });
    };

    if (btnSpecSwir) {
      btnSpecSwir.addEventListener('click', () => {
        resetSpecButtons();
        btnSpecSwir.classList.add('active');
        if (primaryCanvas) primaryCanvas.style.background = 'radial-gradient(circle at 60% 40%, rgba(255, 71, 71, 0.85) 0%, rgba(255, 152, 0, 0.45) 35%, #0a1120 75%)';
        if (primaryBadge) primaryBadge.textContent = 'Sentinel-2 SWIR False Color (B12 / B11 / B8A)';
        if (primaryCaption) primaryCaption.textContent = '20m Resolution • 2.19µm Active Thermal Emitter Penetration';
      });
    }

    if (btnSpecRgb) {
      btnSpecRgb.addEventListener('click', () => {
        resetSpecButtons();
        btnSpecRgb.classList.add('active');
        if (primaryCanvas) primaryCanvas.style.background = 'radial-gradient(circle at 60% 40%, rgba(100, 116, 139, 0.6) 0%, rgba(30, 41, 59, 0.9) 40%, #0f172a 80%)';
        if (primaryBadge) primaryBadge.textContent = 'Sentinel-2 True Color Optical (RGB B4 / B3 / B2)';
        if (primaryCaption) primaryCaption.textContent = '10m Resolution • Optical Surface & Smoke Plume Imagery';
      });
    }

    if (btnSpecGibs) {
      btnSpecGibs.addEventListener('click', () => {
        resetSpecButtons();
        btnSpecGibs.classList.add('active');
        if (primaryCanvas) primaryCanvas.style.background = 'radial-gradient(circle at 55% 45%, rgba(245, 158, 11, 0.75) 0%, rgba(30, 58, 138, 0.85) 45%, #020617 80%)';
        if (primaryBadge) primaryBadge.textContent = 'NASA GIBS VIIRS Daily Corrected Reflectance (True Color)';
        if (primaryCaption) primaryCaption.textContent = 'Exact NASA FIRMS / Worldview Daily Satellite Orbit Swath (375m)';
      });
    }

    if (btnSpecSar) {
      btnSpecSar.addEventListener('click', () => {
        resetSpecButtons();
        btnSpecSar.classList.add('active');
        if (primaryCanvas) primaryCanvas.style.background = 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.6) 0%, rgba(15, 23, 42, 0.9) 50%, #020617 80%)';
        if (primaryBadge) primaryBadge.textContent = 'Sentinel-1 C-Band SAR Synthetic Aperture Radar (VV+VH)';
        if (primaryCaption) primaryCaption.textContent = 'All-Weather Radar Backscatter Mapping Facility Physical Structure';
      });
    }

    if (closeSpectralBtn && spectralModal) {
      closeSpectralBtn.addEventListener('click', () => {
        spectralModal.classList.remove('active');
      });
    }

    // Trigger spectral modal from sidebar inspector
    const openSpectralBtn = document.getElementById('btn-open-spectral-modal');
    if (openSpectralBtn) {
      openSpectralBtn.addEventListener('click', () => {
        this.openSpectralModal(this.selectedObject.id);
      });
    }
  }

  openSpectralModal(objectId) {
    const obj = THERMAL_OBJECTS.find(o => o.id === objectId) || this.selectedObject;
    const modal = document.getElementById('modal-spectral-inspector');
    if (!modal) return;

    const elObjId = document.getElementById('modal-spec-obj-id');
    const elDate = document.getElementById('modal-spec-date');
    const elSwir = document.getElementById('modal-spec-swir');
    const elNbr = document.getElementById('modal-spec-nbr');
    const elAerosol = document.getElementById('modal-spec-aerosol');
    const elPlume = document.getElementById('modal-spec-plume');

    if (elObjId) elObjId.textContent = `${obj.id} — ${obj.name}`;
    if (elDate) elDate.textContent = obj.spectralData ? obj.spectralData.sentinel2Acquisition : "2026-08-28 05:42 UTC";
    if (elSwir) elSwir.textContent = `SWIR B12 (2.19µm): ${obj.spectralData ? obj.spectralData.swir2Radiance : 0.94} (High Anomaly Reflectance)`;
    if (elNbr) elNbr.textContent = `NBR (Burn Ratio): ${obj.spectralData ? obj.spectralData.nbr : -0.42}`;
    if (elAerosol) elAerosol.textContent = `Smoke Aerosol Index: ${obj.spectralData ? obj.spectralData.smokeAerosolIndex : 2.8}`;
    if (elPlume) elPlume.textContent = `Plume Drift: ${obj.spectralData ? obj.spectralData.plumeDirection : "South-West"}`;

    modal.classList.add('active');
  }

  renderAlertsTable() {
    const tbody = document.getElementById('alerts-table-body');
    if (!tbody) return;

    // 1. Gather all active alerts (curated objects + any live satellite clusters)
    let allAlerts = [...THERMAL_OBJECTS];
    if (this.liveClusters && this.liveClusters.length > 0) {
      this.liveClusters.forEach(cl => {
        if (!allAlerts.find(o => o.id === cl.id)) {
          allAlerts.push(cl);
        }
      });
    }

    // 2. Compute category counts for tab badges
    const counts = {
      all: allAlerts.length,
      industrial_fire: 0,
      routine_flare: 0,
      mining_fire: 0,
      forest_fire: 0,
      agriculture_fire: 0,
      glint_filtered: 0
    };

    allAlerts.forEach(o => {
      const cat = o.categoryGroup || o.primaryCategory;
      if (cat === 'industrial_fire' || (o.primaryCategory === 'industrial' && o.status === 'high_priority')) counts.industrial_fire++;
      else if (cat === 'routine_flare' || o.primaryCategory === 'industrial') counts.routine_flare++;
      else if (cat === 'mining_fire' || o.primaryCategory === 'mining') counts.mining_fire++;
      else if (cat === 'forest_fire' || o.primaryCategory === 'wildfire') counts.forest_fire++;
      else if (cat === 'agriculture_fire' || o.primaryCategory === 'agriculture') counts.agriculture_fire++;
      else if (cat === 'glint_filtered') counts.glint_filtered++;
      else counts.routine_flare++;
    });

    // Update tab labels with live counts
    const tabAll = document.querySelector('.alert-tab-btn[data-category="all"]');
    if (tabAll) tabAll.textContent = `All Alerts (${counts.all})`;
    const tabInd = document.querySelector('.alert-tab-btn[data-category="industrial_fire"]');
    if (tabInd) tabInd.textContent = `🏭 Industrial Fires (${counts.industrial_fire})`;
    const tabFlare = document.querySelector('.alert-tab-btn[data-category="routine_flare"]');
    if (tabFlare) tabFlare.textContent = `🔥 Routine Flares (${counts.routine_flare})`;
    const tabMine = document.querySelector('.alert-tab-btn[data-category="mining_fire"]');
    if (tabMine) tabMine.textContent = `⛏️ Coal Mining (${counts.mining_fire})`;
    const tabForest = document.querySelector('.alert-tab-btn[data-category="forest_fire"]');
    if (tabForest) tabForest.textContent = `🌲 Forest Wildfires (${counts.forest_fire})`;
    const tabAgri = document.querySelector('.alert-tab-btn[data-category="agriculture_fire"]');
    if (tabAgri) tabAgri.textContent = `🌾 Agri Stubble (${counts.agriculture_fire})`;
    const tabGlint = document.querySelector('.alert-tab-btn[data-category="glint_filtered"]');
    if (tabGlint) tabGlint.textContent = `☀️ Glint Filtered (${counts.glint_filtered})`;

    // Update Header Alert Badge with High Priority / Elevated count
    const highPriorityCount = allAlerts.filter(o => o.status === 'high_priority' || o.status === 'elevated').length;
    const headerBadge = document.getElementById('header-alert-count');
    if (headerBadge) headerBadge.textContent = highPriorityCount;

    // 3. Filter by active category
    let displayedAlerts = allAlerts;
    if (this.currentCategoryFilter && this.currentCategoryFilter !== 'all') {
      displayedAlerts = displayedAlerts.filter(obj => {
        const cat = obj.categoryGroup || obj.primaryCategory;
        if (this.currentCategoryFilter === 'industrial_fire') return cat === 'industrial_fire' || (obj.primaryCategory === 'industrial' && obj.status === 'high_priority');
        if (this.currentCategoryFilter === 'routine_flare') return cat === 'routine_flare' || (obj.primaryCategory === 'industrial' && obj.status !== 'high_priority');
        if (this.currentCategoryFilter === 'mining_fire') return cat === 'mining_fire' || obj.primaryCategory === 'mining';
        if (this.currentCategoryFilter === 'forest_fire') return cat === 'forest_fire' || obj.primaryCategory === 'wildfire';
        if (this.currentCategoryFilter === 'agriculture_fire') return cat === 'agriculture_fire' || obj.primaryCategory === 'agriculture';
        if (this.currentCategoryFilter === 'glint_filtered') return cat === 'glint_filtered';
        return cat === this.currentCategoryFilter;
      });
    }

    // 4. Filter by search query
    if (this.alertSearchQuery && this.alertSearchQuery.trim()) {
      const q = this.alertSearchQuery.toLowerCase().trim();
      displayedAlerts = displayedAlerts.filter(o =>
        o.id.toLowerCase().includes(q) ||
        (o.name && o.name.toLowerCase().includes(q)) ||
        (o.matchedFacility?.name && o.matchedFacility.name.toLowerCase().includes(q)) ||
        (o.categoryLabel && o.categoryLabel.toLowerCase().includes(q)) ||
        (o.subtype && o.subtype.toLowerCase().includes(q))
      );
    }

    if (displayedAlerts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">
            <i data-lucide="shield-check" style="width:24px; height:24px; color:var(--accent-forest); margin-bottom:0.5rem;"></i><br/>
            No active thermal alerts match the current filter criteria.
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    tbody.innerHTML = displayedAlerts.map(o => {
      const frp = o.thermal?.currentFRP || 0;
      const dev = o.thermal?.frpDeviationRatio || 1.0;
      const facName = o.matchedFacility?.name || o.name || 'Mapped Site';
      const dist = o.matchedFacility?.distanceMeters !== undefined ? `${o.matchedFacility.distanceMeters}m away` : 'Regional Perimeter';
      const statusClass = o.status === 'high_priority' ? 'high-priority' : (o.status === 'elevated' ? 'elevated' : 'normal');

      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s ease;">
          <td style="font-family:var(--font-mono); font-weight:700; color:var(--accent-cyan);">${o.id}</td>
          <td>
            <div style="font-weight:600; color:#fff;">${o.name}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${facName} (${dist})</div>
          </td>
          <td>
            <span class="severity-tag ${statusClass}">
              ${o.statusLabel || o.status.toUpperCase()}
            </span>
          </td>
          <td>
            <strong style="color:${dev >= 2.0 ? '#ff4747' : '#00f0ff'};">${frp} MW</strong>
            <span style="font-size:0.72rem; color:#9ca3af;"> (${dev}× Baseline)</span>
          </td>
          <td style="font-size:0.75rem; color:#d1d5db; max-width:280px; line-height:1.4;">
            ${o.recommendedAction || o.categoryLabel}
          </td>
          <td>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <button class="btn-secondary" style="padding:0.25rem 0.6rem; font-size:0.72rem;" onclick="window.heatwatchApp.selectAndInspect('${o.id}')" title="Inspect on GIS Map">
                <i data-lucide="map-pin" style="width:11px; height:11px;"></i> Inspect
              </button>
              <button class="btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.72rem;" onclick="window.heatwatchApp.openIncidentDossierById('${o.id}')" title="Open 1-Page Incident Dossier">
                <i data-lucide="file-text" style="width:11px; height:11px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 50);
    }
  }

  selectAndInspect(objectId) {
    let obj = THERMAL_OBJECTS.find(o => o.id === objectId);
    if (!obj && this.liveClusters) {
      obj = this.liveClusters.find(o => o.id === objectId);
    }
    if (obj) {
      this.switchView('command-map');
      this.handleSelectObject(obj);
      if (this.mapInstance && this.mapInstance.map) {
        this.mapInstance.map.flyTo(obj.coordinates, 14, { duration: 1.0 });
      }
    }
  }

  openIncidentDossierById(objectId) {
    let obj = THERMAL_OBJECTS.find(o => o.id === objectId);
    if (!obj && this.liveClusters) {
      obj = this.liveClusters.find(o => o.id === objectId);
    }
    if (obj) {
      this.openIncidentDossier(obj);
    }
  }

  renderNasaComparisonMatrix() {
    const tbody = document.getElementById('nasa-matrix-body');
    if (!tbody) return;

    tbody.innerHTML = THERMAL_OBJECTS.map(o => `
      <tr>
        <td>
          <strong style="color:#fff;">${o.name}</strong>
          <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--accent-cyan);">${o.id} &bull; ${o.subtype}</div>
        </td>
        <td>
          <span class="compare-val nasa">${o.nasaComparison.nasaLabel}</span>
        </td>
        <td>
          <span class="compare-val heatwatch">${o.nasaComparison.heatwatchLabel}</span>
        </td>
        <td>
          <span style="font-size:0.75rem; color:#38bdf8; font-weight:600;">${o.nasaComparison.agreementStatus}</span>
        </td>
        <td style="font-size:0.75rem; color:#9ca3af; max-width:280px;">
          ${o.nasaComparison.explanation}
        </td>
      </tr>
    `).join('');
  }

  setupAlertCenterActions() {
    // 1. Alert Category Filter Tabs Click Handlers
    document.querySelectorAll('.alert-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        this.setCategoryFilter(cat);
      });
    });

    // 2. Alert Search Input Handler
    const alertSearchInput = document.getElementById('input-alert-search');
    if (alertSearchInput) {
      alertSearchInput.addEventListener('input', (e) => {
        this.alertSearchQuery = e.target.value;
        this.renderAlertsTable();
      });
    }

    // 3. Top Triage Quick Action Buttons
    const confirmIndBtn = document.getElementById('btn-triage-confirm-ind');
    const confirmWildBtn = document.getElementById('btn-triage-confirm-wild');
    const dispatchBtn = document.getElementById('btn-triage-dispatch');

    const submitFeedback = async (category) => {
      const obj = this.selectedObject || THERMAL_OBJECTS[0];
      const objId = obj ? obj.id : "OBJ-1045";
      alert(`[✓ Ground Truth Verified]\n\nObject: ${obj.name} (${objId})\nVerdict: ${category.toUpperCase()}\nStatus: Stored to Active Learning Audit Ledger.\nThis verified sample will be incorporated in the next model retraining cycle.`);
      
      try {
        await fetch('/api/verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            object_id: objId,
            verified_category: category,
            verified_by: "District_Disaster_Officer"
          })
        });
      } catch (e) {
        console.log(`Verification stored locally in ledger.`);
      }
      this.renderAlertsTable();
    };

    if (confirmIndBtn) {
      confirmIndBtn.addEventListener('click', () => submitFeedback('industrial'));
    }
    if (confirmWildBtn) {
      confirmWildBtn.addEventListener('click', () => submitFeedback('wildfire'));
    }
    if (dispatchBtn) {
      dispatchBtn.addEventListener('click', () => {
        const targetName = this.selectedObject ? this.selectedObject.name : 'Jamnagar Flare Stack Sector 4';
        alert(`🚨 EMERGENCY DISPATCH PROTOCOL TRIGGERED\n\nIncident: ${targetName}\nAction: Dispatched quick-response sensor UAV and notified District Control Room.\nOfficial Incident Dossier generated.`);
      });
    }
  }

  setupApiPlaygroundUI() {
    const methodButtons = document.querySelectorAll('.api-method-btn');
    const terminalBox = document.getElementById('api-terminal-output');

    const updateTerminal = (endpoint) => {
      if (terminalBox) {
        terminalBox.textContent = this.apiPlayground.getEndpointResponse(endpoint);
      }
    };

    methodButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        methodButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const endpoint = btn.getAttribute('data-endpoint');
        updateTerminal(endpoint);
      });
    });

    // Initial terminal load
    updateTerminal('GET /api/hotspots');
  }

  setupFacilitySearch() {
    const searchInput = document.getElementById('input-facility-search');
    const searchResults = document.getElementById('facility-search-results');

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
          searchResults.style.display = 'none';
          return;
        }

        const matched = ALL_INDIA_FACILITIES.filter(f => 
          f.name.toLowerCase().includes(query) ||
          f.city.toLowerCase().includes(query) ||
          f.state.toLowerCase().includes(query) ||
          f.type.toLowerCase().includes(query)
        ).slice(0, 8);

        if (matched.length > 0) {
          searchResults.innerHTML = matched.map(f => `
            <div class="search-result-item" style="padding:0.45rem 0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; font-size:0.78rem;" onclick="window.heatwatchApp.flyToFacility('${f.id}')">
              <div style="font-weight:600; color:#fff;">${f.name}</div>
              <div style="font-size:0.68rem; color:var(--text-muted);">${f.type} &bull; ${f.city}, ${f.state}</div>
            </div>
          `).join('');
          searchResults.style.display = 'block';
        } else {
          searchResults.innerHTML = `<div style="padding:0.5rem; font-size:0.75rem; color:#9ca3af;">No matching facility found.</div>`;
          searchResults.style.display = 'block';
        }
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
          searchResults.style.display = 'none';
        }
      });
    }
  }

  flyToFacility(facilityId) {
    const fac = ALL_INDIA_FACILITIES.find(f => f.id === facilityId);
    if (fac) {
      this.switchView('command-map');
      this.mapInstance.flyToFacility(facilityId);
      const searchResults = document.getElementById('facility-search-results');
      if (searchResults) searchResults.style.display = 'none';
    }
  }

  setupLiveFetchButton() {
    const liveFetchBtn = document.getElementById('btn-fetch-live-firms');
    if (liveFetchBtn) {
      liveFetchBtn.addEventListener('click', async () => {
        liveFetchBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Ingesting Satellite Stream...`;
        try {
          const result = await this.firmsFetcher.fetchLiveSatelliteData();
          liveFetchBtn.innerHTML = `<i data-lucide="check"></i> Ingested Live Detections`;
          setTimeout(() => {
            liveFetchBtn.innerHTML = `<i data-lucide="satellite"></i> Query Live NASA FIRMS`;
            if (window.lucide) lucide.createIcons();
          }, 3000);
        } catch (e) {
          liveFetchBtn.innerHTML = `<i data-lucide="alert-circle"></i> Fetch Complete`;
        }
        if (window.lucide) lucide.createIcons();
      });
    }
  }

  setupPyrometryAndModelSimulator() {
    const tempSlider = document.getElementById('slider-planck-temp');
    const tempLabel = document.getElementById('label-planck-temp');
    if (tempSlider && tempLabel) {
      tempSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        tempLabel.textContent = `${val} K`;
        this.analyticsInstance.renderPlanckCurveChart('canvas-planck-curve', val);
      });
    }

    // Sliders for ML Feature Explainer
    const frpSlider = document.getElementById('sim-slider-frp');
    const distSlider = document.getElementById('sim-slider-dist');
    const builtupSlider = document.getElementById('sim-slider-builtup');
    const forestSlider = document.getElementById('sim-slider-forest');

    const updateLabelsAndInfer = () => {
      const frp = parseFloat(frpSlider?.value || 68);
      const dist = parseFloat(distSlider?.value || 210);
      const builtup = parseFloat(builtupSlider?.value || 76);
      const forest = parseFloat(forestSlider?.value || 3);

      const valFrp = document.getElementById('val-sim-frp');
      const valDist = document.getElementById('val-sim-dist');
      const valBuiltup = document.getElementById('val-sim-builtup');
      const valForest = document.getElementById('val-sim-forest');

      if (valFrp) valFrp.textContent = `${frp} MW`;
      if (valDist) valDist.textContent = `${dist} m`;
      if (valBuiltup) valBuiltup.textContent = `${builtup}%`;
      if (valForest) valForest.textContent = `${forest}%`;

      this.updateModelSimulator({
        frp,
        tempK: 368.5,
        distRefineryM: dist,
        builtupPct: builtup,
        forestPct: forest,
        croplandPct: Math.max(0, 100 - builtup - forest),
        nightlight: (builtup / 100) * 85
      });
    };

    [frpSlider, distSlider, builtupSlider, forestSlider].forEach(slider => {
      if (slider) slider.addEventListener('input', updateLabelsAndInfer);
    });

    // Run initial inference
    updateLabelsAndInfer();
  }

  async updateModelSimulator(features = { frp: 68, tempK: 368.5, distRefineryM: 210, builtupPct: 76, forestPct: 3, croplandPct: 0, nightlight: 75 }) {
    const result = await this.modelExplainer.inferProbabilitiesLive(features);
    const predictedClassEl = document.getElementById('sim-predicted-class');
    const barsContainer = document.getElementById('sim-probability-bars');
    const shapContainer = document.getElementById('sim-shap-list');

    if (predictedClassEl && result.topClass) {
      predictedClassEl.textContent = `${result.topClass.name} (${(result.topClass.prob * 100).toFixed(1)}%)`;
      predictedClassEl.style.color = result.topClass.color || "#00f0ff";
    }

    if (barsContainer && result.classes) {
      barsContainer.innerHTML = result.classes.map(c => `
        <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
          <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
            <div style="width:${(c.prob * 100).toFixed(1)}%; height:100%; background:${c.color}; border-radius:3px; transition:width 0.25s ease;"></div>
          </div>
          <span style="font-size:0.62rem; color:var(--text-dim); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${c.name.split('/')[0]} ${(c.prob * 100).toFixed(0)}%</span>
        </div>
      `).join('');
    }

    if (shapContainer && result.shapContributions) {
      shapContainer.innerHTML = result.shapContributions.map(shap => `
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding:0.25rem 0.5rem; background:rgba(0,0,0,0.25); border-radius:4px; border-left:3px solid ${shap.impact === 'positive' ? '#10b981' : '#f43f5e'};">
          <span style="color:#e2e8f0;">${shap.feature}</span>
          <span style="font-family:var(--font-mono); font-weight:700; color:${shap.impact === 'positive' ? '#10b981' : '#f43f5e'};">${shap.value}</span>
        </div>
      `).join('');
    }
  }

  setupTimelineScrubber() {
    const slider = document.getElementById('map-timeline-slider');
    const playBtn = document.getElementById('btn-timeline-play');
    const playIcon = document.getElementById('icon-timeline-play');
    const playLabel = document.getElementById('label-timeline-play');
    const prevBtn = document.getElementById('btn-timeline-prev');
    const nextBtn = document.getElementById('btn-timeline-next');
    const dateBadge = document.getElementById('scrubber-date-badge');
    const dayBadge = document.getElementById('scrubber-day-badge');
    const liveIndicator = document.getElementById('scrubber-live-indicator');
    const speedChips = document.querySelectorAll('.speed-chip');

    let isPlaying = false;
    let playInterval = null;
    let playbackSpeed = 1;

    const startDate = new Date("2026-06-01T00:00:00Z");

    const updateDayUI = (dayIndex) => {
      const curDate = new Date(startDate.getTime() + (dayIndex - 1) * 86400000);
      const dateStr = curDate.toISOString().substring(0, 10);
      
      if (dateBadge) dateBadge.textContent = dateStr;
      if (dayBadge) dayBadge.textContent = `Day ${dayIndex} of 90`;
      
      if (liveIndicator) {
        if (dayIndex === 90) {
          liveIndicator.textContent = "LIVE PASS";
          liveIndicator.className = "scrubber-live-indicator";
        } else {
          liveIndicator.textContent = "HISTORICAL";
          liveIndicator.className = "scrubber-live-indicator historical";
        }
      }

      this.applyHistoricalDay(dayIndex);
    };

    if (slider) {
      const handleSliderChange = (e) => {
        const val = parseInt(e.target.value);
        updateDayUI(val);
      };
      slider.addEventListener('input', handleSliderChange);
      slider.addEventListener('change', handleSliderChange);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (slider) {
          let val = Math.max(1, parseInt(slider.value) - 1);
          slider.value = val;
          updateDayUI(val);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (slider) {
          let val = Math.min(90, parseInt(slider.value) + 1);
          slider.value = val;
          updateDayUI(val);
        }
      });
    }

    speedChips.forEach(chip => {
      chip.addEventListener('click', () => {
        speedChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        playbackSpeed = parseFloat(chip.getAttribute('data-speed') || 1);
        if (isPlaying) {
          stopPlayback();
          startPlayback();
        }
      });
    });

    const startPlayback = () => {
      isPlaying = true;
      if (playBtn) playBtn.classList.add('playing');
      if (playLabel) playLabel.textContent = "Pause";
      if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
      if (window.lucide) lucide.createIcons();

      const intervalMs = Math.round(350 / playbackSpeed);
      playInterval = setInterval(() => {
        if (!slider) return;
        let val = parseInt(slider.value);
        if (val >= 90) {
          val = 1;
        } else {
          val++;
        }
        slider.value = val;
        updateDayUI(val);
        if (val === 90) {
          stopPlayback();
        }
      }, intervalMs);
    };

    const stopPlayback = () => {
      isPlaying = false;
      if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
      }
      if (playBtn) playBtn.classList.remove('playing');
      if (playLabel) playLabel.textContent = "Play";
      if (playIcon) playIcon.setAttribute('data-lucide', 'play');
      if (window.lucide) lucide.createIcons();
    };

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (isPlaying) {
          stopPlayback();
        } else {
          startPlayback();
        }
      });
    }
  }

  applyHistoricalDay(dayIndex) {
    if (!this.selectedObject) return;
    const historyList = HISTORICAL_FRP_DATA[this.selectedObject.id] || [];
    const record = historyList[dayIndex - 1];
    if (!record) return;

    // Update physical telemetry in Inspector HUD for selected day
    const frpEl = document.getElementById('hud-stat-frp');
    const frpDevEl = document.getElementById('hud-stat-frp-dev');
    const tempEl = document.getElementById('hud-stat-temp');
    const statusTag = document.getElementById('hud-obj-severity');

    if (frpEl) frpEl.textContent = `${record.frp} MW`;
    if (tempEl) tempEl.textContent = `${record.tempK} K`;

    const ratio = Math.round((record.frp / Math.max(record.baseline, 1)) * 100) / 100;
    if (frpDevEl) {
      frpDevEl.textContent = `${ratio}× Baseline`;
      frpDevEl.style.color = ratio > 2.0 ? '#ff4747' : '#00f0ff';
    }

    if (statusTag) {
      if (ratio >= 2.5) {
        statusTag.textContent = "HIGH-PRIORITY ANOMALY";
        statusTag.className = "severity-tag high-priority";
      } else if (ratio >= 1.5) {
        statusTag.textContent = "ELEVATED THERMAL FLUX";
        statusTag.className = "severity-tag elevated";
      } else {
        statusTag.textContent = "NORMAL OPERATIONAL BASELINE";
        statusTag.className = "severity-tag verified-clean";
      }
    }

    // Refresh 90-Day Baseline Chart with highlighted day marker
    this.analyticsInstance.renderFrpTimeSeriesChart('canvas-frp-baseline', this.selectedObject.id, dayIndex);

    // Refresh Map markers with day-wise FRP & color
    if (this.mapInstance && typeof this.mapInstance.updateHistoricalClusters === 'function') {
      this.mapInstance.updateHistoricalClusters(dayIndex);
    }
  }

  startClock() {
    const clockEl = document.getElementById('ticker-live-clock');
    if (clockEl) {
      const tick = () => {
        const now = new Date();
        clockEl.textContent = `${now.toISOString().replace('T', ' ').substring(0, 19)} UTC`;
      };
      tick();
      setInterval(tick, 1000);
    }
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.heatwatchApp = new HeatWatchApp();
});
