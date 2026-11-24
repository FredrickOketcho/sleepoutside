const STORAGE_KEY = 'transitDirectory:v1';
const CACHE_KEY = 'transitDirectory:cache:v1';

function emptyData() {
  return { routes: [], stages: [], recentSearches: [], mapPosition: null };
}

export function loadSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      return {
        routes: Array.isArray(saved.routes) ? saved.routes : [],
        stages: Array.isArray(saved.stages) ? saved.stages : [],
        recentSearches: Array.isArray(saved.recentSearches) ? saved.recentSearches : [],
        mapPosition: Number.isFinite(saved.mapPosition?.lat) && Number.isFinite(saved.mapPosition?.lon)
          ? saved.mapPosition
          : null,
      };
    }

    const legacyRoutes = JSON.parse(localStorage.getItem('kampala-fare-favorites') || '[]');
    return { ...emptyData(), routes: Array.isArray(legacyRoutes) ? legacyRoutes : [] };
  } catch {
    return emptyData();
  }
}

export function saveSavedData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function toggleSavedItem(type, item) {
  const data = loadSavedData();
  const list = data[type];
  if (!Array.isArray(list)) return { saved: false, data };
  const index = list.findIndex((entry) => (typeof entry === 'string' ? entry : entry.id) === item.id);
  if (index >= 0) list.splice(index, 1);
  else list.push(item);
  return { saved: index < 0, data, persisted: saveSavedData(data) };
}

export function addRecentSearch(search) {
  const data = loadSavedData();
  const normalized = search.trim();
  if (!normalized) return;
  data.recentSearches = [normalized, ...data.recentSearches.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
  saveSavedData(data);
}

export function saveMapPosition(position) {
  const data = loadSavedData();
  data.mapPosition = position;
  saveSavedData(data);
}

export function readCache(key, maxAge = 60 * 60 * 1000) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entry = cache[key];
    if (entry && Date.now() - entry.savedAt < maxAge) return entry.value;
  } catch {
    return null;
  }
  return null;
}

export function writeCache(key, value) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[key] = { savedAt: Date.now(), value };
    const entries = Object.entries(cache).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, 30);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Caching is optional; the current session can still use the live results.
  }
}
