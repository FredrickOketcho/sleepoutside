import { formatFareRange, getSavedRoutes, loadRoutes, saveRoutes } from './routes-data.js';

const cards = document.querySelector('#featured-routes');
const search = document.querySelector('#route-search');
const count = document.querySelector('#results-count');
const error = document.querySelector('#home-error');
const dialog = document.querySelector('#route-dialog');
const routeFareLink = document.querySelector('#route-fare-link');
let routes = [];
let filter = 'all';
let favorites = getSavedRoutes();

function routeCard(route) {
  const isSaved = favorites.includes(route.id);
  const kind = route.type === 'Express' ? 'service-tag express' : 'service-tag';
  return `<article class="route-card">
    <div class="route-card-top"><div><h3>${escapeHTML(route.name)}</h3><p class="route-endpoints">${escapeHTML(route.origin)} <span aria-hidden="true">&#8594;</span> ${escapeHTML(route.destination)}</p></div><span class="${kind}">${escapeHTML(route.type)}</span></div>
    <div class="route-card-facts"><div><span class="fact-label">Operator</span><span class="fact-value">${escapeHTML(route.operator)}</span></div><div><span class="fact-label">Indicative fare range</span><span class="fact-value">${formatFareRange(route.fareMin, route.fareMax)}</span></div><div><span class="fact-label">Typical journey</span><span class="fact-value">${escapeHTML(route.duration)}</span></div><div><span class="fact-label">Peak hours</span><span class="fact-value">${escapeHTML(route.peakHours)}</span></div><div><span class="fact-label">Operating hours</span><span class="fact-value">${escapeHTML(route.operatingHours)}</span></div></div>
    <div class="route-card-actions"><button class="details-button" type="button" data-details="${escapeHTML(route.id)}">Route details</button><button class="favorite-button" type="button" data-favorite="${escapeHTML(route.id)}" aria-pressed="${isSaved}" aria-label="${isSaved ? 'Remove' : 'Save'} ${escapeHTML(route.name)} ${isSaved ? 'from' : 'to'} favorites">${isSaved ? '&#9733;' : '&#9734;'}</button></div>
  </article>`;
}

function renderRoutes() {
  const query = search.value.trim().toLowerCase();
  const shown = routes.filter((route) => {
    const matchesFilter = filter === 'all' || (filter === 'favorites' ? favorites.includes(route.id) : route.type === filter);
    const searchable = [route.name, route.origin, route.destination, ...route.stages.map((stage) => stage.name)].join(' ').toLowerCase();
    return matchesFilter && searchable.includes(query);
  }).slice(0, 6);
  cards.innerHTML = shown.length ? shown.map(routeCard).join('') : '<p class="empty-state">No matching routes. Try another search or service filter.</p>';
  count.textContent = `${shown.length} ${shown.length === 1 ? 'route' : 'routes'} shown${filter === 'favorites' ? ' in saved routes' : ''}.`;
}

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    renderRoutes();
  });
});

search.addEventListener('input', renderRoutes);
cards.addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-favorite]');
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    favorites = favorites.includes(id) ? favorites.filter((savedId) => savedId !== id) : [...favorites, id];
    try { saveRoutes(favorites); } catch (storageError) { console.error('Unable to save favorites:', storageError); }
    renderRoutes();
    return;
  }

  const detailsButton = event.target.closest('[data-details]');
  if (!detailsButton) return;
  const route = routes.find((item) => item.id === detailsButton.dataset.details);
  if (!route) return;
  dialog.querySelector('[data-dialog-title]').textContent = route.name;
  dialog.querySelector('[data-dialog-type]').textContent = route.type;
  dialog.querySelector('[data-dialog-description]').textContent = route.description;
  dialog.querySelector('[data-dialog-fare]').textContent = formatFareRange(route.fareMin, route.fareMax);
  dialog.querySelector('[data-dialog-stages]').textContent = route.stages.map((stage) => stage.name).join(' - ');
  dialog.querySelector('[data-dialog-hours]').textContent = route.operatingHours;
  dialog.querySelector('[data-dialog-peak]').textContent = route.peakHours;
  routeFareLink.href = `fare.html?route=${encodeURIComponent(route.id)}`;
  dialog.showModal();
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

dialog.addEventListener('click', (event) => {
  if (event.target === dialog || event.target.closest('[data-dialog-close]')) dialog.close();
});

try {
  routes = await loadRoutes();
  renderRoutes();
} catch {
  count.textContent = 'Route data is unavailable.';
  error.hidden = false;
}
