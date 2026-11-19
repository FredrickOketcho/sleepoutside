import CheckoutProcess from './CheckoutProcess.mjs';
import { loadHeaderFooter } from './utils.mjs';

loadHeaderFooter();

const checkout = new CheckoutProcess('so-cart', '.checkout-summary');
const form = document.querySelector('#checkout-form');
const zipInput = document.querySelector('#zip');
const submitButton = document.querySelector('#checkout-submit');
const message = document.querySelector('#checkout-message');

checkout.init();

zipInput.addEventListener('change', () => {
  if (zipInput.value.trim()) {
    checkout.calculateOrderTotal();
  } else {
    checkout.resetOrderTotals();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  checkout.calculateOrderTotal();
  submitButton.disabled = true;
  message.textContent = 'Submitting your order...';

  try {
    await checkout.checkout(form);
    localStorage.removeItem('so-cart');
    window.location.href = './success.html';
  } catch (error) {
    message.textContent = 'Please review the error message and try again.';
    submitButton.disabled = false;
  }
});
