import { loadRoutes, formatFareRange } from './routes-data.js';
import { addRecentSearch, loadSavedData, saveMapPosition, toggleSavedItem } from './storage.js';
import { geocodePlace, getNearbyStops, reverseGeocode } from './transit-api.js';

const mapElement = document.querySelector('#transit-map');
if (mapElement && window.L) initMapExplorer();
else if (mapElement) document.querySelector('#map-status').textContent = 'The map library could not load. Search and route data remain available below.';

async function initMapExplorer() {
  const form = document.querySelector('#location-search-form');
  const queryInput = document.querySelector('#location-search');
  const radiusInput = document.querySelector('#nearby-radius');
  const status = document.querySelector('#map-status');
  const resultsElement = document.querySelector('#nearby-results');
  const localStageList = document.querySelector('#curated-stages');
  const localStageSearch = document.querySelector('#local-stage-search');
  const details = document.querySelector('#stop-details');
  const nearbyPanel = document.querySelector('#nearby-panel');
  const savedPanel = document.querySelector('#saved-panel');
  const apiKeyInput = document.querySelector('#transitland-key');
  const keyStatus = document.querySelector('#key-status');
  const savedData = loadSavedData();
  const defaultPosition = savedData.mapPosition || { lat: 0.3136, lon: 32.5811, zoom: 13 };
  let routes = [];
  let stages = [];
  let activeController;
  let nearbyController;
  let currentLocation = null;

  const map = window.L.map(mapElement, { scrollWheelZoom: false }).setView(
    [defaultPosition.lat, defaultPosition.lon],
    defaultPosition.zoom || 13,
  );
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);
  const placeMarkers = window.L.layerGroup().addTo(map);
  const transitMarkers = window.L.layerGroup().addTo(map);
  map.whenReady(() => setTimeout(() => map.invalidateSize(), 0));
  map.on('moveend', () => {
    const center = map.getCenter();
    saveMapPosition({ lat: center.lat, lon: center.lng, zoom: map.getZoom() });
  });

  try {
    [routes, stages] = await Promise.all([
      loadRoutes(),
      fetch('./data/taxi-stages.json').then((response) => {
        if (!response.ok) throw new Error('Local stage data is unavailable.');
        return response.json();
      }),
    ]);
    renderLocalStages();
  } catch (error) {
    localStageList.textContent = 'Local route data could not be loaded.';
    console.error('Unable to load the local map directory:', error);
  }

  const recentSearches = loadSavedData().recentSearches;
  renderRecentSearches(recentSearches);
  const savedKey = getTransitlandKey();
  if (savedKey) {
    keyStatus.textContent = 'A Transitland key is saved in this browser.';
    apiKeyInput.value = savedKey;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    searchLocation(queryInput.value.trim());
  });

  localStageSearch.addEventListener('input', renderLocalStages);
  radiusInput.addEventListener('change', () => {
    if (currentLocation) loadNearby(currentLocation, Number(radiusInput.value));
  });
  document.querySelectorAll('[data-map-panel]').forEach((button) => {
    button.addEventListener('click', () => showPanel(button.dataset.mapPanel));
  });

  document.querySelector('#transit-key-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const key = apiKeyInput.value.trim();
    if (!key) {
      keyStatus.textContent = 'Paste a Transitland API key or clear the saved key.';
      return;
    }
    try {
      localStorage.setItem('transitland-api-key', key);
      keyStatus.textContent = 'Key saved. Search a place to load nearby feed stops.';
      if (currentLocation) loadNearby(currentLocation, Number(radiusInput.value));
    } catch {
      keyStatus.textContent = 'This browser could not store the key. You can still use local stages.';
    }
  });

  document.querySelector('#clear-transitland-key').addEventListener('click', () => {
    try {
      localStorage.removeItem('transitland-api-key');
    } catch {
      // Continue with local stages when browser storage is disabled.
    }
    apiKeyInput.value = '';
    keyStatus.textContent = 'Transitland key cleared. Local stages remain available.';
    resultsElement.replaceChildren();
    clearTransitMarkers();
  });

  map.on('click', async (event) => {
    const { lat, lng: lon } = event.latlng;
    activeController?.abort();
    activeController = new AbortController();
    status.textContent = 'Looking up the selected map location...';
    try {
      const label = await reverseGeocode(lat, lon, activeController.signal);
      currentLocation = { lat, lon, label };
      showSelectedPlace(currentLocation, 'map-click');
      await loadNearby(currentLocation, Number(radiusInput.value));
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = error.message || 'Could not look up this map location.';
    }
  });

  renderSavedPlaces();

  async function searchLocation(query) {
    if (!query) return;
    document.querySelector('#location-candidates')?.remove();
    activeController?.abort();
    activeController = new AbortController();
    status.textContent = `Searching for “${query}”…`;
    resultsElement.replaceChildren();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const candidates = await geocodePlace(query, activeController.signal);
      if (!candidates.length) {
        status.textContent = `No matching place found for “${query}”. Try a nearby landmark or neighborhood.`;
        return;
      }
      addRecentSearch(query);
      renderRecentSearches(loadSavedData().recentSearches);
      showSelectedPlace(candidates[0], 'search');
      if (candidates.length > 1) renderCandidates(candidates);
      else document.querySelector('#location-candidates')?.remove();
      await loadNearby(candidates[0], Number(radiusInput.value));
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = error.message || 'Place search failed. Please try again.';
    } finally {
      submit.disabled = false;
    }
  }

  function renderCandidates(candidates) {
    document.querySelector('#location-candidates')?.remove();
    const select = document.createElement('select');
    select.id = 'location-candidates';
    select.className = 'location-candidates';
    select.setAttribute('aria-label', 'Choose a matching place');
    form.insertBefore(select, form.querySelector('button[type="submit"]'));
    select.replaceChildren(...candidates.map((candidate, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = candidate.displayName;
      return option;
    }));
    select.addEventListener('change', () => {
      const selected = candidates[Number(select.value)];
      showSelectedPlace(selected, 'search');
      loadNearby(selected, Number(radiusInput.value));
    });
  }

  function showSelectedPlace(place, source) {
    currentLocation = {
      lat: Number(place.lat),
      lon: Number(place.lon ?? place.lng),
      label: place.displayName || place.name || 'Selected location',
    };
    map.setView([currentLocation.lat, currentLocation.lon], 15);
    saveMapPosition({ ...currentLocation, zoom: 15 });
    clearTransitMarkers();
    placeMarkers.clearLayers();
    const point = window.L.marker([currentLocation.lat, currentLocation.lon], {
      title: currentLocation.label,
      alt: 'Searched location',
    });
    point.addTo(placeMarkers);
    const label = document.createElement('strong');
    label.textContent = source === 'map-click' ? 'Selected map location' : 'Searched place';
    point.bindPopup(label);
  }

  async function loadNearby(place, radius) {
    if (!place) return;
    nearbyController?.abort();
    nearbyController = new AbortController();
    resultsElement.replaceChildren();
    clearTransitMarkers();
    const apiKey = getTransitlandKey();
    if (!apiKey) {
      resultsElement.replaceChildren();
      resultsElement.append(makeMessage('Add a restricted Transitland API key in “Transit data settings” to see feed stops. Local taxi stages are listed below.'));
      status.textContent = `Map centered on ${place.label || 'your selected place'}. Transitland needs an API key for nearby feed stops.`;
      return;
    }

    status.textContent = `Loading transit stops near ${place.label || 'your selected place'}…`;
    try {
      const stops = await getNearbyStops(place.lat, place.lon, radius, apiKey, nearbyController.signal);
      renderNearbyStops(stops);
      status.textContent = stops.length
        ? `${stops.length} transit ${stops.length === 1 ? 'stop' : 'stops'} found within ${radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}.`
        : `No Transitland stops found within this radius. Try a larger radius or use the local taxi stages.`;
    } catch (error) {
      if (error.name === 'AbortError') return;
      resultsElement.replaceChildren(makeMessage(error.message || 'Nearby transit stops could not be loaded.'));
      status.textContent = 'Transitland could not return stops. Local taxi stages remain available.';
    }
  }

  function renderNearbyStops(stops) {
    resultsElement.replaceChildren();
    transitMarkers.clearLayers();
    if (!stops.length) {
      resultsElement.append(makeMessage('No feed stops were found here. Search another place or try a larger radius.'));
      return;
    }
    const bounds = [];
    stops.forEach((stop) => {
      const [lon, lat] = stop.geometry.coordinates;
      const item = {
        id: `transitland-${stop.onestop_id || stop.id}`,
        name: stop.stop_name || stop.stop_code || 'Transit stop',
        description: stop.stop_desc || '',
        lat,
        lon,
        source: 'Transitland',
        routes: Array.isArray(stop.routes_serving_stop) ? stop.routes_serving_stop : [],
      };
      const marker = window.L.marker([lat, lon], { title: item.name, alt: item.name });
      marker.addTo(transitMarkers);
      bounds.push([lat, lon]);
      const popupTitle = document.createElement('strong');
      popupTitle.textContent = item.name;
      marker.bindPopup(popupTitle);
      marker.on('click', () => showStopDetails(item, 'stages'));
      resultsElement.append(makeResultButton(item.name, item.description || 'Transitland feed stop', () => showStopDetails(item, 'stages')));
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }

  function renderLocalStages() {
    const query = localStageSearch.value.trim().toLocaleLowerCase();
    localStageList.replaceChildren();
    const matches = stages.filter((stage) => {
      const routeNames = stage.routeIds.map((id) => routes.find((route) => route.id === id)?.name || '').join(' ');
      return `${stage.name} ${routeNames}`.toLocaleLowerCase().includes(query);
    }).slice(0, 30);
    if (!matches.length) {
      localStageList.append(makeMessage('No local stages match that search.'));
      return;
    }
    matches.forEach((stage) => {
      const routeNames = stage.routeIds.map((id) => routes.find((route) => route.id === id)?.name).filter(Boolean).join(', ');
      localStageList.append(makeResultButton(stage.name, routeNames || 'Community taxi stage', () => locateLocalStage(stage)));
    });
  }

  async function locateLocalStage(stage) {
    activeController?.abort();
    activeController = new AbortController();
    status.textContent = `Finding ${stage.name} on the map…`;
    try {
      const [match] = await geocodePlace(stage.locationQuery, activeController.signal);
      if (!match) {
        status.textContent = `No map location found for ${stage.name}.`;
        return;
      }
      const location = { ...match, label: stage.name };
      showSelectedPlace(location, 'search');
      const routeObjects = stage.routeIds.map((id) => routes.find((route) => route.id === id)).filter(Boolean);
      showStopDetails({ ...stage, lat: match.lat, lon: match.lon, locationQuery: stage.locationQuery, routes: routeObjects }, 'stages');
      status.textContent = `Approximate map match for ${stage.name}. Confirm the exact boarding point locally.`;
      await loadNearby(location, Number(radiusInput.value));
    } catch (error) {
      if (error.name === 'AbortError') return;
      status.textContent = error.message || `Could not locate ${stage.name}.`;
    }
  }

  function showStopDetails(stop, storageType) {
    details.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = stop.name || stop.stop_name || 'Stop details';
    details.append(heading);
    if (stop.description || stop.stop_desc) {
      const description = document.createElement('p');
      description.textContent = stop.description || stop.stop_desc;
      details.append(description);
    }
    const routeList = Array.isArray(stop.routes)
      ? stop.routes
      : [];
    if (routeList.length) {
      const routeHeading = document.createElement('p');
      routeHeading.className = 'detail-label';
      routeHeading.textContent = 'Routes serving this stop';
      details.append(routeHeading);
      routeList.slice(0, 8).forEach((route) => {
        const routeName = typeof route === 'string' ? route : route.name || route.route_name || 'Route';
        const routeElement = document.createElement('p');
        routeElement.textContent = routeName;
        details.append(routeElement);
      });
    }
    if (Number.isFinite(stop.lat) && Number.isFinite(stop.lon)) {
      const coordinates = document.createElement('p');
      coordinates.textContent = `Coordinates: ${stop.lat.toFixed(5)}, ${stop.lon.toFixed(5)}`;
      details.append(coordinates);
    }
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'button button-dark';
    const isSaved = loadSavedData().stages.some((stage) => stage.id === stop.id);
    saveButton.textContent = isSaved ? 'Remove saved stage' : 'Save this stage';
    saveButton.addEventListener('click', () => {
      const item = {
        id: stop.id || `stage-${stop.lat.toFixed(4)}-${stop.lon.toFixed(4)}`,
        name: stop.name || stop.stop_name || 'Saved map location',
        locationQuery: stop.locationQuery || stop.description || stop.stop_desc || stop.name,
        lat: stop.lat,
        lon: stop.lon,
        routeIds: stop.routeIds || [],
        source: stop.source || 'OpenStreetMap search',
      };
      const result = toggleSavedItem(storageType, item);
      status.textContent = result.persisted
        ? result.saved ? `${item.name} saved to your stages.` : `${item.name} removed from saved stages.`
        : 'Browser storage is unavailable; this stage was not saved.';
      saveButton.textContent = result.saved ? 'Remove saved stage' : 'Save this stage';
      renderSavedPlaces();
    });
    details.append(saveButton);
  }

  function renderSavedPlaces() {
    const data = loadSavedData();
    const routeContainer = document.querySelector('#saved-routes');
    const stageContainer = document.querySelector('#saved-stages');
    routeContainer.replaceChildren();
    stageContainer.replaceChildren();
    const savedRoutes = data.routes.map((item) => typeof item === 'string' ? routes.find((route) => route.id === item) : item).filter(Boolean);
    if (!savedRoutes.length) routeContainer.append(makeMessage('No saved routes yet. Use the star on a route card to save one.'));
    savedRoutes.forEach((route) => routeContainer.append(makeResultButton(route.name, formatFareRange(route.fareMin, route.fareMax), () => {
      const result = toggleSavedItem('routes', route);
      status.textContent = result.persisted ? `${route.name} removed from saved routes.` : 'Browser storage is unavailable.';
      renderSavedPlaces();
    })));
    if (!data.stages.length) stageContainer.append(makeMessage('No saved stages yet. Select a nearby stop or local stage and save it.'));
    data.stages.forEach((stage) => stageContainer.append(makeResultButton(stage.name, stage.source || 'Saved stage', () => {
      if (Number.isFinite(stage.lat) && Number.isFinite(stage.lon)) {
        showSelectedPlace({ ...stage, label: stage.name }, 'search');
        showStopDetails(stage, 'stages');
        loadNearby(stage, Number(radiusInput.value));
      } else {
        const local = stages.find((item) => item.id === stage.id);
        if (local) locateLocalStage(local);
      }
    })));
  }

  function renderRecentSearches(searches) {
    const container = document.querySelector('#recent-searches');
    container.replaceChildren();
    if (!searches.length) return;
    const label = document.createElement('span');
    label.textContent = 'Recent:';
    container.append(label);
    searches.forEach((query) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'recent-search';
      button.textContent = query;
      button.addEventListener('click', () => {
        queryInput.value = query;
        searchLocation(query);
      });
      container.append(button);
    });
  }

  function showPanel(panelName) {
    const isSaved = panelName === 'saved';
    nearbyPanel.hidden = isSaved;
    savedPanel.hidden = !isSaved;
    document.querySelectorAll('[data-map-panel]').forEach((button) => {
      const active = button.dataset.mapPanel === panelName;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (isSaved) renderSavedPlaces();
  }

  function clearTransitMarkers() {
    transitMarkers.clearLayers();
  }

  function makeResultButton(title, subtitle, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stop-result';
    const name = document.createElement('strong');
    const detail = document.createElement('span');
    name.textContent = title;
    detail.textContent = subtitle;
    button.append(name, detail);
    button.addEventListener('click', onClick);
    return button;
  }

  function makeMessage(text) {
    const message = document.createElement('p');
    message.className = 'empty-state';
    message.textContent = text;
    return message;
  }
}

function getTransitlandKey() {
  try {
    return localStorage.getItem('transitland-api-key') || '';
  } catch {
    return '';
  }
}
