/**
 * HeatWatch - Configuration & API Keys
 * You can set your keys here or enter them via the Settings modal in the web UI.
 */

function getStorageItem(key, fallback = "") {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key) || fallback;
    }
  } catch (e) {}
  return fallback;
}

export const CONFIG = {
  // 1. NASA FIRMS API MAP KEY
  NASA_FIRMS_MAP_KEY: getStorageItem("heatwatch_firms_key", "d52a4d6f13515fb7ed72aa01f8b7200b"),

  // NASA FIRMS API Endpoints
  NASA_FIRMS_BASE_URL: "https://firms.modaps.eosdis.nasa.gov/api/area/csv",

  // 2. OpenStreetMap Overpass API (Free public instance, no key required)
  OVERPASS_API_URL: "https://overpass-api.de/api/interpreter",

  // 3. Copernicus Sentinel Hub Configuration ID
  SENTINEL_HUB_INSTANCE_ID: getStorageItem("heatwatch_sentinel_id", "60de79ca-16a7-4afd-bcbd-0261bf0156fa"),
  SENTINEL_HUB_WMS_URL: "https://services.sentinel-hub.com/ogc/wms/60de79ca-16a7-4afd-bcbd-0261bf0156fa",

  // 4. Google Earth Engine Project ID
  EARTH_ENGINE_PROJECT_ID: getStorageItem("heatwatch_gee_project", "firedetection-506905"),

  DEFAULT_SENSOR_SOURCE: "VIIRS_SNPP_NRT"
};

export function saveApiKey(keyName, keyValue) {
  try {
    if (typeof localStorage !== "undefined") {
      if (keyName === 'firms') {
        localStorage.setItem("heatwatch_firms_key", keyValue.trim());
        CONFIG.NASA_FIRMS_MAP_KEY = keyValue.trim();
      } else if (keyName === 'sentinel') {
        localStorage.setItem("heatwatch_sentinel_id", keyValue.trim());
        CONFIG.SENTINEL_HUB_INSTANCE_ID = keyValue.trim();
      } else if (keyName === 'gee') {
        localStorage.setItem("heatwatch_gee_project", keyValue.trim());
        CONFIG.EARTH_ENGINE_PROJECT_ID = keyValue.trim();
      }
    }
  } catch (e) {}
}
