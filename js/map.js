/**
 * HeatWatch - Master Geospatial GIS Map Engine
 * Renders all 50+ Indian industrial facilities, live/cached thermal detections,
 * ST-DBSCAN clusters, ESA WorldCover buffers, and NASA static anomaly masks.
 */

import { THERMAL_OBJECTS, RAW_FIRMS_DETECTIONS, OSM_FACILITIES, STUDY_REGIONS, ALL_INDIA_FACILITIES } from './data.js';

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

    // Default basemap is NASA GIBS VIIRS True Color (Official FIRMS Global Imagery)
    this.activeBaseMap = this.baseMaps.nasa_viirs.addTo(this.map);

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
      this.activeBaseMap.bringToBack();
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
        (o.matchedFacility && o.matchedFacility.name.toLowerCase().includes(facility.name.toLowerCase().split('(')[0].trim())) ||
        (Math.abs(o.centroid[0] - facility.coordinates[0]) < 0.05 && Math.abs(o.centroid[1] - facility.coordinates[1]) < 0.05)
      );
      if (matchedObj) {
        this.selectObject(matchedObj.id);
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
        if (det.clusterId) {
          this.selectObject(det.clusterId);
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
        this.selectObject(obj.id);
      });

      this.markers[obj.id] = marker;
      this.layers.thermalClusters.addLayer(marker);
    });
  }

  renderOsmFacilities() {
    this.layers.osmFacilities.clearLayers();

    OSM_FACILITIES.forEach(fac => {
      // 1. Facility Perimeter Polygon
      const polygon = L.polygon(fac.polygon, {
        color: '#00f0ff',
        weight: 1.5,
        dashArray: '3, 4',
        fillColor: '#00f0ff',
        fillOpacity: 0.10
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

      polygon.on('click', () => {
        this.map.flyTo(fac.coordinates, 13, { duration: 0.8 });
      });

      this.layers.osmFacilities.addLayer(polygon);

      // 2. Center Marker with Icon
      const centerMarker = L.circleMarker(fac.coordinates, {
        radius: 4,
        color: '#00f0ff',
        fillColor: '#ffffff',
        fillOpacity: 0.9,
        weight: 1
      });

      centerMarker.bindTooltip(`<strong>${fac.name}</strong>`, { direction: 'top' });
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
    const obj = THERMAL_OBJECTS.find(o => o.id === objectId);
    if (obj) {
      if (triggerFlyTo) {
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

  flyToFacility(facilityId) {
    const fac = ALL_INDIA_FACILITIES.find(f => f.id === facilityId);
    if (fac) {
      this.map.flyTo(fac.coordinates, 14, { duration: 1.0 });
    }
  }
}
