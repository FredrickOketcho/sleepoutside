import { loadSavedData, saveSavedData } from './storage.js';

let routesPromise;

export async function loadRoutes() {
  if (!routesPromise) {
    routesPromise = fetch('./data/taxi-routes.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Route data request failed: ${response.status}`);
        return response.json();
      })
      .then((routes) => {
        if (!Array.isArray(routes) || routes.length < 15 || !routes.every((route) => Array.isArray(route.stages))) {
          throw new Error('The curated route dataset is invalid.');
        }
        return routes;
      })
      .catch((error) => {
        routesPromise = null;
        console.error('Unable to load route data:', error);
        throw error;
      });
  }
  return routesPromise;
}

export function formatFare(amount) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);
}

export function formatFareRange(minimum, maximum) {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return 'Fare unavailable';
  return minimum === maximum
    ? formatFare(minimum)
    : `${formatFare(minimum)}–${formatFare(maximum)}`;
}

export function getSavedRoutes() {
  return loadSavedData().routes.map((route) => typeof route === 'string' ? route : route.id);
}

export function saveRoutes(routeIds) {
  const data = loadSavedData();
  data.routes = routeIds;
  return saveSavedData(data);
}
