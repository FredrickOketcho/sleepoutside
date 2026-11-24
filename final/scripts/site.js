document.querySelectorAll('.menu-toggle').forEach((button) => {
  const navigation = document.getElementById(button.getAttribute('aria-controls'));
  if (!navigation) return;

  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    button.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navigation.classList.toggle('is-open', !isOpen);
  });
});

const themeOptions = [
  ['pure-white', 'Pure White'],
  ['off-white', 'Soft Off-White'],
  ['warm-cream', 'Warm Cream'],
  ['cool-gray', 'Cool Slate Gray'],
  ['dark-charcoal', 'Soft Charcoal'],
  ['dark-navy', 'Deep Navy Slate'],
];
const navigation = document.querySelector('.primary-navigation');

if (navigation) {
  const headerInner = navigation.closest('.header-inner');
  const label = document.createElement('label');
  label.className = 'theme-control';
  label.htmlFor = 'theme-select';
  label.textContent = 'Theme';

  const select = document.createElement('select');
  select.id = 'theme-select';
  select.setAttribute('aria-label', 'Choose site color theme');
  themeOptions.forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.append(option);
  });

  let savedTheme = 'off-white';
  try {
    savedTheme = localStorage.getItem('kampala-fare-theme') || savedTheme;
  } catch {
    // Keep the default theme if browser storage is unavailable.
  }
  if (!themeOptions.some(([value]) => value === savedTheme)) savedTheme = 'off-white';
  document.documentElement.dataset.theme = savedTheme;
  select.value = savedTheme;

  select.addEventListener('change', () => {
    document.documentElement.dataset.theme = select.value;
    try {
      localStorage.setItem('kampala-fare-theme', select.value);
    } catch {
      // Theme still applies for this page when browser storage is unavailable.
    }
  });

  label.append(select);
  headerInner.append(label);
}

const footerInner = document.querySelector('.footer-inner');
if (footerInner && !footerInner.querySelector('.data-attribution')) {
  const attribution = document.createElement('p');
  attribution.className = 'data-attribution';
  attribution.append('Place search and map data © ');
  const osmLink = document.createElement('a');
  osmLink.href = 'https://www.openstreetmap.org/copyright';
  osmLink.target = '_blank';
  osmLink.rel = 'noopener noreferrer';
  osmLink.textContent = 'OpenStreetMap contributors';
  attribution.append(osmLink, '. Transit stop listings via Transitland.');
  footerInner.append(attribution);
}
