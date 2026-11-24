import ExternalServices from './ExternalServices.mjs';
import { loadHeaderFooter } from './utils.mjs';

loadHeaderFooter();

const form = document.querySelector('#signup-form');
const submitButton = document.querySelector('#signup-submit');
const message = document.querySelector('#signup-message');
const avatarInput = document.querySelector('#avatar');
const avatarPreview = document.querySelector('#avatar-preview');
const services = new ExternalServices();

avatarInput.addEventListener('input', () => {
  const avatarUrl = avatarInput.value.trim();
  avatarPreview.hidden = !avatarUrl || !avatarInput.validity.valid;
  if (avatarPreview.hidden) {
    avatarPreview.removeAttribute('src');
    return;
  }
  avatarPreview.src = avatarUrl;
});

avatarPreview.addEventListener('error', () => {
  avatarPreview.hidden = true;
  avatarPreview.removeAttribute('src');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const address = [
    formData.get('address'),
    formData.get('city'),
    formData.get('region'),
    formData.get('postalCode'),
  ].map((part) => String(part).trim()).join(', ');
  const avatar = String(formData.get('avatar')).trim();
  const user = {
    name: String(formData.get('name')).trim(),
    email: String(formData.get('email')).trim(),
    address,
    ...(avatar ? { avatar } : {}),
  };

  submitButton.disabled = true;
  message.textContent = 'Creating your account...';

  try {
    await services.createUser(user);
    form.reset();
    avatarPreview.hidden = true;
    avatarPreview.removeAttribute('src');
    message.textContent = 'Your account was created successfully.';
  } catch (error) {
    const detail = typeof error.message === 'string'
      ? error.message
      : error.message?.message;
    message.textContent = detail || 'We could not create your account. Please try again.';
  } finally {
    submitButton.disabled = false;
  }
});
