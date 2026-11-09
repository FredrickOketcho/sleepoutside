import { getCartItems, renderListWithTemplate } from './utils.mjs';

function cartItemTemplate(item) {
  const productUrl = `../product_pages/index.html?product=${encodeURIComponent(item.Id)}`;
  const quantity = Number(item.quantity) || 1;
  const price = Number(item.FinalPrice);

  return `<li class="cart-card divider">
  <a href="${productUrl}" class="cart-card__image">
    <img src="${item.Image}" alt="${item.Name}" />
  </a>
  <a href="${productUrl}">
    <h2 class="card__name">${item.Name}</h2>
  </a>
  <p class="cart-card__color">${item.Colors[0].ColorName}</p>
  <p class="cart-card__quantity">qty: ${quantity}</p>
  <p class="cart-card__price">$${price.toFixed(2)}</p>
</li>`;
}

export default class ShoppingCart {
  constructor(listElement) {
    this.listElement = listElement;
  }

  init() {
    const cartItems = getCartItems();
    this.renderList(cartItems);
    this.renderSummary(cartItems);
  }

  renderList(cartItems) {
    renderListWithTemplate(
      cartItemTemplate,
      this.listElement,
      cartItems,
      'afterbegin',
      true,
    );
  }

  renderSummary(cartItems) {
    const itemCount = cartItems.reduce(
      (count, item) => count + (Number(item.quantity) || 1),
      0,
    );
    const subtotal = cartItems.reduce(
      (total, item) =>
        total + Number(item.FinalPrice) * (Number(item.quantity) || 1),
      0,
    );
    document.querySelector('#cart-item-count').textContent = String(itemCount);
    document.querySelector('#cart-subtotal').textContent =
      `$${subtotal.toFixed(2)}`;
    document.querySelector('#cart-checkout').hidden = itemCount === 0;
    document.querySelector('#empty-cart-message').hidden = itemCount > 0;
  }
}
