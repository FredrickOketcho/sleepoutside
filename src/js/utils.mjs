// wrapper for querySelector...returns matching element
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function getParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

export function renderListWithTemplate(
  templateFn,
  parentElement,
  list,
  position = 'afterbegin',
  clear = false,
) {
  if (clear) {
    parentElement.innerHTML = '';
  }

  const html = list.map(templateFn).join('');
  parentElement.insertAdjacentHTML(position, html);
}

export function renderWithTemplate(template, parentElement, data, callback) {
  parentElement.innerHTML = template;
  if (callback) {
    callback(data);
  }
}

export async function loadTemplate(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load template at ${path}: ${response.status}`);
  }
  return response.text();
}

export async function loadHeaderFooter() {
  const headerElement = qs('#main-header');
  const footerElement = qs('#main-footer');
  if (!headerElement || !footerElement) {
    throw new Error('Header or footer placeholder is missing from this page.');
  }

  const [headerTemplate, footerTemplate] = await Promise.all([
    loadTemplate('/partials/header.html'),
    loadTemplate('/partials/footer.html'),
  ]);
  renderWithTemplate(headerTemplate, headerElement);
  renderWithTemplate(footerTemplate, footerElement);
}

// or a more concise version if you are into that sort of thing:
// export const qs = (selector, parent = document) => parent.querySelector(selector);

// retrieve data from localstorage
export function getLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}
export function getCartItems() {
  const cartItems = getLocalStorage('so-cart');
  if (Array.isArray(cartItems)) {
    return cartItems;
  }
  return cartItems ? [cartItems] : [];
}
// save data to local storage
export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
// set a listener for both touchend and click
export function setClick(selector, callback) {
  qs(selector).addEventListener('touchend', (event) => {
    event.preventDefault();
    callback();
  });
  qs(selector).addEventListener('click', callback);
}
