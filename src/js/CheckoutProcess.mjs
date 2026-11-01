import { getLocalStorage } from './utils.mjs';
import ExternalServices from './ExternalServices.mjs';

function formDataToJSON(formElement) {
  const formData = new FormData(formElement);
  const convertedJSON = {};

  formData.forEach((value, key) => {
    convertedJSON[key] = value;
  });

  return convertedJSON;
}

function packageItems(items) {
  return items.map((item) => ({
    id: item.Id,
    name: item.Name,
    price: Number(item.FinalPrice),
    quantity: Number(item.quantity) || 1,
  }));
}

export default class CheckoutProcess {
  constructor(key, outputSelector) {
    this.key = key;
    this.outputSelector = outputSelector;
    this.list = [];
    this.itemTotal = 0;
    this.shipping = 0;
    this.tax = 0;
    this.orderTotal = 0;
    this.services = new ExternalServices();
  }

  init() {
    const storedItems = getLocalStorage(this.key);
    this.list = Array.isArray(storedItems)
      ? storedItems
      : storedItems
        ? [storedItems]
        : [];
    this.calculateItemSubTotal();

    if (this.list.length === 0) {
      document.querySelector('#checkout-message').textContent =
        'Your cart is empty. Add an item before checking out.';
      document.querySelector('#checkout-submit').disabled = true;
    }
  }

  calculateItemSubTotal() {
    const itemCount = this.list.reduce(
      (count, item) => count + (Number(item.quantity) || 1),
      0,
    );
    this.itemTotal = this.list.reduce(
      (total, item) =>
        total + Number(item.FinalPrice) * (Number(item.quantity) || 1),
      0,
    );

    document.querySelector(
      `${this.outputSelector} #item-count`,
    ).textContent = String(itemCount);
    document.querySelector(
      `${this.outputSelector} #subtotal`,
    ).textContent = `$${this.itemTotal.toFixed(2)}`;
  }

  calculateOrderTotal() {
    const itemCount = this.list.reduce(
      (count, item) => count + (Number(item.quantity) || 1),
      0,
    );
    this.tax = Number((this.itemTotal * 0.06).toFixed(2));
    this.shipping = itemCount > 0 ? 10 + 2 * (itemCount - 1) : 0;
    this.orderTotal = Number(
      (this.itemTotal + this.tax + this.shipping).toFixed(2),
    );

    this.displayOrderTotals();
  }

  resetOrderTotals() {
    this.tax = 0;
    this.shipping = 0;
    this.orderTotal = 0;
    this.displayOrderTotals();
  }

  displayOrderTotals() {
    document.querySelector(
      `${this.outputSelector} #tax`,
    ).textContent = `$${this.tax.toFixed(2)}`;
    document.querySelector(
      `${this.outputSelector} #shipping`,
    ).textContent = `$${this.shipping.toFixed(2)}`;
    document.querySelector(
      `${this.outputSelector} #order-total`,
    ).textContent = `$${this.orderTotal.toFixed(2)}`;
  }

  async checkout(form) {
    const order = formDataToJSON(form);
    order.orderDate = new Date().toISOString();
    order.items = packageItems(this.list);
    order.orderTotal = this.orderTotal.toFixed(2);
    order.shipping = this.shipping;
    order.tax = this.tax.toFixed(2);

    return this.services.checkout(order);
  }
}
