import { formatFareRange, loadRoutes } from './routes-data.js';

const routeSelect = document.querySelector('#route-choice');
const passengerInput = document.querySelector('#passengers');
const total = document.querySelector('#estimate-total');
const detail = document.querySelector('#estimate-detail');
const error = document.querySelector('#fare-error');
const peakAdjustment = document.querySelector('#peak-adjustment');
const luggageAdjustment = document.querySelector('#luggage-adjustment');
let routes = [];

function updateEstimate() {
  const route = routes.find((item) => item.id === routeSelect.value);
  const passengers = Number(passengerInput.value);
  if (!route || !Number.isFinite(passengers) || passengers < 1) {
    total.textContent = 'Choose a route';
    detail.textContent = 'Per passenger estimates are shown in UGX.';
    return;
  }
  const fareRange = getFareRange(route);
  const multiplier = peakAdjustment.checked ? 1.2 : 1;
  const luggage = luggageAdjustment.checked ? 500 : 0;
  const minimum = roundToNearest500((fareRange.minimum * multiplier + luggage) * passengers);
  const maximum = roundToNearest500((fareRange.maximum * multiplier + luggage) * passengers);
  total.textContent = formatFareRange(minimum, maximum);
  const perPassenger = formatFareRange(
    roundToNearest500(fareRange.minimum * multiplier + luggage),
    roundToNearest500(fareRange.maximum * multiplier + luggage),
  );
  const distance = route.distanceKm ? ` Approx. route distance: ${route.distanceKm} km.` : '';
  detail.textContent = `${perPassenger} per passenger x ${passengers} ${passengers === 1 ? 'passenger' : 'passengers'}.${distance}`;
}

function getFareRange(route) {
  if (route.fareType === 'distance' && Number.isFinite(route.ratePerKm) && Number.isFinite(route.distanceKm)) {
    const estimate = Number(route.baseFare) + route.distanceKm * route.ratePerKm;
    return { minimum: estimate * 0.9, maximum: estimate * 1.1 };
  }
  return { minimum: Number(route.fareMin), maximum: Number(route.fareMax) };
}

function roundToNearest500(amount) {
  return Math.round(amount / 500) * 500;
}

routeSelect.addEventListener('change', updateEstimate);
passengerInput.addEventListener('input', updateEstimate);
peakAdjustment.addEventListener('change', updateEstimate);
luggageAdjustment.addEventListener('change', updateEstimate);
try {
  routes = await loadRoutes();
  const requested = new URLSearchParams(window.location.search).get('route');
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a route';
  routeSelect.replaceChildren(placeholder);
  routes.forEach((route) => {
    const option = document.createElement('option');
    option.value = route.id;
    option.textContent = `${route.name} - ${formatFareRange(route.fareMin, route.fareMax)}`;
    routeSelect.append(option);
  });
  if (routes.some((route) => route.id === requested)) routeSelect.value = requested;
  updateEstimate();
} catch {
  routeSelect.innerHTML = '<option value="">Route choices unavailable</option>';
  routeSelect.disabled = true;
  error.hidden = false;
}
