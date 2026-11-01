import CheckoutProcess from './CheckoutProcess.mjs';

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
    message.textContent = 'Your order was submitted successfully.';
  } catch (error) {
    message.textContent = `Unable to submit your order: ${error.message}`;
    submitButton.disabled = false;
  }
});
