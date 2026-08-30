/**
 * HeatWatch - Interactive Guided Presentation Demo Engine
 * Implements the killer 8-step SIH demonstration workflow (Document Page 12 & 104)
 */

import { DEMO_STORY_STEPS } from './data.js';

export class DemoStoryEngine {
  constructor(mapInstance, onStepChangeCallback) {
    this.mapInstance = mapInstance;
    this.onStepChange = onStepChangeCallback;
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.autoPlayTimer = null;
    this.totalSteps = DEMO_STORY_STEPS.length;
  }

  startDemo() {
    this.currentStepIndex = 0;
    this.executeStep(this.currentStepIndex);
  }

  nextStep() {
    if (this.currentStepIndex < this.totalSteps - 1) {
      this.currentStepIndex++;
      this.executeStep(this.currentStepIndex);
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

    // Apply map zoom and layer configurations
    if (this.mapInstance) {
      this.mapInstance.map.flyTo(stepData.zoomCoordinates, stepData.zoomLevel, { duration: 1.0 });
      this.mapInstance.applyLayerPreset(stepData.mapLayers);
      this.mapInstance.selectObject(stepData.targetObjectId, false);
    }

    if (this.onStepChange) {
      this.onStepChange(stepData, index);
    }
  }

  toggleAutoPlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.autoPlayTimer = setInterval(() => {
        if (this.currentStepIndex < this.totalSteps - 1) {
          this.nextStep();
        } else {
          this.stopAutoPlay();
        }
      }, 7000);
    } else {
      this.stopAutoPlay();
    }
    return this.isPlaying;
  }

  stopAutoPlay() {
    this.isPlaying = false;
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }
}
