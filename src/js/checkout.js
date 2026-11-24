import CheckoutProcess from './CheckoutProcess.mjs';
import { loadHeaderFooter } from './utils.mjs';

loadHeaderFooter();

const checkout = new CheckoutProcess('so-cart', '.checkout-summary');
const form = document.querySelector('#checkout-form');
const zipInput = document.querySelector('#zip');
const submitButton = document.querySelector('#checkout-submit');
const message = document.querySelector('#checkout-message');

checkout.init();

function validatePaymentFields() {
  const cardInput = form.elements.cardNumber;
  const digits = cardInput.value.replace(/[ -]/g, '');
  const cardIsValid = /^\d{13,19}$/.test(digits) && passesLuhnCheck(digits);
  cardInput.setCustomValidity(
    cardInput.value && !cardIsValid
      ? 'Enter a valid card number with 13 to 19 digits.'
      : '',
  );

  const expirationInput = form.elements.expiration;
  const match = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.exec(expirationInput.value);
  let expirationIsValid = false;
  if (match) {
    const month = Number(match[1]);
    const year = Number(match[2].length === 2 ? `20${match[2]}` : match[2]);
    const now = new Date();
    expirationIsValid =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1);
  }
  expirationInput.setCustomValidity(
    expirationInput.value && !expirationIsValid
      ? 'Enter an expiration date that has not passed.'
      : '',
  );
}

function passesLuhnCheck(digits) {
  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function errorMessage(error) {
  const detail = error?.message;
  if (typeof detail === 'string') return detail;
  if (detail?.message && typeof detail.message === 'string') return detail.message;
  if (detail?.error && typeof detail.error === 'string') return detail.error;
  return 'We could not submit your order. Please check your details and try again.';
}

form.addEventListener('input', (event) => {
  if (event.target === form.elements.cardNumber || event.target === form.elements.expiration) {
    validatePaymentFields();
  }
  if (checkout.list.length && checkout.list.every((item) => checkout.isValidCartItem(item))) {
    message.textContent = '';
    message.dataset.state = '';
  }
});

zipInput.addEventListener('input', () => {
  if (zipInput.value.trim()) {
    checkout.calculateOrderTotal();
  } else {
    checkout.resetOrderTotals();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  validatePaymentFields();
  if (!form.reportValidity()) {
    message.textContent = 'Please correct the highlighted fields before placing your order.';
    message.dataset.state = 'error';
    return;
  }

  if (checkout.list.length === 0) {
    message.textContent = 'Your cart is empty. Add an item before checking out.';
    message.dataset.state = 'error';
    return;
  }

  checkout.calculateOrderTotal();
  submitButton.disabled = true;
  message.textContent = 'Submitting your order...';
  message.dataset.state = 'pending';

  try {
    await checkout.checkout(form);
    localStorage.removeItem('so-cart');
    window.location.href = './success.html';
  } catch (error) {
    message.textContent = errorMessage(error);
    message.dataset.state = 'error';
    submitButton.disabled = false;
  }
});
