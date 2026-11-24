import { formatFareRange, getSavedRoutes, loadRoutes } from './routes-data.js';

const directory = document.querySelector('#route-directory');
const search = document.querySelector('#directory-search');
const typeFilter = document.querySelector('#type-filter');
const operatorFilter = document.querySelector('#operator-filter');
const maxFareFilter = document.querySelector('#max-fare-filter');
const count = document.querySelector('#directory-count');
const error = document.querySelector('#directory-error');
let routes = [];
const favorites = getSavedRoutes();

function routeCard(route) {
  const kind = route.type === 'Express' ? 'service-tag express' : 'service-tag';
  return `<article class="directory-card"><div class="route-card-top"><div><h3>${escapeHTML(route.name)}</h3><p class="route-endpoints">${escapeHTML(route.origin)} <span aria-hidden="true">&#8594;</span> ${escapeHTML(route.destination)}</p></div><span class="${kind}">${escapeHTML(route.type)}</span></div>
    <div class="route-card-facts"><div><span class="fact-label">Operator</span><span class="fact-value">${escapeHTML(route.operator)}</span></div><div><span class="fact-label">Indicative fare range</span><span class="fact-value">${formatFareRange(route.fareMin, route.fareMax)}</span></div><div><span class="fact-label">Journey time</span><span class="fact-value">${escapeHTML(route.duration)}</span></div><div><span class="fact-label">Operating hours</span><span class="fact-value">${escapeHTML(route.operatingHours)}</span></div><div><span class="fact-label">Peak hours</span><span class="fact-value">${escapeHTML(route.peakHours)}</span></div></div>
    <ul class="route-stages" aria-label="${escapeHTML(route.name)} stops">${route.stages.map((stage) => `<li>${escapeHTML(stage.name)}</li>`).join('')}</ul><p class="route-endpoints">${favorites.includes(route.id) ? 'Saved to your favorites. ' : ''}${escapeHTML(route.description)}</p></article>`;
}

function renderDirectory() {
  const query = search.value.trim().toLowerCase();
  const matches = routes.filter((route) => {
    const matchesType = typeFilter.value === 'all' || route.type === typeFilter.value;
    const matchesOperator = operatorFilter.value === 'all' || route.operator === operatorFilter.value;
    const matchesFare = maxFareFilter.value === 'all' || route.fareMax <= Number(maxFareFilter.value);
    return matchesType && matchesOperator && matchesFare && [route.name, route.origin, route.destination, route.operator, ...route.stages.map((stage) => stage.name)].join(' ').toLowerCase().includes(query);
  });
  directory.innerHTML = matches.length ? matches.map(routeCard).join('') : '<p class="empty-state">No routes match your search.</p>';
  count.textContent = `${matches.length} ${matches.length === 1 ? 'route' : 'routes'} in the directory.`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

search.addEventListener('input', renderDirectory);
typeFilter.addEventListener('change', renderDirectory);
operatorFilter.addEventListener('change', renderDirectory);
maxFareFilter.addEventListener('change', renderDirectory);
try {
  routes = await loadRoutes();
  renderDirectory();
} catch {
  count.textContent = 'Route data is unavailable.';
  error.hidden = false;
}
