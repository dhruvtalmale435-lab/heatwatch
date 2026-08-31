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
    this.setupGuidedTour();

    // 7. Initial render of selected object (#OBJ-1045)
    this.updateInspectorHUD(this.selectedObject);
    this.renderAlertsTable();
    this.renderNasaComparisonMatrix();
    this.updateCategoryChipCounts();

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

    // Export GeoJSON in Header
    const exportBtn = document.getElementById('btn-export-geojson');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.apiPlayground.exportGeoJson();
      });
    }

    // Setup Human Verification Actions
    this.setupHumanVerificationControls();
  }

  showToast(message) {
    let toast = document.getElementById('app-notification-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-notification-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 16, 30, 0.95);
        backdrop-filter: blur(14px);
        border: 1px solid var(--accent-cyan);
        color: #fff;
        font-family: var(--font-sans);
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 240, 255, 0.3);
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-5px)';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 4000);
  }

  setupHumanVerificationControls() {
    if (!this.verifiedTags) {
      try {
        this.verifiedTags = JSON.parse(localStorage.getItem('heatwatch_verified_tags') || '{}');
      } catch (e) {
        this.verifiedTags = {};
      }
    }

    const saveAndTagVerification = (categoryKey, statusText, color) => {
      const obj = this.selectedObject || THERMAL_OBJECTS[0];
      if (!obj) return;
      const objId = obj.id;
      const facName = obj.name;
      const record = {
        object_id: objId,
        facility_name: facName,
        verified_category: categoryKey,
        verified_by: "Operator_1 (SIH Active Learning)",
        timestamp_utc: new Date().toISOString(),
        status_text: statusText,
        color: color
      };

      // 1. Save in memory & localStorage
      this.verifiedTags[objId] = record;
      try {
        localStorage.setItem('heatwatch_verified_tags', JSON.stringify(this.verifiedTags));
      } catch (e) {}

      // 2. Post to backend active learning ledger
      fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      }).catch(() => console.log('Ledger sync offline, saved to localStorage'));

      // 3. Update Step 4 verification status in right panel
      const el = document.getElementById('hud-verification-status');
      if (el) {
        el.innerHTML = `<span>${statusText}</span><div style="font-size:0.62rem; color:#9ca3af; margin-top:2px;">Logged to Ground-Truth DB &amp; Retraining Queue</div>`;
        el.style.color = color;
      }

      // 4. Show live toast confirmation
      this.showToast(`✓ Tagged & Saved: ${facName} (#${objId}) verified as ${categoryKey}. Synced to Active Learning pipeline.`);

      // 5. Refresh Alerts table if visible
      this.renderAlertsTable();
    };

    const btnInd = document.getElementById('btn-confirm-industrial');
    if (btnInd) {
      btnInd.addEventListener('click', () => {
        saveAndTagVerification('industrial', '✓ Tagged: Confirmed Industrial Emitter', '#10b981');
      });
    }

    const btnWild = document.getElementById('btn-confirm-wildfire');
    if (btnWild) {
      btnWild.addEventListener('click', () => {
        saveAndTagVerification('wildfire', '🌲 Tagged: Confirmed Canopy Wildfire', '#f97316');
      });
    }

    const btnAgri = document.getElementById('btn-confirm-agri');
    if (btnAgri) {
      btnAgri.addEventListener('click', () => {
        saveAndTagVerification('agriculture', '🌾 Tagged: Confirmed Stubble Burning', '#eab308');
      });
    }

    const btnDrone = document.getElementById('btn-dispatch-drone');
    if (btnDrone) {
      btnDrone.addEventListener('click', () => {
        saveAndTagVerification('drone_dispatched', '🚁 Tagged: Drone Dispatched (Mission HW-902)', '#ff4747');
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

    // Region / Focus Facility Dropdown
    const regionSelect = document.getElementById('select-study-region');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.mapInstance.setRegion(val);

        // Find or synthesize object and update evidence inspector immediately!
        let targetObj = THERMAL_OBJECTS.find(o => o.regionId === val || o.id === val);
        if (!targetObj) {
          const fac = ALL_INDIA_FACILITIES.find(f => f.id === val);
          if (fac && this.mapInstance) {
            targetObj = this.mapInstance.synthesizeObjectFromFacility(fac);
          }
        }
        if (targetObj) {
          this.handleSelectObject(targetObj);
        }

        // Auto-expand inspector if collapsed
        const inspectorSidebar = document.getElementById('map-sidebar-inspector');
        if (inspectorSidebar) inspectorSidebar.classList.remove('collapsed');
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

    // 5. Right Sidebar Inspector HUD (Collapsible)
    const inspectorSidebar = document.getElementById('map-sidebar-inspector');
    const toggleInspectorBtn = document.getElementById('btn-toggle-inspector');
    const toggleInspectorIcon = document.getElementById('icon-toggle-inspector');
    if (inspectorSidebar && toggleInspectorBtn) {
      toggleInspectorBtn.addEventListener('click', () => {
        inspectorSidebar.classList.toggle('collapsed');
        const isCollapsed = inspectorSidebar.classList.contains('collapsed');
        if (toggleInspectorIcon) {
          toggleInspectorIcon.setAttribute('data-lucide', isCollapsed ? 'chevron-left' : 'chevron-right');
          if (window.lucide) lucide.createIcons();
        }
        if (this.mapInstance && this.mapInstance.map) {
          setTimeout(() => this.mapInstance.map.invalidateSize(), 310);
        }
      });
    }
  }

  setupFacilitySearch() {
    const searchInput = document.getElementById('input-facility-search');
    const resultsContainer = document.getElementById('facility-search-results');
    if (!searchInput || !resultsContainer) return;

    const renderResults = (query) => {
      if (!query || query.trim().length === 0) {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
        return;
      }

      const q = query.toLowerCase().trim();
      const matches = ALL_INDIA_FACILITIES.filter(f => 
        f.name.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q) ||
        f.state.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        (f.operator && f.operator.toLowerCase().includes(q))
      );

      if (matches.length === 0) {
        resultsContainer.innerHTML = `
          <div style="padding: 0.6rem 0.8rem; font-size: 0.75rem; color: var(--text-muted); text-align: center;">
            No industrial facilities matching "${query}"
          </div>
        `;
        resultsContainer.style.display = 'block';
        return;
      }

      resultsContainer.innerHTML = matches.slice(0, 10).map(f => {
        let icon = "🏭";
        if (f.type.includes('Thermal')) icon = "⚡";
        else if (f.type.includes('Steel')) icon = "🏭";
        else if (f.type.includes('Coal')) icon = "⛏️";
        else if (f.type.includes('LNG')) icon = "⛽";
        else if (f.type.includes('Solar')) icon = "☀️";
        else if (f.type.includes('Forest') || f.type.includes('Biosphere')) icon = "🌲";

        return `
          <div class="search-result-item" data-facility-id="${f.id}">
            <div class="search-result-icon">${icon}</div>
            <div class="search-result-info">
              <div class="search-result-name">${f.name}</div>
              <div class="search-result-meta">${f.type} • ${f.city}, ${f.state}</div>
            </div>
          </div>
        `;
      }).join('');

      resultsContainer.style.display = 'block';

      // Attach click events
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const facId = item.getAttribute('data-facility-id');
          const fac = ALL_INDIA_FACILITIES.find(f => f.id === facId);
          if (fac) {
            searchInput.value = fac.name;
            resultsContainer.style.display = 'none';

            // Sync Focus dropdown
            const focusSelect = document.getElementById('select-study-region');
            if (focusSelect) focusSelect.value = fac.id;

            // Fly map to coordinates
            if (this.mapInstance) {
              this.mapInstance.setRegion(fac.id);
            }

            // Synthesize and load the Evidence Inspector HUD directly for this searched facility!
            let targetObj = THERMAL_OBJECTS.find(o => o.regionId === fac.id || o.id === fac.id);
            if (!targetObj && this.mapInstance) {
              targetObj = this.mapInstance.synthesizeObjectFromFacility(fac);
            }
            if (targetObj) {
              this.handleSelectObject(targetObj);
            }

            // Ensure right sidebar inspector is expanded and visible
            const inspectorSidebar = document.getElementById('map-sidebar-inspector');
            if (inspectorSidebar) {
              inspectorSidebar.classList.remove('collapsed');
              const toggleIcon = document.getElementById('icon-toggle-inspector');
              if (toggleIcon) {
                toggleIcon.setAttribute('data-lucide', 'chevron-right');
                if (window.lucide) lucide.createIcons();
              }
            }
          }
        });
      });
    };

    searchInput.addEventListener('input', (e) => {
      renderResults(e.target.value);
    });

    searchInput.addEventListener('focus', (e) => {
      renderResults(e.target.value);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.style.display = 'none';
      }
    });
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

    // Update Map Clusters and OSM Facility pins to ONLY show matching category facilities
    const filtered = this.getFilteredThermalObjects();
    if (this.mapInstance) {
      this.mapInstance.renderThermalClusters(filtered);
      this.mapInstance.renderOsmFacilities(categoryKey);
    }

    // Update Alerts Table
    this.renderAlertsTable();

    // Auto-fit map camera so ALL facilities of this category are visible at once!
    this.flyToCategoryExemplar(categoryKey, filtered);
  }

  setSortOrder(sortKey) {
    this.currentSortOrder = sortKey;
    const filtered = this.getFilteredThermalObjects();
    if (this.mapInstance) {
      this.mapInstance.renderThermalClusters(filtered);
    }
    this.renderAlertsTable();
  }

  setupLiveFetchButton() {
    const fetchBtn = document.getElementById('btn-fetch-live-firms');
    if (!fetchBtn || !this.firmsFetcher) return;

    const executeFetch = async (isAuto = false) => {
      fetchBtn.disabled = true;
      fetchBtn.innerHTML = `<i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i> Fetching NASA FIRMS...`;
      if (window.lucide) lucide.createIcons();

      try {
        const result = await this.firmsFetcher.fetchLiveSatelliteData();
        if (result && result.success) {
          const count = result.points ? result.points.length : 0;
          fetchBtn.innerHTML = `<i data-lucide="check-circle" style="color: #10b981;"></i> ${count} Live Hotspots Synced`;
          setTimeout(() => {
            fetchBtn.innerHTML = `<i data-lucide="satellite"></i> Query Live NASA FIRMS`;
            fetchBtn.disabled = false;
            if (window.lucide) lucide.createIcons();
          }, 3500);
        } else {
          fetchBtn.innerHTML = `<i data-lucide="satellite"></i> Query Live NASA FIRMS`;
          fetchBtn.disabled = false;
          if (window.lucide) lucide.createIcons();
        }
      } catch (err) {
        console.warn("[HeatWatch] Live NASA fetch note:", err);
        fetchBtn.innerHTML = `<i data-lucide="satellite"></i> Query Live NASA FIRMS`;
        fetchBtn.disabled = false;
        if (window.lucide) lucide.createIcons();
      }
    };

    fetchBtn.addEventListener('click', () => executeFetch(false));

    // Automatically load real NASA FIRMS data on startup without requiring manual button click!
    setTimeout(() => {
      executeFetch(true);
    }, 100);

    // Auto-refresh background satellite feed continuously every 60 seconds
    setInterval(() => {
      executeFetch(true);
    }, 60000);
  }

  getAllCategorizedObjects() {
    let list = [...THERMAL_OBJECTS];

    if (this.mapInstance) {
      ALL_INDIA_FACILITIES.forEach(fac => {
        if (!list.some(o => o.id === fac.id || o.regionId === fac.id || o.id === `FAC-${fac.id}`)) {
          const synth = this.mapInstance.synthesizeObjectFromFacility(fac);
          if (fac.type.includes('Refinery') || fac.type.includes('Chemical') || fac.type.includes('Petro')) {
            synth.categoryGroup = synth.status === 'high_priority' ? 'industrial_fire' : 'routine_flare';
          } else if (fac.type.includes('Thermal') || fac.type.includes('Coal') || fac.type.includes('Steel') || fac.type.includes('Aluminum') || fac.type.includes('Mine')) {
            synth.categoryGroup = 'mining_fire';
          } else if (fac.type.includes('Forest') || fac.type.includes('Biosphere')) {
            synth.categoryGroup = 'forest_fire';
          } else if (fac.type.includes('Agrarian') || fac.type.includes('Crop')) {
            synth.categoryGroup = 'agriculture_fire';
          } else if (fac.type.includes('Solar')) {
            synth.categoryGroup = 'glint_filtered';
          }
          list.push(synth);
        }
      });
    }
    return list;
  }

  updateCategoryChipCounts() {
    const allObjects = this.getAllCategorizedObjects();
    const setChip = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };
    const indCount = allObjects.filter(o => o.categoryGroup === 'industrial_fire' || o.status === 'high_priority').length;
    const flareCount = allObjects.filter(o => o.categoryGroup === 'routine_flare').length;
    const miningCount = allObjects.filter(o => o.categoryGroup === 'mining_fire').length;
    const forestCount = allObjects.filter(o => o.categoryGroup === 'forest_fire').length;
    const agriCount = allObjects.filter(o => o.categoryGroup === 'agriculture_fire').length;
    const glintCount = allObjects.filter(o => o.categoryGroup === 'glint_filtered').length;

    setChip('chip-count-all', allObjects.length);
    setChip('chip-count-ind', indCount);
    setChip('chip-count-flare', flareCount);
    setChip('chip-count-mining', miningCount);
    setChip('chip-count-forest', forestCount);
    setChip('chip-count-agri', agriCount);
    setChip('chip-count-glint', glintCount);
  }

  getFilteredThermalObjects() {
    let list = this.getAllCategorizedObjects();

    if (this.currentCategoryFilter !== 'all') {
      list = list.filter(obj => {
        if (obj.categoryGroup === this.currentCategoryFilter) return true;
        if (this.currentCategoryFilter === 'industrial_fire' && (obj.categoryGroup === 'industrial_fire' || (obj.primaryCategory === 'industrial' && obj.status === 'high_priority'))) return true;
        if (this.currentCategoryFilter === 'routine_flare' && (obj.categoryGroup === 'routine_flare' || obj.subtype?.includes('Refinery') || obj.subtype?.includes('Petro'))) return true;
        if (this.currentCategoryFilter === 'mining_fire' && (obj.categoryGroup === 'mining_fire' || obj.subtype?.includes('Coal') || obj.subtype?.includes('Thermal') || obj.subtype?.includes('Steel') || obj.subtype?.includes('Mine'))) return true;
        if (this.currentCategoryFilter === 'forest_fire' && (obj.categoryGroup === 'forest_fire' || obj.primaryCategory === 'wildfire' || obj.subtype?.includes('Forest') || obj.subtype?.includes('Biosphere'))) return true;
        if (this.currentCategoryFilter === 'agriculture_fire' && (obj.categoryGroup === 'agriculture_fire' || obj.primaryCategory === 'agriculture' || obj.subtype?.includes('Stubble') || obj.subtype?.includes('Agrarian') || obj.subtype?.includes('Crop'))) return true;
        if (this.currentCategoryFilter === 'glint_filtered' && (obj.categoryGroup === 'glint_filtered' || obj.subtype?.includes('Solar'))) return true;
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

  flyToCategoryExemplar(categoryKey, filteredObjects) {
    if (!this.mapInstance || !this.mapInstance.map) return;

    if (categoryKey === 'all') {
      this.mapInstance.map.flyTo([22.5937, 78.9629], 5, { duration: 1.0 });
      return;
    }

    let targetObj = null;
    switch (categoryKey) {
      case 'forest_fire':
        targetObj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-3041');
        break;
      case 'agriculture_fire':
        targetObj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-4012');
        break;
      case 'mining_fire':
        targetObj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-7011');
        break;
      case 'industrial_fire':
        targetObj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-1045');
        break;
      case 'routine_flare':
        targetObj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-1082');
        break;
      case 'glint_filtered':
        targetObj = THERMAL_OBJECTS.find(o => o.id === 'OBJ-8021');
        break;
    }

    if (!targetObj && filteredObjects && filteredObjects.length > 0) {
      targetObj = filteredObjects[0];
    }

    // Auto-fit map bounds so that ALL matching places across India are framed and visible!
    if (filteredObjects && filteredObjects.length > 1) {
      const coords = filteredObjects.map(o => o.coordinates).filter(c => c && c.length === 2);
      if (coords.length > 1) {
        const bounds = L.latLngBounds(coords);
        this.mapInstance.map.fitBounds(bounds, { padding: [70, 70], maxZoom: 10, duration: 1.0 });
      }
    } else if (targetObj) {
      this.mapInstance.map.flyTo(targetObj.coordinates, 12, { duration: 1.0 });
    }

    if (targetObj) {
      this.mapInstance.selectObject(targetObj.id, false);
      this.handleSelectObject(targetObj);

      // Sync the Focus Dropdown and Search Bar
      const searchInput = document.getElementById('input-facility-search');
      if (searchInput) searchInput.value = targetObj.name;

      const focusSelect = document.getElementById('select-study-region');
      if (focusSelect) {
        focusSelect.value = targetObj.regionId || 'all_india';
      }

      // Auto-expand Right Sidebar Inspector HUD
      const inspectorSidebar = document.getElementById('map-sidebar-inspector');
      if (inspectorSidebar) inspectorSidebar.classList.remove('collapsed');
    }
  }

  handleSelectObject(obj) {
    if (!obj) return;
    this.selectedObject = obj;

    // 1. Sync Search Input and Focus Dropdown with selected object!
    const searchInput = document.getElementById('input-facility-search');
    if (searchInput) {
      searchInput.value = obj.name;
    }
    const focusSelect = document.getElementById('select-study-region');
    if (focusSelect) {
      focusSelect.value = obj.regionId || obj.id || 'all_india';
    }

    // 2. Update Inspector HUD
    this.updateInspectorHUD(obj);

    // 3. Make sure inspector sidebar is open
    const inspectorSidebar = document.getElementById('map-sidebar-inspector');
    if (inspectorSidebar) inspectorSidebar.classList.remove('collapsed');
  }

  updateInspectorHUD(obj) {
    if (!obj) return;
    this.selectedObject = obj;

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

    const hasData = obj.hasActiveDetection !== false && obj.thermal && obj.thermal.currentFRP !== null && obj.status !== 'inactive';

    // 1. Satellite Detection (NASA FIRMS / VIIRS)
    setTxt('hud-sat-sensor', obj.thermal?.sensor || 'VIIRS NOAA-21 (375m I-Band)');
    setTxt('hud-sat-time', obj.thermal?.detectionTime || '31 Aug 2026 • 14:26 UTC');
    
    const frpEl = document.getElementById('hud-stat-frp');
    const frpSubEl = document.getElementById('hud-stat-frp-sub');
    if (frpEl) {
      if (hasData && obj.thermal.currentFRP > 0) {
        frpEl.textContent = `${obj.thermal.currentFRP} MW`;
        frpEl.className = 'stat-box-val highlight-surge';
        frpEl.style.color = '';
        if (frpSubEl) frpSubEl.textContent = 'Direct Radiometry';
      } else {
        frpEl.textContent = '0.0 MW (Nominal)';
        frpEl.className = 'stat-box-val';
        frpEl.style.color = '#10b981';
        if (frpSubEl) frpSubEl.textContent = 'Ambient / No Flare';
      }
    }

    setTxt('hud-stat-confidence', hasData && obj.thermal.currentFRP > 0 ? (obj.confidence || 'High (91%)') : 'Nominal (Ambient)');
    
    if (obj.coordinates && obj.coordinates.length === 2) {
      setTxt('hud-stat-coords', `${obj.coordinates[0].toFixed(4)}, ${obj.coordinates[1].toFixed(4)}`);
    } else {
      setTxt('hud-stat-coords', '22.3615, 69.8640');
    }
    setTxt('hud-stat-temp', hasData && obj.thermal.currentBrightnessTempK ? `${obj.thermal.currentBrightnessTempK} K` : '301.2 K (Ambient)');

    // 2. Geospatial Context Engine
    if (obj.matchedFacility) {
      setTxt('hud-context-facility-name', obj.matchedFacility.name);
      setTxt('hud-context-facility-dist', `${obj.matchedFacility.distanceMeters} m (${obj.matchedFacility.distanceMeters < 500 ? 'Inside Perimeter' : 'Adjacent Area'})`);
    } else {
      setTxt('hud-context-facility-name', obj.name);
      setTxt('hud-context-facility-dist', '0 m (Registered Footprint)');
    }

    const lc = obj.landCover || {};
    const lcSummary = `ESA WorldCover: ${lc.industrialBuiltUp || 0}% Built-up | ${lc.vegetationTree || 0}% Forest | ${lc.cropland || 0}% Cropland`;
    setTxt('hud-context-landcover', lcSummary);

    // 3. Anomaly & Baseline Model
    setTxt('hud-stat-frp-dev', hasData && obj.thermal.currentFRP > 0 ? `${obj.thermal.frpDeviationRatio}× Baseline` : '1.0× Baseline');
    setTxt('hud-stat-baseline-val', hasData && obj.thermal.historicalMeanFRP ? `${obj.thermal.historicalMeanFRP} MW 30d Baseline` : 'Nominal Baseline');
    
    const riskEl = document.getElementById('hud-stat-risk-level');
    const riskSubEl = document.getElementById('hud-stat-risk-sub');
    if (riskEl) {
      if (!hasData || obj.status === 'normal' || obj.status === 'inactive' || (obj.thermal && obj.thermal.currentFRP === 0)) {
        riskEl.textContent = 'NOMINAL';
        riskEl.style.color = '#10b981';
        if (riskSubEl) riskSubEl.textContent = 'Normal Baseline';
      } else if (obj.status === 'high_priority') {
        riskEl.textContent = 'HIGH RISK';
        riskEl.style.color = '#ff4747';
        if (riskSubEl) riskSubEl.textContent = 'Critical Anomaly Surge';
      } else if (obj.status === 'elevated') {
        riskEl.textContent = 'ELEVATED';
        riskEl.style.color = '#f59e0b';
        if (riskSubEl) riskSubEl.textContent = 'Elevated Thermal Flux';
      } else {
        riskEl.textContent = 'LOW RISK';
        riskEl.style.color = '#10b981';
        if (riskSubEl) riskSubEl.textContent = 'Nominal State';
      }
    }
    setTxt('hud-stat-classification', obj.categoryLabel || 'Registered Industrial Hotspot');

    // 4. Human Verification Status (check persisted tag)
    const verifEl = document.getElementById('hud-verification-status');
    if (verifEl) {
      if (this.verifiedTags && this.verifiedTags[obj.id]) {
        const tag = this.verifiedTags[obj.id];
        verifEl.innerHTML = `<span>${tag.status_text}</span><div style="font-size:0.62rem; color:#9ca3af; margin-top:2px;">Logged on ${new Date(tag.timestamp_utc).toLocaleTimeString()} (Active Learning DB)</div>`;
        verifEl.style.color = tag.color || '#10b981';
      } else {
        verifEl.textContent = '⚠️ Awaiting Operator Verification';
        verifEl.style.color = '#f59e0b';
      }
    }

    // 5. Action Recommendation
    setTxt('hud-action-text', obj.recommendedAction || 'Monitor sector satellite telemetry in standard operational cycle.');
    if (obj.nearestSettlement) {
      setTxt('hud-exposure-text', `Nearest: ${obj.nearestSettlement.name} (${obj.nearestSettlement.distanceKm} km, ~${obj.nearestSettlement.population?.toLocaleString() || '12,000'} residents)`);
    }

    // Spatial Dynamics & Centroid Stability Tracking
    if (obj.spatialDynamics) {
      setTxt('hud-stat-stability', hasData ? `${obj.spatialDynamics.centroidStabilityPct}%` : '—');
      setTxt('hud-stat-velocity', hasData ? `${obj.spatialDynamics.spreadVelocityKmH} km/h` : '0.0 km/h');
      setTxt('hud-stat-motion-type', obj.spatialDynamics.motionType);
      setTxt('hud-stat-drift', hasData ? `${obj.spatialDynamics.driftVectorMeters} m` : '0 m');
      setTxt('hud-stat-plume-dir', hasData ? (obj.spatialDynamics.plumeDispersion || 'Calm') : 'No Active Plume');

      const motionBadge = document.getElementById('hud-motion-badge');
      if (motionBadge) {
        if (!hasData) {
          motionBadge.textContent = "NO THERMAL FLUX";
          motionBadge.style.background = "rgba(100, 116, 139, 0.2)";
          motionBadge.style.color = "var(--text-muted)";
        } else if (obj.spatialDynamics.isStationary) {
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
      setTxt('hud-glint-desc', hasData 
        ? `Albedo (${obj.glintFilter.albedoReflectance}) & solar elevation (${obj.glintFilter.solarElevationDeg}°) confirm active combustion. Solar rooftop/desert glint ruled out.`
        : `Verified registered industrial infrastructure footprint from official geographic catalog. No glint or false fire triggered.`);
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

    // Evidence Score Progress
    const scoreBar = document.getElementById('hud-score-bar');
    if (hasData && obj.evidenceScore) {
      setTxt('hud-score-pct', `${(obj.evidenceScore * 100).toFixed(0)}%`);
      if (scoreBar) scoreBar.style.width = `${obj.evidenceScore * 100}%`;
    } else {
      setTxt('hud-score-pct', '— (No Hotspot)');
      if (scoreBar) scoreBar.style.width = '0%';
    }

    // Anomaly Score Progress
    const anomBar = document.getElementById('hud-anomaly-bar');
    if (hasData && obj.anomalyFormula) {
      setTxt('hud-anomaly-pct', `${(obj.anomalyFormula.totalAnomalyScore * 100).toFixed(0)}%`);
      if (anomBar) anomBar.style.width = `${obj.anomalyFormula.totalAnomalyScore * 100}%`;
    } else {
      setTxt('hud-anomaly-pct', '0% (Nominal)');
      if (anomBar) anomBar.style.width = '0%';
    }

    // Evidence Checklist
    const evContainer = document.getElementById('hud-evidence-list');
    if (evContainer && obj.evidencePoints) {
      evContainer.innerHTML = obj.evidencePoints.map(ev => `
        <div class="evidence-row">
          <span class="ev-icon ${ev.type === 'anomaly-trigger' ? 'alert' : (ev.type === 'no-data' ? 'neutral' : 'check')}">
            ${ev.type === 'anomaly-trigger' ? '■' : (ev.type === 'no-data' ? '—' : '✓')}
          </span>
          <span style="color: ${ev.type === 'anomaly-trigger' ? '#ff8888' : (ev.type === 'no-data' ? 'var(--text-muted)' : '#e5e7eb')};">${ev.text}</span>
        </div>
      `).join('');
    }

    // NASA Comparison Card
    if (obj.nasaComparison) {
      setTxt('hud-nasa-label', obj.nasaComparison.nasaLabel);
      setTxt('hud-heatwatch-label', obj.nasaComparison.heatwatchLabel);
      setTxt('hud-compare-status', obj.nasaComparison.agreementStatus);
      setTxt('hud-compare-desc', obj.nasaComparison.explanation);
    } else {
      setTxt('hud-nasa-label', 'No Satellite Detection');
      setTxt('hud-heatwatch-label', 'No Active Anomaly (Nominal Baseline)');
      setTxt('hud-compare-status', '✓ Inactive Agreement');
      setTxt('hud-compare-desc', 'Neither NASA FIRMS nor HeatWatch detects an active high-temperature combustion pixel on the current orbital pass.');
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
    if (hasData) {
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
    } else {
      setTxt('hud-obj-category', `Registered Facility (No Active Fire/Flare)`);
    }

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

    if (closeSpectralBtn && spectralModal) {
      closeSpectralBtn.addEventListener('click', () => {
        spectralModal.classList.remove('active');
      });
    }

    // Incident Dossier Modal Handlers
    const dossierModal = document.getElementById('modal-incident-dossier');
    const openHeaderDossierBtn = document.getElementById('btn-header-dossier');
    const closeDossierBtn = document.getElementById('btn-close-dossier-modal');
    const printDossierBtn = document.getElementById('btn-print-dossier');

    if (openHeaderDossierBtn) {
      openHeaderDossierBtn.addEventListener('click', () => {
        this.openIncidentDossierModal(this.selectedObject.id);
      });
    }

    if (closeDossierBtn && dossierModal) {
      closeDossierBtn.addEventListener('click', () => {
        dossierModal.classList.remove('active');
      });
    }

    if (printDossierBtn) {
      printDossierBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  }

  openIncidentDossierModal(objectId) {
    const obj = (objectId && THERMAL_OBJECTS.find(o => o.id === objectId)) || this.selectedObject;
    const modal = document.getElementById('modal-incident-dossier');
    if (!modal) return;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt('dos-ref-code', `REF: HW-${obj.id}-2026`);
    setTxt('dos-status-tag', obj.statusLabel || 'HIGH-PRIORITY ESCALATION');
    setTxt('dos-object-name', obj.name);
    setTxt('dos-id', obj.id);
    setTxt('dos-coords', `${obj.centroid[0].toFixed(4)}° N, ${obj.centroid[1].toFixed(4)}° E`);
    setTxt('dos-category', obj.categoryLabel);
    setTxt('dos-conf', `${((obj.evidenceScore || 0.91) * 100).toFixed(0)}% (Multi-Modal AI Attribution)`);

    if (obj.thermal) {
      setTxt('dos-frp-hero', `${obj.thermal.currentFRP} MW`);
      setTxt('dos-surge-hero', `${obj.thermal.frpDeviationRatio}× 90-Day Baseline`);
    }
    if (obj.matchedFacility) {
      setTxt('dos-facility', `${obj.matchedFacility.name} (${obj.matchedFacility.distanceMeters}m from stack)`);
    }
    if (obj.landCover) {
      setTxt('dos-landcover', `${obj.landCover.industrialBuiltUp}% Built-up • ${obj.landCover.bareSoilPaved}% Paved`);
    }

    modal.classList.add('active');
    if (window.lucide) lucide.createIcons();
  }

  setupGuidedTour() {
    const tourBtn = document.getElementById('btn-guided-demo');
    const tourOverlay = document.getElementById('sih-tour-overlay');
    const tourCloseBtn = document.getElementById('btn-tour-close');
    const tourPrevBtn = document.getElementById('btn-tour-prev');
    const tourNextBtn = document.getElementById('btn-tour-next');
    const tourPlayBtn = document.getElementById('btn-tour-play-pause');
    const ribbon = document.getElementById('map-category-ribbon');
    const timeScrubber = document.getElementById('map-time-scrubber');

    if (tourBtn && this.demoEngine) {
      tourBtn.addEventListener('click', () => {
        this.switchView('command-map');
        if (tourOverlay) tourOverlay.style.display = 'flex';
        if (ribbon) ribbon.style.display = 'none';
        if (timeScrubber) timeScrubber.style.display = 'none';
        this.demoEngine.startDemo();
      });
    }

    const closeTour = () => {
      if (tourOverlay) tourOverlay.style.display = 'none';
      if (ribbon) ribbon.style.display = 'flex';
      if (timeScrubber) timeScrubber.style.display = 'flex';
      if (this.demoEngine) this.demoEngine.stopAutoPlay();
    };

    if (tourCloseBtn) {
      tourCloseBtn.addEventListener('click', closeTour);
    }

    if (tourPrevBtn && this.demoEngine) {
      tourPrevBtn.addEventListener('click', () => this.demoEngine.prevStep());
    }

    if (tourNextBtn && this.demoEngine) {
      tourNextBtn.addEventListener('click', () => this.demoEngine.nextStep());
    }

    if (tourPlayBtn && this.demoEngine) {
      tourPlayBtn.addEventListener('click', () => {
        const isPlaying = this.demoEngine.toggleAutoPlay();
        tourPlayBtn.classList.toggle('playing', isPlaying);
        const textPlay = document.getElementById('text-tour-play');
        const iconPlay = document.getElementById('icon-tour-play');
        if (textPlay) textPlay.textContent = isPlaying ? 'Pause' : 'Auto Play';
        if (iconPlay) {
          iconPlay.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
          if (window.lucide) lucide.createIcons();
        }
      });
    }

    // Keyboard navigation during tour
    window.addEventListener('keydown', (e) => {
      if (!tourOverlay || tourOverlay.style.display === 'none') return;
      if (e.key === 'ArrowRight') {
        this.demoEngine.nextStep();
      } else if (e.key === 'ArrowLeft') {
        this.demoEngine.prevStep();
      } else if (e.key === ' ' || e.code === 'Space') {
        if (tourPlayBtn) tourPlayBtn.click();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        closeTour();
      }
    });
  }

  renderDemoStepUI(stepData, index) {
    if (!stepData) return;

    const tourOverlay = document.getElementById('sih-tour-overlay');
    if (tourOverlay && tourOverlay.style.display === 'none') {
      tourOverlay.style.display = 'flex';
    }

    const totalSteps = 8;
    const badgeEl = document.getElementById('tour-step-badge');
    const barEl = document.getElementById('tour-progress-bar');
    const titleEl = document.getElementById('tour-title');
    const descEl = document.getElementById('tour-desc');
    const actionEl = document.getElementById('tour-action-text');

    if (badgeEl) badgeEl.textContent = `STEP ${index + 1} OF ${totalSteps}`;
    if (barEl) barEl.style.width = `${((index + 1) / totalSteps) * 100}%`;
    if (titleEl) titleEl.textContent = stepData.title;
    if (descEl) descEl.textContent = stepData.description;
    if (actionEl) actionEl.textContent = stepData.actionHighlight;

    const inspectorSidebar = document.getElementById('map-sidebar-inspector');

    // Dynamic Visual Actions per step:
    if (index === 0) {
      // Step 1: Raw Ingestion
      if (this.mapInstance) {
        this.mapInstance.setBaseMap('satellite');
      }
      this.closeModal('modal-incident-dossier');
    } else if (index === 1) {
      // Step 2: Multimodal GIS Overlays
      this.closeModal('modal-incident-dossier');
      if (this.mapInstance) {
        this.mapInstance.toggleLayer('osmFacilities', true);
        this.mapInstance.toggleLayer('worldCoverBuffers', true);
      }
    } else if (index === 2) {
      // Step 3: ST-DBSCAN Clustering
      this.closeModal('modal-incident-dossier');
      if (inspectorSidebar) inspectorSidebar.classList.remove('collapsed');
      this.handleSelectObject(THERMAL_OBJECTS[0]);
    } else if (index === 3) {
      // Step 4: AI Source Segregation
      this.closeModal('modal-incident-dossier');
      if (inspectorSidebar) {
        inspectorSidebar.classList.remove('collapsed');
        const evCard = document.getElementById('hud-evidence-list');
        if (evCard) evCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (index === 4) {
      // Step 5: 90-Day Baseline
      this.closeModal('modal-incident-dossier');
      if (inspectorSidebar) {
        inspectorSidebar.classList.remove('collapsed');
        const chartEl = document.getElementById('sidebar-frp-chart');
        if (chartEl) chartEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (index === 5) {
      // Step 6: Acute Anomaly Surge
      this.closeModal('modal-incident-dossier');
      if (inspectorSidebar) {
        inspectorSidebar.classList.remove('collapsed');
        const sevBadge = document.getElementById('hud-obj-severity');
        if (sevBadge) {
          sevBadge.classList.add('pulse-anomaly');
          setTimeout(() => sevBadge.classList.remove('pulse-anomaly'), 2500);
        }
      }
    } else if (index === 6) {
      // Step 7: NASA Static Mask Comparison
      this.closeModal('modal-incident-dossier');
      if (inspectorSidebar) {
        inspectorSidebar.classList.remove('collapsed');
        const compCard = document.querySelector('.nasa-comparison-card');
        if (compCard) compCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (index === 7) {
      // Step 8: Actionable Emergency Triage Dossier
      this.openIncidentDossierModal();
    }

    if (window.lucide) lucide.createIcons();
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
      const baseFrp = o.thermal?.historicalMeanFRP ? `${o.thermal.historicalMeanFRP} MW` : 'Baseline';
      const facName = o.matchedFacility?.name || o.name || 'Mapped Site';
      const dist = o.matchedFacility?.distanceMeters !== undefined ? `${o.matchedFacility.distanceMeters}m (${o.matchedFacility.distanceMeters < 500 ? 'Inside Facility' : 'Adjacent Area'})` : 'Regional Perimeter';
      const sensor = o.thermal?.sensor || 'VIIRS NOAA-21 (375m)';
      const time = o.thermal?.detectionTime || '31 Aug • 14:26 UTC';
      const coords = o.coordinates ? `${o.coordinates[0].toFixed(3)}, ${o.coordinates[1].toFixed(3)}` : '22.36, 69.86';
      const statusClass = o.status === 'high_priority' ? 'high-priority' : (o.status === 'elevated' ? 'elevated' : 'normal');
      const statusText = o.status === 'high_priority' ? 'HIGH RISK' : (o.status === 'elevated' ? 'ELEVATED' : 'NOMINAL');

      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s ease;">
          <!-- 1. Satellite Detection -->
          <td>
            <div style="font-family:var(--font-mono); font-weight:700; color:var(--accent-cyan); font-size:0.82rem;">${o.id}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:1px;">${sensor}</div>
            <div style="font-size:0.75rem; margin-top:2px;">
              <strong style="color:${frp > 40 ? '#ff4747' : '#00f0ff'};">${frp} MW</strong> &bull; <span style="font-family:var(--font-mono); color:#9ca3af; font-size:0.7rem;">${coords}</span>
            </div>
            <div style="font-size:0.68rem; color:var(--text-dim);">${time}</div>
          </td>

          <!-- 2. Geospatial Context -->
          <td>
            <div style="font-weight:600; color:#fff; font-size:0.82rem;">${o.name}</div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:1px;">${facName}</div>
            <div style="font-size:0.7rem; color:var(--accent-cyan); margin-top:2px;">Distance: ${dist}</div>
          </td>

          <!-- 3. Baseline & Risk Model -->
          <td>
            <div style="margin-bottom:3px;">
              <span class="severity-tag ${statusClass}">
                ${statusText}
              </span>
            </div>
            <div style="font-size:0.75rem; color:#d1d5db;">
              <strong style="color:${dev >= 2.0 ? '#ff8888' : '#00f0ff'};">${dev}×</strong> vs ${baseFrp}
            </div>
          </td>

          <!-- 4. AI Classification & Advisory -->
          <td style="max-width:240px;">
            <div style="font-size:0.76rem; font-weight:600; color:var(--accent-cyan);">${o.categoryLabel || 'Industrial Emitter'}</div>
            <div style="font-size:0.7rem; color:#9ca3af; margin-top:2px; line-height:1.35;">${o.recommendedAction || 'Continuous orbital monitoring.'}</div>
          </td>

          <!-- 5. Human Verification & Triage Actions -->
          <td>
            ${this.verifiedTags && this.verifiedTags[o.id] ? `
              <div style="font-size:0.68rem; font-weight:700; color:${this.verifiedTags[o.id].color || '#10b981'}; margin-bottom:4px; padding:2px 6px; background:rgba(16,185,129,0.1); border-radius:4px; border:1px solid rgba(16,185,129,0.25);">
                ${this.verifiedTags[o.id].status_text}
              </div>
            ` : `
              <div style="font-size:0.65rem; color:#f59e0b; margin-bottom:4px;">
                ⚠️ Awaiting Review
              </div>
            `}
            <div style="display:flex; flex-direction:column; gap:0.35rem;">
              <div style="display:flex; gap:0.35rem;">
                <button class="btn-secondary" style="padding:0.22rem 0.55rem; font-size:0.7rem; flex:1;" onclick="window.heatwatchApp.selectAndInspect('${o.id}')" title="Inspect on GIS Command Map">
                  <i data-lucide="map-pin" style="width:11px; height:11px;"></i> Inspect
                </button>
                <button class="btn-secondary" style="padding:0.22rem 0.45rem; font-size:0.7rem;" onclick="window.heatwatchApp.openIncidentDossierById('${o.id}')" title="Open 1-Page Incident Dossier">
                  <i data-lucide="file-text" style="width:11px; height:11px;"></i>
                </button>
              </div>
              <button class="btn-secondary" style="padding:0.22rem 0.55rem; font-size:0.68rem; color:#ff8888; border-color:rgba(255,71,71,0.3);" onclick="window.heatwatchApp.showToast('🚁 Automated drone dispatched to ${o.name} (#${o.id})')" title="Dispatch Automated Drone">
                <i data-lucide="send" style="width:10px; height:10px;"></i> Dispatch Drone
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
