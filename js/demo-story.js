/**
 * HeatWatch - SIH Tour Presentation Engine (Presentation Layer Only)
 * 10-Step Interactive Guided Presentation for Smart India Hackathon Juries.
 * Reuses existing application components, map layers, analytics, and telemetry.
 */

import { DEMO_STORY_STEPS } from './data.js';

export class DemoStoryEngine {
  constructor(mapInstance, onStepChangeCallback, onTourEndCallback) {
    this.mapInstance = mapInstance;
    this.onStepChange = onStepChangeCallback;
    this.onTourEnd = onTourEndCallback;
    this.currentStepIndex = 0;
    this.isActive = false;
    this.totalSteps = DEMO_STORY_STEPS.length;
    this.previousViewTab = 'view-command-map';
    this.previousSpotlightEl = null;

    this.bindKeyboardShortcuts();
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.endTour();
      }
    });
  }

  startTour(initialStepIndex = 0) {
    this.isActive = true;
    this.currentStepIndex = initialStepIndex;

    // Record currently active view to restore cleanly later
    const activeSection = document.querySelector('.view-section.active');
    if (activeSection) {
      this.previousViewTab = activeSection.id;
    }

    document.body.classList.add('sih-tour-active');
    this.executeStep(this.currentStepIndex);
  }

  endTour() {
    this.isActive = false;
    document.body.classList.remove('sih-tour-active');
    this.clearSpotlight();

    // Restore user's previous view if needed
    if (this.onTourEnd) {
      this.onTourEnd(this.previousViewTab);
    }
  }

  restartTour() {
    this.startTour(0);
  }

  nextStep() {
    if (this.currentStepIndex < this.totalSteps - 1) {
      this.currentStepIndex++;
      this.executeStep(this.currentStepIndex);
    } else {
      // Completed last step, exit tour
      this.endTour();
    }
  }

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.executeStep(this.currentStepIndex);
    }
  }

  goToStep(stepNumber) {
    const targetIndex = stepNumber - 1;
    if (targetIndex >= 0 && targetIndex < this.totalSteps) {
      this.currentStepIndex = targetIndex;
      this.executeStep(this.currentStepIndex);
    }
  }

  executeStep(index) {
    const stepData = DEMO_STORY_STEPS[index];
    if (!stepData) return;

    this.clearSpotlight();

    // 1. Switch View Tab if specified
    if (stepData.viewTab) {
      let tabId = stepData.viewTab;
      if (tabId === 'view-analytics' || tabId === 'analytics-tab' || tabId === 'analytics') {
        tabId = 'view-analytics-tab';
      } else if (tabId === 'view-command-map' || tabId === 'command-map' || tabId === 'command-map-tab') {
        tabId = 'view-command-map';
      } else if (tabId === 'view-alerts-tab' || tabId === 'alerts-tab' || tabId === 'alerts') {
        tabId = 'view-alerts-tab';
      }

      document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
      const targetSec = document.getElementById(tabId);
      if (targetSec) targetSec.classList.add('active');

      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        const btnView = btn.getAttribute('data-view');
        if (btnView === tabId || btnView === stepData.viewTab || (tabId === 'view-analytics-tab' && (btnView === 'analytics-tab' || btnView === 'analytics'))) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // 2. Map actions (only if in map view)
    if (stepData.viewTab === 'view-command-map' && this.mapInstance) {
      if (this.mapInstance.setBaseMap) {
        this.mapInstance.setBaseMap('satellite');
        const basemapSelect = document.getElementById('select-basemap-style');
        if (basemapSelect) basemapSelect.value = 'satellite';
      }

      if (stepData.zoomCoordinates && stepData.zoomLevel) {
        this.mapInstance.map.flyTo(stepData.zoomCoordinates, stepData.zoomLevel, { duration: 0.9 });
      }

      if (stepData.mapLayers) {
        this.mapInstance.applyLayerPreset(stepData.mapLayers);
      }

      if (stepData.targetObjectId) {
        this.mapInstance.selectObject(stepData.targetObjectId, false);
      }
    }

    // 3. Highlight relevant DOM element
    if (stepData.spotlightTarget) {
      this.applySpotlight(stepData.spotlightTarget);
    }

    // 4. Notify UI renderer
    if (this.onStepChange) {
      this.onStepChange(stepData, index);
    }
  }

  applySpotlight(selector) {
    try {
      const el = document.querySelector(selector);
      if (el) {
        el.classList.add('tour-spotlight-active');
        this.previousSpotlightEl = el;
      }
    } catch (e) {
      console.warn('[SIH Tour] Spotlight selector error:', e);
    }
  }

  clearSpotlight() {
    if (this.previousSpotlightEl) {
      this.previousSpotlightEl.classList.remove('tour-spotlight-active');
      this.previousSpotlightEl = null;
    }
    document.querySelectorAll('.tour-spotlight-active').forEach(el => {
      el.classList.remove('tour-spotlight-active');
    });
  }
}
