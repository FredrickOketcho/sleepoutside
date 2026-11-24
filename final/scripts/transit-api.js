import { readCache, writeCache } from './storage.js';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const TRANSITLAND = 'https://transit.land/api/v2/rest';
let lastNominatimRequest = 0;
let nominatimQueue = Promise.resolve();

function makeTimedSignal(signal, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('The request timed out.')), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function rateLimitedFetch(url, options = {}) {
  const request = nominatimQueue.then(async () => {
    const waitMs = Math.max(0, 1000 - (Date.now() - lastNominatimRequest));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastNominatimRequest = Date.now();
    return fetch(url, options);
  });
  nominatimQueue = request.then(() => undefined, () => undefined);
  return request;
}

export async function geocodePlace(query, signal) {
  const normalized = query.trim().toLocaleLowerCase();
  if (normalized.length < 2) throw new Error('Enter at least two characters to search for a place.');
  const cacheKey = `nominatim:search:${normalized}`;
  const cached = readCache(cacheKey, 30 * 24 * 60 * 60 * 1000);
  if (cached) return cached;

  const url = new URL(`${NOMINATIM}/search`);
  url.search = new URLSearchParams({ q: query.trim(), format: 'jsonv2', limit: '5', addressdetails: '1' });
  const timed = makeTimedSignal(signal);
  try {
    const response = await rateLimitedFetch(url, {
      signal: timed.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Place search failed (${response.status}).`);
    const data = await response.json();
    const results = Array.isArray(data)
      ? data.map((item) => ({
          name: item.name || item.display_name?.split(',')[0] || query,
          displayName: item.display_name || item.name || query,
          lat: Number(item.lat),
          lon: Number(item.lon),
        })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon))
      : [];
    writeCache(cacheKey, results);
    return results;
  } finally {
    timed.clear();
  }
}

export async function reverseGeocode(lat, lon, signal) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error('The selected map coordinates are invalid.');
  }
  const cacheKey = `nominatim:reverse:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = readCache(cacheKey, 30 * 24 * 60 * 60 * 1000);
  if (cached) return cached;

  const url = new URL(`${NOMINATIM}/reverse`);
  url.search = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'jsonv2' });
  const timed = makeTimedSignal(signal);
  try {
    const response = await rateLimitedFetch(url, {
      signal: timed.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Address lookup failed (${response.status}).`);
    const data = await response.json();
    const result = data.display_name || 'Selected map location';
    writeCache(cacheKey, result);
    return result;
  } finally {
    timed.clear();
  }
}

export async function getNearbyStops(lat, lon, radius, apiKey, signal) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error('The selected map coordinates are invalid.');
  }
  if (!Number.isFinite(radius) || radius < 1 || radius > 10000) {
    throw new Error('Choose a search radius between 1 m and 10 km.');
  }
  const cacheKey = `transitland:${lat.toFixed(3)},${lon.toFixed(3)}:${radius}`;
  const cached = readCache(cacheKey, 7 * 24 * 60 * 60 * 1000);
  if (cached) return cached;
  if (!apiKey) throw new Error('Add a restricted Transitland API key to load uncached feed stops.');

  const url = new URL(`${TRANSITLAND}/stops`);
  url.search = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius: String(radius),
    limit: '100',
    include_routes: 'true',
  });
  const timed = makeTimedSignal(signal);
  try {
    const response = await fetch(url, {
      signal: timed.signal,
      headers: { Accept: 'application/json', apikey: apiKey },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Transitland did not accept this API key. Check the key and try again.');
      }
      if (response.status === 429) throw new Error('Transitland request limit reached. Try again later.');
      throw new Error(`Transitland stop search failed (${response.status}).`);
    }
    const data = await response.json();
    const stops = Array.isArray(data.stops)
      ? data.stops.filter((stop) => stop.geometry?.coordinates?.length === 2)
      : [];
    writeCache(cacheKey, stops);
    return stops;
  } finally {
    timed.clear();
  }
}
