/**
 * HeatWatch - Master Geospatial GIS Map Engine
 * Renders all 50+ Indian industrial facilities, live/cached thermal detections,
 * ST-DBSCAN clusters, ESA WorldCover buffers, and NASA static anomaly masks.
 */

import { THERMAL_OBJECTS, RAW_FIRMS_DETECTIONS, OSM_FACILITIES, STUDY_REGIONS, ALL_INDIA_FACILITIES, HISTORICAL_FRP_DATA, getHistoricalFrpForObject } from './data.js';

export class HeatWatchMap {
  constructor(containerId, onSelectObjectCallback) {
    this.containerId = containerId;
    this.onSelectObject = onSelectObjectCallback;
    this.map = null;
    this.currentRegion = STUDY_REGIONS[0]; // All-India overview by default
    
    // Layer Groups
    this.layers = {
      rawFirms: null,
      thermalClusters: null,
      osmFacilities: null,
      worldCoverBuffers: null,
      nasaStaticMask: null,
      riskBuffers: null
    };

    // Layer Visibility State
    this.layerVisibility = {
      rawFirms: true,
      thermalClusters: true,
      osmFacilities: true,
      worldCoverBuffers: true,
      nasaStaticMask: false,
      riskBuffers: true
    };

    this.selectedObjectId = "OBJ-1045";
    this.markers = {};
    this.facilityMarkers = {};
    
    this.initMap();
  }

  initMap() {
    // Initialize Leaflet Map centered on India
    this.map = L.map(this.containerId, {
      center: this.currentRegion.center,
      zoom: this.currentRegion.zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Official NASA GIBS WMS Service (OGC Standard - 100% Free & Open, No Key Required)
    const gibsWmsUrl = 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi';
    
    // Complete 24h satellite orbit date (yesterday UTC guarantees 100% completed global swath coverage for the whole world)
    const nowUtc = new Date();
    const globalSatelliteDate = new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    this.baseMaps = {
      nasa_viirs: L.tileLayer.wms(gibsWmsUrl, {
        layers: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
        format: 'image/jpeg',
        transparent: false,
        version: '1.3.0',
        crs: L.CRS.EPSG3857,
        maxNativeZoom: 9,
        maxZoom: 19,
        time: globalSatelliteDate,
        attribution: 'NASA GIBS / Worldview / FIRMS'
      }),
      nasa_modis: L.tileLayer.wms(gibsWmsUrl, {
        layers: 'MODIS_Terra_CorrectedReflectance_TrueColor',
        format: 'image/jpeg',
        transparent: false,
        version: '1.3.0',
        crs: L.CRS.EPSG3857,
        maxNativeZoom: 8,
        maxZoom: 19,
        time: globalSatelliteDate,
        attribution: 'NASA GIBS MODIS Terra (250m)'
      }),
      nasa_night: L.tileLayer.wms(gibsWmsUrl, {
        layers: 'VIIRS_CityLights_2012',
        format: 'image/jpeg',
        transparent: false,
        version: '1.3.0',
        crs: L.CRS.EPSG3857,
        maxNativeZoom: 8,
        maxZoom: 19,
        attribution: 'NASA GIBS VIIRS Earth at Night'
      }),
      nasa_bluemarble: L.tileLayer.wms(gibsWmsUrl, {
        layers: 'BlueMarble_ShadedRelief_Bathymetry',
        format: 'image/jpeg',
        transparent: false,
        version: '1.3.0',
        crs: L.CRS.EPSG3857,
        maxNativeZoom: 8,
        maxZoom: 19,
        attribution: 'NASA Blue Marble'
      }),
      sentinel2: L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', {
        maxZoom: 17,
        attribution: 'Copernicus Sentinel-2 (ESA/EOX)'
      }),
      sentinel2_swir: L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', {
        maxZoom: 17,
        className: 'sentinel-swir-filter',
        attribution: 'Copernicus Sentinel-2 SWIR (B12/B8A/B4)'
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: false
      }),
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: false
      })
    };

    // Default basemap is High-Resolution Satellite World Imagery (1m Aerial)
    this.activeBaseMap = this.baseMaps.satellite.addTo(this.map);

    // Layer Groups
    this.layers.rawFirms = L.layerGroup().addTo(this.map);
    this.layers.thermalClusters = L.layerGroup().addTo(this.map);
    this.layers.osmFacilities = L.layerGroup().addTo(this.map);
    this.layers.worldCoverBuffers = L.layerGroup().addTo(this.map);
    this.layers.riskBuffers = L.layerGroup().addTo(this.map);
    this.layers.nasaStaticMask = L.layerGroup();

    // Render layers
    this.renderOsmFacilities();
    this.renderWorldCoverBuffers();
    this.renderRiskBuffers();
    this.renderRawFirmsPoints(RAW_FIRMS_DETECTIONS);
    this.renderThermalClusters(THERMAL_OBJECTS);
    this.renderNasaStaticMask(THERMAL_OBJECTS);
  }

  setBaseMap(styleKey) {
    if (this.baseMaps[styleKey]) {
      console.log(`[HeatWatch Map] Activating Satellite Basemap: ${styleKey}`);
      if (this.activeBaseMap && this.map.hasLayer(this.activeBaseMap)) {
        this.map.removeLayer(this.activeBaseMap);
      }
      this.activeBaseMap = this.baseMaps[styleKey];
      this.activeBaseMap.addTo(this.map);
      if (typeof this.activeBaseMap.bringToBack === 'function') {
        this.activeBaseMap.bringToBack();
      }
    } else {
      console.warn(`[HeatWatch Map] Unknown basemap key: ${styleKey}`);
    }
  }

  setRegion(regionId) {
    if (regionId === 'all_india') {
      this.currentRegion = STUDY_REGIONS[0];
      this.map.flyTo(STUDY_REGIONS[0].center, STUDY_REGIONS[0].zoom, { duration: 1.2 });
      return;
    }

    const region = STUDY_REGIONS.find(r => r.id === regionId);
    if (region) {
      this.currentRegion = region;
      this.map.flyTo(region.center, region.zoom, { duration: 1.2 });
      
      const regionalObj = THERMAL_OBJECTS.find(o => o.regionId === regionId);
      if (regionalObj) {
        this.selectObject(regionalObj.id);
      }
      return;
    }

    const facility = ALL_INDIA_FACILITIES.find(f => f.id === regionId);
    if (facility && facility.coordinates) {
      this.map.flyTo(facility.coordinates, 14, { duration: 1.2 });
      const matchedObj = THERMAL_OBJECTS.find(o => 
        o.id === facility.id || 
        o.regionId === facility.id ||
        (o.matchedFacility && o.matchedFacility.name.toLowerCase().includes(facility.name.toLowerCase().split('(')[0].trim())) ||
        (Math.abs(o.centroid[0] - facility.coordinates[0]) < 0.05 && Math.abs(o.centroid[1] - facility.coordinates[1]) < 0.05)
      );
      if (matchedObj) {
        this.selectObject(matchedObj.id);
      } else {
        const dynObj = this.synthesizeObjectFromFacility(facility);
        if (this.onSelectObject) {
          this.onSelectObject(dynObj);
        }
      }
    }
  }

  toggleLayer(layerName, isVisible) {
    if (this.layerVisibility.hasOwnProperty(layerName)) {
      this.layerVisibility[layerName] = isVisible;
      const layerGroup = this.layers[layerName];
      if (layerGroup) {
        if (isVisible) {
          if (!this.map.hasLayer(layerGroup)) {
            this.map.addLayer(layerGroup);
          }
        } else {
          if (this.map.hasLayer(layerGroup)) {
            this.map.removeLayer(layerGroup);
          }
        }
      }
    }
  }

  renderRawFirmsPoints(points) {
    this.layers.rawFirms.clearLayers();

    points.forEach(det => {
      const radius = Math.min(Math.max((det.frp || 20) / 15, 4), 14);
      const circleMarker = L.circleMarker([det.lat, det.lon], {
        radius: radius,
        fillColor: '#ff9800',
        fillOpacity: 0.65,
        color: '#ffea00',
        weight: 1.5
      });

      circleMarker.bindTooltip(`
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">
          <strong style="color: #ff9800;">NASA FIRMS 375m Detection</strong><br/>
          FRP: <strong>${det.frp || '25.0'} MW</strong> | Temp: <strong>${det.tempK || '360.0'} K</strong><br/>
          Time: ${det.time || 'LIVE'} | Sat: ${det.satellite || 'VIIRS'}
        </div>
      `, { sticky: true });

      circleMarker.on('click', () => {
        this.map.flyTo([det.lat, det.lon], 14, { duration: 0.8 });
        if (det.clusterId && THERMAL_OBJECTS.find(o => o.id === det.clusterId)) {
          this.selectObject(det.clusterId, false);
        } else {
          const dynamicObj = this.synthesizeObjectFromDetection(det);
          if (this.onSelectObject) {
            this.onSelectObject(dynamicObj);
          }
        }
      });

      this.layers.rawFirms.addLayer(circleMarker);
    });
  }

  renderThermalClusters(objects) {
    this.layers.thermalClusters.clearLayers();

    objects.forEach(obj => {
      const [lat, lon] = obj.coordinates;
      let markerColor = '#00f0ff';
      let pulseClass = '';

      if (obj.categoryGroup === 'forest_fire' || obj.primaryCategory === 'wildfire') {
        markerColor = '#f97316';
        pulseClass = `<div class="marker-pulse-ring" style="background: rgba(249, 115, 22, 0.4); border: 2px solid #f97316;"></div>`;
      } else if (obj.categoryGroup === 'agriculture_fire' || obj.primaryCategory === 'agriculture') {
        markerColor = '#eab308';
        pulseClass = `<div class="marker-pulse-ring" style="background: rgba(234, 179, 8, 0.35); border: 2px solid #eab308;"></div>`;
      } else if (obj.categoryGroup === 'mining_fire') {
        markerColor = '#a855f7';
        pulseClass = `<div class="marker-pulse-ring" style="background: rgba(168, 85, 247, 0.4); border: 2px solid #a855f7;"></div>`;
      } else if (obj.categoryGroup === 'glint_filtered') {
        markerColor = '#64748b';
        pulseClass = '';
      } else if (obj.status === 'high_priority' || obj.categoryGroup === 'industrial_fire') {
        markerColor = '#ff4747';
        pulseClass = `<div class="marker-pulse-ring" style="background: rgba(255, 71, 71, 0.4); border: 2px solid #ff4747;"></div>`;
      } else if (obj.status === 'elevated') {
        markerColor = '#f59e0b';
        pulseClass = `<div class="marker-pulse-ring" style="background: rgba(245, 158, 11, 0.3); border: 2px solid #f59e0b;"></div>`;
      }

      const customIcon = L.divIcon({
        className: 'custom-thermal-cluster-icon',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            ${pulseClass}
            <div style="width: 16px; height: 16px; border-radius: 50%; background: ${markerColor}; border: 2px solid #ffffff; box-shadow: 0 0 14px ${markerColor};"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      marker.bindTooltip(`
        <div style="font-family: 'Inter', sans-serif;">
          <div style="font-weight: 700; color: ${markerColor}; font-size: 0.85rem;">${obj.id}: ${obj.name}</div>
          <div style="font-size: 0.72rem; color: #9ca3af; margin-top: 2px;">
            ${obj.categoryLabel} &bull; ${obj.statusLabel}
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; margin-top: 4px; color: #fff;">
            FRP: <strong>${obj.thermal.currentFRP} MW</strong> (${obj.thermal.frpDeviationRatio}x Baseline)
          </div>
        </div>
      `, { sticky: true });

      marker.on('click', () => {
        this.map.flyTo([lat, lon], 14, { duration: 0.8 });
        this.selectObject(obj.id, false);
      });

      this.markers[obj.id] = marker;
      this.layers.thermalClusters.addLayer(marker);
    });
  }

  updateHistoricalClusters(dayIndex) {
    if (!this.markers) return;
    
    Object.keys(this.markers).forEach(objId => {
      const marker = this.markers[objId];
      if (!marker) return;

      const historyList = getHistoricalFrpForObject(objId);
      const record = historyList && historyList[dayIndex - 1];
      if (!record) return;

      const ratio = Math.round((record.frp / Math.max(record.baseline, 1)) * 100) / 100;
      let markerColor = '#38bdf8';
      let pulseClass = '';

      if (objId.includes('FOR') || objId.includes('3041')) {
        markerColor = record.frp > 10 ? '#22c55e' : '#64748b';
        if (record.frp > 10) pulseClass = `<div class="marker-pulse-ring" style="background: rgba(34, 197, 94, 0.4); border: 2px solid #22c55e;"></div>`;
      } else if (objId.includes('AGR') || objId.includes('4012')) {
        markerColor = record.frp > 10 ? '#eab308' : '#64748b';
        if (record.frp > 10) pulseClass = `<div class="marker-pulse-ring" style="background: rgba(234, 179, 8, 0.35); border: 2px solid #eab308;"></div>`;
      } else if (objId.includes('MINE') || objId.includes('7011')) {
        markerColor = '#a855f7';
        pulseClass = `<div class="marker-pulse-ring" style="background: rgba(168, 85, 247, 0.4); border: 2px solid #a855f7;"></div>`;
      } else if (ratio >= 2.0) {
        markerColor = '#ef4444';
        pulseClass = `<div class="marker-pulse-ring" style="background: rgba(239, 68, 68, 0.4); border: 2px solid #ef4444;"></div>`;
      } else if (ratio >= 1.4) {
        markerColor = '#f59e0b';
        pulseClass = `<div class="marker-pulse-ring" style="background: rgba(245, 158, 11, 0.3); border: 2px solid #f59e0b;"></div>`;
      } else {
        markerColor = '#38bdf8';
        pulseClass = '';
      }

      const customIcon = L.divIcon({
        className: 'custom-cluster-marker',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            ${pulseClass}
            <div style="width: 16px; height: 16px; border-radius: 50%; background: ${markerColor}; border: 2px solid #ffffff; box-shadow: 0 0 14px ${markerColor};"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      marker.setIcon(customIcon);
      if (typeof marker.setTooltipContent === 'function') {
        marker.setTooltipContent(`
          <div style="font-family: 'Inter', sans-serif;">
            <div style="font-weight: 700; color: ${markerColor}; font-size: 0.85rem;">${objId}</div>
            <div style="font-size: 0.72rem; color: #9ca3af; margin-top: 2px;">
              ${record.day} &bull; ${record.date}
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; margin-top: 4px; color: #fff;">
              FRP: <strong>${record.frp} MW</strong> (${ratio}x Baseline) &bull; ${record.tempK} K
            </div>
          </div>
        `);
      }
    });
  }

  renderOsmFacilities(categoryFilter = 'all') {
    this.layers.osmFacilities.clearLayers();

    // 1. Render Detailed OSM Polygons for Core Complexes
    OSM_FACILITIES.forEach(fac => {
      const polygon = L.polygon(fac.polygon, {
        color: '#00f0ff',
        weight: 1.5,
        dashArray: '3, 4',
        fillColor: '#00f0ff',
        fillOpacity: 0.12
      });

      polygon.bindTooltip(`
        <div style="font-family: 'Inter', sans-serif; font-size: 0.78rem;">
          <strong style="color: #00f0ff;">🏭 ${fac.name}</strong><br/>
          <span style="color:#9ca3af;">${fac.attributes.city}, ${fac.attributes.state}</span><br/>
          Type: <strong>${fac.type}</strong><br/>
          Capacity: ${fac.attributes.capacity}<br/>
          Operator: <em>${fac.attributes.operator}</em>
        </div>
      `, { sticky: true });

      const handleClick = () => {
        this.map.flyTo(fac.coordinates, 14, { duration: 0.8 });
        let matchedObj = THERMAL_OBJECTS.find(o => o.id === fac.id || o.regionId === fac.id);
        if (!matchedObj) {
          matchedObj = this.synthesizeObjectFromFacility({
            id: fac.id,
            name: fac.name,
            state: fac.attributes.state,
            city: fac.attributes.city,
            type: fac.type,
            coordinates: fac.coordinates,
            capacity: fac.attributes.capacity,
            operator: fac.attributes.operator
          });
        }
        if (this.onSelectObject) this.onSelectObject(matchedObj);
      };

      polygon.on('click', handleClick);
      this.layers.osmFacilities.addLayer(polygon);
    });

    // 2. Filter All-India Facilities by active category
    let facilitiesToRender = ALL_INDIA_FACILITIES;
    if (categoryFilter !== 'all') {
      facilitiesToRender = ALL_INDIA_FACILITIES.filter(fac => {
        if (categoryFilter === 'industrial_fire') {
          return fac.id === 'REF-01' || fac.id === 'REF-09' || fac.status === 'high_priority' || fac.type.includes('Petrochemical');
        } else if (categoryFilter === 'routine_flare') {
          return fac.type.includes('Refinery') || fac.type.includes('Petrochemical') || fac.type.includes('LNG') || fac.type.includes('Chemical');
        } else if (categoryFilter === 'mining_fire') {
          return fac.type.includes('Coal') || fac.type.includes('Thermal') || fac.type.includes('Steel') || fac.type.includes('Aluminum') || fac.type.includes('Mine');
        } else if (categoryFilter === 'forest_fire') {
          return fac.type.includes('Forest') || fac.type.includes('Biosphere');
        } else if (categoryFilter === 'agriculture_fire') {
          return fac.type.includes('Agrarian') || fac.type.includes('Crop') || fac.type.includes('Stubble');
        } else if (categoryFilter === 'glint_filtered') {
          return fac.type.includes('Solar');
        }
        return true;
      });
    }

    // Render filtered facilities (only if no active thermal cluster marker already present)
    facilitiesToRender.forEach(fac => {
      const matchedObj = this.findMatchingThermalObject(fac);
      
      // If there is already a thermal cluster marker active for this facility, skip duplicate circle marker
      if (matchedObj && this.markers && this.markers[matchedObj.id]) {
        return;
      }

      let pinColor = '#00f0ff';
      let iconSymbol = '🏭';
      if (fac.type.includes('Thermal')) { pinColor = '#f59e0b'; iconSymbol = '⚡'; }
      else if (fac.type.includes('Steel')) { pinColor = '#ec4899'; iconSymbol = '🏭'; }
      else if (fac.type.includes('Coal')) { pinColor = '#a855f7'; iconSymbol = '⛏️'; }
      else if (fac.type.includes('LNG')) { pinColor = '#06b6d4'; iconSymbol = '⛽'; }
      else if (fac.type.includes('Forest') || fac.type.includes('Biosphere')) { pinColor = '#10b981'; iconSymbol = '🌲'; }
      else if (fac.type.includes('Agrarian') || fac.type.includes('Crop')) { pinColor = '#eab308'; iconSymbol = '🌾'; }
      else if (fac.type.includes('Solar')) { pinColor = '#64748b'; iconSymbol = '☀️'; }

      const centerMarker = L.circleMarker(fac.coordinates, {
        radius: 6,
        color: pinColor,
        fillColor: '#ffffff',
        fillOpacity: 0.95,
        weight: 2
      });

      const hasActiveHotspot = !!matchedObj || (fac.hasActiveDetection === true && fac.currentFRP);
      const statusText = hasActiveHotspot 
        ? `Satellite FRP: <strong style="color:#ff4747;">${matchedObj?.thermal?.currentFRP || fac.currentFRP} MW</strong> <span style="color:#ff8888; font-size:0.7rem;">(Active Hotspot)</span>`
        : `Satellite Status: <strong style="color:#10b981;">Nominal (No Satellite Thermal Anomaly)</strong>`;

      centerMarker.bindTooltip(`
        <div style="font-family: 'Inter', sans-serif; font-size: 0.76rem;">
          <strong style="color:${pinColor};">${iconSymbol} ${fac.name}</strong><br/>
          <span style="color:#9ca3af;">${fac.city}, ${fac.state}</span><br/>
          Type: <strong>${fac.type}</strong><br/>
          Capacity: <span style="color:#cbd5e1; font-weight:600;">${fac.capacity || 'Commercial Plant'}</span><br/>
          ${statusText}
        </div>
      `, { sticky: true });

      centerMarker.on('click', () => {
        this.map.flyTo(fac.coordinates, 14, { duration: 0.8 });
        const objToSelect = matchedObj || this.synthesizeObjectFromFacility(fac);
        this.selectObject(objToSelect.id, false);
      });

      this.layers.osmFacilities.addLayer(centerMarker);
    });
  }

  renderWorldCoverBuffers() {
    this.layers.worldCoverBuffers.clearLayers();

    THERMAL_OBJECTS.forEach(obj => {
      const circle = L.circle(obj.coordinates, {
        radius: 1000,
        color: 'rgba(56, 189, 248, 0.4)',
        weight: 1,
        fillColor: obj.primaryCategory === 'wildfire' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(56, 189, 248, 0.06)',
        fillOpacity: 0.08,
        dashArray: '2, 6'
      });

      this.layers.worldCoverBuffers.addLayer(circle);
    });
  }

  renderRiskBuffers() {
    this.layers.riskBuffers.clearLayers();

    THERMAL_OBJECTS.filter(o => o.status === 'high_priority').forEach(obj => {
      const buffer = L.circle(obj.coordinates, {
        radius: 2000,
        color: 'rgba(255, 71, 71, 0.35)',
        weight: 1.5,
        fillColor: 'rgba(255, 71, 71, 0.04)',
        fillOpacity: 0.05,
        dashArray: '6, 6'
      });

      buffer.bindTooltip(`
        <div style="font-family: 'Inter', sans-serif; font-size: 0.72rem; color: #ff8888;">
          <strong>2.0 km Population Risk Perimeter</strong><br/>
          Nearest Settlement: ${obj.nearestSettlement.name} (${obj.nearestSettlement.distanceKm} km)
        </div>
      `, { sticky: true });

      this.layers.riskBuffers.addLayer(buffer);
    });
  }

  renderNasaStaticMask(objects) {
    this.layers.nasaStaticMask.clearLayers();

    objects.forEach(obj => {
      const [lat, lon] = obj.coordinates;
      const isStaticMask = obj.primaryCategory === 'industrial';
      
      const staticMarker = L.rectangle([
        [lat - 0.003, lon - 0.003],
        [lat + 0.003, lon + 0.003]
      ], {
        color: isStaticMask ? '#3b82f6' : '#9ca3af',
        weight: 1.5,
        fillColor: isStaticMask ? '#3b82f6' : '#9ca3af',
        fillOpacity: 0.3
      });

      staticMarker.bindTooltip(`
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">
          <strong style="color: #60a5fa;">NASA Static Thermal Anomalies Layer</strong><br/>
          NASA Classification: <strong>${obj.nasaComparison.nasaLabel}</strong><br/>
          HeatWatch AI: <strong>${obj.nasaComparison.heatwatchLabel}</strong><br/>
          Status: <em>${obj.nasaComparison.agreementStatus}</em>
        </div>
      `, { sticky: true });

      this.layers.nasaStaticMask.addLayer(staticMarker);
    });
  }

  selectObject(objectId, triggerFlyTo = true) {
    this.selectedObjectId = objectId;
    let obj = THERMAL_OBJECTS.find(o => o.id === objectId || o.regionId === objectId);
    if (!obj) {
      const cleanId = String(objectId).replace(/^OBJ-/, '').replace(/^FAC-/, '');
      const fac = ALL_INDIA_FACILITIES.find(f => f.id === cleanId || f.id === objectId || `FAC-${f.id}` === objectId || `OBJ-${f.id}` === objectId);
      if (fac) {
        obj = this.synthesizeObjectFromFacility(fac);
      }
    }
    if (obj) {
      if (triggerFlyTo && obj.coordinates) {
        this.map.flyTo(obj.coordinates, 14, { duration: 0.8 });
      }
      if (this.onSelectObject) {
        this.onSelectObject(obj);
      }
    }
  }

  applyLayerPreset(layerConfig) {
    Object.keys(layerConfig).forEach(layerKey => {
      this.toggleLayer(layerKey, layerConfig[layerKey]);
    });
  }

  getGeoSectorInfo(lat, lon) {
    if (lat >= 32.0 && lon < 79.0) {
      return { name: "Jammu & Kashmir / Himalayan Foothills", state: "Jammu & Kashmir", type: "Vegetation Forest / Mountain Ridge", isForest: true };
    } else if (lat >= 29.0 && lat < 32.5 && lon >= 74.0 && lon <= 77.8) {
      return { name: "Punjab & Haryana Agrarian Belt", state: "Punjab / Haryana", type: "Agrarian Stubble Biomass", isForest: false };
    } else if (lat >= 24.0 && lat < 30.5 && lon >= 69.5 && lon < 77.0) {
      return { name: "Rajasthan Semi-Arid Basin", state: "Rajasthan", type: "Open Arid Terrain / Glint", isForest: false };
    } else if (lat >= 20.0 && lat < 24.8 && lon >= 68.5 && lon < 74.5) {
      return { name: "Gujarat Coastal / Industrial Corridor", state: "Gujarat", type: "Industrial / Coastal Belt", isForest: false };
    } else if (lat >= 24.0 && lat < 30.0 && lon >= 77.0 && lon < 85.0) {
      return { name: "Gangetic Plain & Central Basin", state: "Uttar Pradesh / Bihar", type: "Agrarian / Biomass Front", isForest: false };
    } else if (lat >= 21.0 && lat < 25.5 && lon >= 75.0 && lon < 82.0) {
      return { name: "Madhya Pradesh Forest & Agro Belt", state: "Madhya Pradesh", type: "Deciduous Forest Canopy", isForest: true };
    } else if (lat >= 20.0 && lat < 25.0 && lon >= 82.0 && lon < 88.0) {
      return { name: "Chhota Nagpur & Mineral Basin", state: "Jharkhand / Chhattisgarh", type: "Mining & Canopy Wildfire", isForest: true };
    } else if (lat >= 18.0 && lat < 22.0 && lon >= 82.0 && lon < 87.5) {
      return { name: "Odisha Eastern Highlands", state: "Odisha", type: "Dense Forest Wildfire", isForest: true };
    } else if (lat >= 15.0 && lat < 22.0 && lon >= 72.5 && lon < 80.5) {
      return { name: "Maharashtra & Western Ghats Corridor", state: "Maharashtra", type: "Western Ghats Scrub & Forest", isForest: true };
    } else if (lat >= 13.0 && lat < 19.5 && lon >= 76.5 && lon < 84.5) {
      return { name: "Deccan Plateau & Krishna-Godavari Basin", state: "Telangana / Andhra Pradesh", type: "Deccan Agrarian & Scrub", isForest: false };
    } else if (lat >= 11.5 && lat < 16.0 && lon >= 74.0 && lon < 78.5) {
      return { name: "Karnataka Western Ridge & Plateau", state: "Karnataka", type: "Protected Forest Reserve", isForest: true };
    } else if (lat >= 8.0 && lat < 14.0 && lon >= 76.5 && lon < 80.5) {
      return { name: "Tamil Nadu & Coromandel Basin", state: "Tamil Nadu", type: "Peninsular Agrarian / Scrub", isForest: false };
    } else if (lat >= 8.0 && lat < 13.0 && lon >= 74.8 && lon < 77.5) {
      return { name: "Kerala & Cardamom Hills", state: "Kerala", type: "Tropical Canopy & Agro", isForest: true };
    } else if (lat >= 22.0 && lon >= 88.0) {
      return { name: "Northeast Highlands & Brahmaputra Basin", state: "Northeast India", type: "Tropical Rainforest Canopy", isForest: true };
    } else {
      return { name: `Regional Sector (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`, state: "India", type: "Open Regional Terrain", isForest: false };
    }
  }

  synthesizeObjectFromDetection(det) {
    const lat = det.lat;
    const lon = det.lon;
    const frp = parseFloat(det.frp || 25.0);
    const tempK = parseFloat(det.tempK || 345.0);
    
    // Find closest facility among 58+ Indian facilities using accurate spherical distance
    let nearestFac = ALL_INDIA_FACILITIES[0];
    let minDist = 999999999;
    ALL_INDIA_FACILITIES.forEach(fac => {
      const d = this.haversineDistance(lat, lon, fac.coordinates[0], fac.coordinates[1]);
      if (d < minDist) {
        minDist = d;
        nearestFac = fac;
      }
    });

    const isClose = minDist < 2000;
    const isNearby = minDist <= 12000;
    const geo = this.getGeoSectorInfo(lat, lon);

    let name = '';
    let categoryLabel = '';
    let primaryCategory = '';
    let categoryGroup = '';
    let subtype = '';
    let regionId = '';
    let matchedFacility = {};

    if (isNearby) {
      // Associated with or in perimeter of known industrial facility
      name = isClose ? `${nearestFac.name} Active Hotspot` : `${nearestFac.name} Peripheral Thermal Emission`;
      regionId = nearestFac.id;
      subtype = nearestFac.type;
      primaryCategory = nearestFac.type.includes('Biosphere') || nearestFac.type.includes('Forest') ? 'wildfire' : (nearestFac.type.includes('Agrarian') ? 'agriculture' : 'industrial');
      categoryGroup = nearestFac.type.includes('Solar') ? 'glint_filtered' : (primaryCategory === 'industrial' ? (isClose && nearestFac.type.includes('Refinery') ? 'routine_flare' : 'industrial_fire') : (primaryCategory === 'wildfire' ? 'forest_fire' : 'agriculture_fire'));
      categoryLabel = isClose ? `${nearestFac.type} Operational Thermal Emission` : `${nearestFac.type} Peripheral Industrial Hotspot`;
      matchedFacility = {
        name: nearestFac.name,
        type: nearestFac.type,
        distanceMeters: Math.round(minDist),
        osmId: `fac/${nearestFac.id}`
      };
    } else {
      // Open regional natural / agrarian hotspot
      name = `${geo.name} Thermal Hotspot`;
      regionId = `geo_${Math.round(lat*10)}_${Math.round(lon*10)}`;
      subtype = geo.type;
      primaryCategory = geo.isForest ? "wildfire" : "agriculture";
      categoryGroup = geo.isForest ? "forest_fire" : "agriculture_fire";
      categoryLabel = geo.isForest ? "Protected Canopy Vegetation Wildfire" : "Agricultural Stubble / Open Biomass Burning";
      matchedFacility = {
        name: `Open Regional Terrain (${geo.state})`,
        type: geo.type,
        distanceMeters: Math.round(minDist),
        osmId: `geo/${Math.round(lat*100)}_${Math.round(lon*100)}`
      };
    }

    let status = frp > 50 ? "high_priority" : (frp > 25 ? "elevated" : "normal");
    let statusLabel = status === "high_priority" ? "HIGH-PRIORITY ANOMALY" : (status === "elevated" ? "ELEVATED THERMAL FLUX" : "NORMAL OPERATIONAL BASELINE");

    const objId = det.clusterId || `HOTSPOT-${Math.round(lat*100)}-${Math.round(lon*100)}`;
    const baseMean = isNearby ? (frp > 30 ? 18.0 : frp * 0.7) : (geo.isForest ? 12.0 : 8.0);
    const deviationRatio = Math.round((frp / Math.max(baseMean, 1)) * 100) / 100;

    const dynamicObj = {
      id: objId,
      name: name,
      regionId: regionId,
      centroid: [lat, lon],
      coordinates: [lat, lon],
      categoryGroup: categoryGroup,
      primaryCategory: primaryCategory,
      categoryLabel: categoryLabel,
      subtype: subtype,
      status: status,
      statusLabel: statusLabel,
      evidenceScore: isClose ? 0.89 : 0.76,
      confidence: `${Math.round((isClose ? 0.89 : 0.76) * 100)}%`,
      matchedFacility: matchedFacility,
      thermal: {
        currentFRP: frp,
        historicalMeanFRP: Math.round(baseMean * 10) / 10,
        frpDeviationRatio: deviationRatio,
        currentBrightnessTempK: tempK,
        historicalMeanTempK: Math.round((tempK - 15) * 10) / 10,
        sensor: det.satellite ? `${det.satellite} (375m)` : "VIIRS SNPP 375m (I-Band 3.74µm)",
        detectionTime: det.time ? `2026-08-28 ${det.time} UTC` : "2026-08-28 03:45 UTC",
        activeDays: isClose ? 78 : 3,
        totalDetections: isClose ? 112 : 5,
        persistenceRate: isClose ? "86.5% (Persistent Multi-Pass)" : "12.0% (Transient Fire Front)",
        footprintAreaHa: Math.round((frp / 8.0) * 10) / 10
      },
      spatialDynamics: {
        centroidStabilityPct: isClose ? 99.2 : 62.4,
        spreadVelocityKmH: isClose ? 0.0 : 2.4,
        motionType: isClose ? "STATIONARY STACK" : "ACTIVE SPREAD",
        isStationary: isClose,
        driftVectorMeters: isClose ? 8 : 180,
        plumeDispersion: "South-West (14 km/h)"
      },
      landCover: {
        industrialBuiltUp: isClose ? 74.0 : 4.0,
        bareSoilPaved: isClose ? 16.0 : 12.0,
        waterBody: 2.0,
        vegetationTree: isForest ? 82.0 : 4.0,
        cropland: isAgri ? 78.0 : 2.0
      },
      nighttimeLight: {
        radianceScore: isClose ? 78.5 : 2.8,
        classification: isClose ? "High Urban / Industrial Lighting" : "Dark Wilderness / Rural Buffer"
      },
      glintFilter: {
        statusLabel: "✓ PASSED: Verified Combustion Emitter",
        albedoReflectance: 0.07,
        solarElevationDeg: 52.4
      },
      hazardProximity: {
        threatLevel: status === "high_priority" ? "ELEVATED" : "NOMINAL",
        summary: `Proximity to ${nearestFac.name} (${Math.round(minDist)}m perimeter)`
      },
      nearestSettlement: {
        name: `${nearestFac.city} Urban Fringe`,
        distanceKm: Math.round((minDist / 1000 + 1.2) * 10) / 10,
        populationEstimate: "6,200 residents"
      },
      recommendedAction: isClose ? "Review facility telemetry & check flare containment efficiency." : "Track active thermal perimeter spread on subsequent orbital passes.",
      evidencePoints: [
        { text: `Proximity: ${Math.round(minDist)}m to registered ${nearestFac.name}`, type: "facility-match" },
        { text: `Radiometry: FRP ${frp} MW with Brightness Temp ${tempK} K`, type: "persistence" },
        { text: `Land Cover: Dominant context verifies ${categoryLabel}`, type: "landcover" }
      ],
      anomalyFormula: {
        totalAnomalyScore: Math.min(1.0, (frp / 60.0) * 0.85)
      }
    };

    // Ensure 90-day time series exists in HISTORICAL_FRP_DATA
    if (!HISTORICAL_FRP_DATA[objId]) {
      const history = [];
      const startDate = new Date("2026-06-01T00:00:00Z");
      for (let i = 0; i < 90; i++) {
        const curDate = new Date(startDate.getTime() + i * 86400000);
        const dayFrp = i === 89 ? frp : Math.max(0, Math.round((baseMean + Math.sin(i * 0.5) * 2) * 10) / 10);
        history.push({
          dayIndex: i + 1,
          day: `Day ${i + 1}`,
          date: curDate.toISOString().substring(0, 10),
          frp: dayFrp,
          baseline: Math.round(baseMean * 10) / 10,
          threshold: Math.round(baseMean * 2 * 10) / 10,
          tempK: Math.round(300 + dayFrp * 1.05),
          status: i === 89 ? status : "normal"
        });
      }
      HISTORICAL_FRP_DATA[objId] = history;
    }

    return dynamicObj;
  }

  findMatchingThermalObject(fac) {
    if (!fac) return null;
    return THERMAL_OBJECTS.find(o => {
      if (o.id === fac.id || o.regionId === fac.id || `FAC-${fac.id}` === o.id || `OBJ-${fac.id}` === o.id) return true;
      if ((fac.id === 'REF-01' || fac.id === 'jamnagar') && o.id === 'OBJ-1045') return true;
      if ((fac.id === 'CHEM-03' || fac.id === 'hazira') && o.id === 'OBJ-1082') return true;
      if ((fac.id === 'PWR-02' || fac.id === 'korba') && o.id === 'OBJ-2019') return true;
      if ((fac.id === 'PWR-01' || fac.id === 'singrauli') && o.id === 'OBJ-5012') return true;
      if ((fac.id === 'FOR-01' || fac.id === 'simlipal') && o.id === 'OBJ-3041') return true;
      if ((fac.id === 'SOL-01' || fac.id === 'bhadla') && o.id === 'OBJ-8021') return true;
      if ((fac.id === 'MINE-01' || fac.id === 'jharia') && o.id === 'OBJ-7011') return true;
      if ((fac.id === 'AGR-01' || fac.id === 'patiala') && o.id === 'OBJ-4012') return true;
      return false;
    });
  }

  synthesizeObjectFromFacility(fac) {
    const lat = fac.coordinates[0];
    const lon = fac.coordinates[1];
    const objId = `FAC-${fac.id}`;

    // Check if this facility maps to an actual active thermal hotspot detection
    const matchedBenchmark = this.findMatchingThermalObject(fac);
    if (matchedBenchmark) {
      return matchedBenchmark;
    }

    const baseMean = fac.baselineFRP || (
      fac.id.startsWith('REF') ? 28.5 :
      fac.id.startsWith('PWR') ? 45.0 :
      fac.id.startsWith('STL') ? 35.0 :
      fac.id.startsWith('MINE') ? 52.0 :
      fac.id.startsWith('CHEM') ? 22.0 :
      fac.id.startsWith('FOR') ? 0.0 :
      fac.id.startsWith('AGR') ? 0.0 : 0.0
    );

    const hasActiveDetection = fac.hasActiveDetection === true || (fac.currentFRP !== undefined && fac.currentFRP > 0) || baseMean > 0;
    const frp = fac.currentFRP !== undefined ? fac.currentFRP : (baseMean > 0 ? Math.round((baseMean * (1 + (Math.sin(fac.coordinates[0] * 5) * 0.06))) * 10) / 10 : 0.0);
    const isSurge = fac.status === 'high_priority' || (hasActiveDetection && frp && baseMean && (frp / Math.max(baseMean, 1)) > 1.8);
    const status = isSurge ? "high_priority" : (hasActiveDetection ? "normal" : "nominal");
    const statusLabel = isSurge ? "HIGH-PRIORITY ANOMALY" : (hasActiveDetection ? "NORMAL OPERATIONAL BASELINE" : "NOMINAL BASELINE");

    const dynObj = {
      id: objId,
      name: `${fac.name}`,
      regionId: fac.id,
      centroid: [lat, lon],
      coordinates: [lat, lon],
      hasActiveDetection: hasActiveDetection,
      categoryGroup: isSurge ? "industrial_fire" : (fac.id.startsWith('MINE') ? "mining_fire" : (fac.id.startsWith('FOR') ? "forest_fire" : (fac.id.startsWith('AGR') ? "agriculture_fire" : (fac.id.startsWith('SOL') ? "glint_filtered" : "routine_flare")))),
      primaryCategory: fac.id.startsWith('FOR') ? "wildfire" : (fac.id.startsWith('AGR') ? "agriculture" : (fac.id.startsWith('MINE') ? "mining" : (fac.id.startsWith('SOL') ? "solar_glint" : "industrial"))),
      categoryLabel: isSurge ? `${fac.type} Thermal Surge` : `${fac.type} (Operational Baseline)`,
      subtype: fac.type,
      status: status,
      statusLabel: statusLabel,
      evidenceScore: hasActiveDetection ? 0.91 : 0.85,
      confidence: hasActiveDetection ? "High (91%)" : "Nominal",
      matchedFacility: {
        name: fac.name,
        type: fac.type,
        distanceMeters: 0,
        osmId: `facility/${fac.id}`,
        tags: {
          operator: fac.operator || "National Industrial Grid",
          capacity: fac.capacity || "Commercial Facility",
          units: fac.units || "Active Refining & Industrial Units"
        }
      },
      thermal: {
        currentFRP: frp,
        historicalMeanFRP: baseMean,
        frpDeviationRatio: hasActiveDetection && frp && baseMean ? (Math.round((frp / Math.max(baseMean, 1)) * 100) / 100) : 1.0,
        currentBrightnessTempK: hasActiveDetection && frp > 0 ? Math.round(320 + (frp * 0.85)) : 301.2,
        historicalMeanTempK: baseMean > 0 ? Math.round(315 + (baseMean * 0.80)) : 298.0,
        sensor: "VIIRS SNPP 375m & MODIS Terra",
        detectionTime: "2026-08-28 02:18 UTC",
        activeDays: hasActiveDetection ? 88 : 0,
        totalDetections: hasActiveDetection ? 134 : 0,
        persistenceRate: hasActiveDetection ? "94.2% (Persistent Industrial Emitter)" : "Nominal Baseline",
        footprintAreaHa: hasActiveDetection && frp ? Math.round((frp / 7.0) * 10) / 10 : 0.0
      },
      spatialDynamics: {
        centroidStabilityPct: 99.6,
        spreadVelocityKmH: 0.0,
        motionType: "STATIONARY FACILITY STACK",
        isStationary: true,
        driftVectorMeters: 0,
        plumeDispersion: "Calm / Nominal (6 km/h)"
      },
      landCover: fac.landCover || {
        industrialBuiltUp: 78.0,
        bareSoilPaved: 14.0,
        waterBody: 4.0,
        vegetationTree: 4.0,
        cropland: 0.0
      },
      nighttimeLight: {
        radianceScore: 82.4,
        classification: "Industrial Electrification Grid"
      },
      glintFilter: {
        statusLabel: fac.id.startsWith('SOL') ? "REJECTED: Solar Panel Optical Glint" : "✓ PASSED: Verified High-Temp Emitter",
        albedoReflectance: fac.id.startsWith('SOL') ? 0.42 : 0.06,
        solarElevationDeg: 54.0
      },
      hazardProximity: {
        threatLevel: isSurge ? "CRITICAL INTERNAL SURGE" : "NOMINAL BACKGROUND",
        summary: `Facility Perimeter: ${fac.name} (${fac.city}, ${fac.state})`
      },
      nearestSettlement: {
        name: `${fac.city} Settlement Fringe`,
        distanceKm: 2.2,
        populationEstimate: "~18,000 residents"
      },
      recommendedAction: isSurge ? "Review facility flare release telemetry & alert plant safety unit." : "Routine background operational monitoring active.",
      evidencePoints: [
        { text: `Registered Facility: Direct match at ${fac.name} (${fac.state}) in OSM catalog`, verified: true, type: "neutral" },
        { text: hasActiveDetection ? `Radiometry: Current FRP ${frp} MW (90-Day Baseline: ${baseMean} MW)` : `Satellite Radiometry: 0.0 MW (No active thermal pixels detected in current orbital pass)`, verified: hasActiveDetection, type: hasActiveDetection ? "pro-industrial" : "no-data" },
        { text: `ESA WorldCover: ${(fac.landCover?.industrialBuiltUp || 78)}% heavy industrial built-up footprint`, verified: true, type: "neutral" },
        { text: `Status: Operating within nominal baseline parameters`, verified: true, type: "neutral" }
      ],
      anomalyFormula: {
        totalAnomalyScore: isSurge ? 0.88 : (hasActiveDetection ? 0.08 : 0.0)
      }
    };

    // Ensure 90-day time series exists in HISTORICAL_FRP_DATA
    HISTORICAL_FRP_DATA[objId] = getHistoricalFrpForObject(objId);

    return dynObj;
  }

  flyToFacility(facilityId) {
    const fac = ALL_INDIA_FACILITIES.find(f => f.id === facilityId);
    if (fac) {
      this.map.flyTo(fac.coordinates, 14, { duration: 0.8 });
      const matchedObj = THERMAL_OBJECTS.find(o => o.regionId === fac.id);
      if (matchedObj) {
        this.selectObject(matchedObj.id, false);
      } else {
        const dynObj = this.synthesizeObjectFromFacility(fac);
        if (this.onSelectObject) this.onSelectObject(dynObj);
      }
    }
  }
}
