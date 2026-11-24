import { firebaseConfig, firebaseIsConfigured } from './firebase-config.js';

const form = document.querySelector('#account-form');
const nameField = document.querySelector('#account-name-field');
const confirmField = document.querySelector('#confirm-password-field');
const emailInput = document.querySelector('#account-email');
const passwordInput = document.querySelector('#account-password');
const confirmInput = document.querySelector('#confirm-password');
const formTitle = document.querySelector('#account-form-title');
const submitButton = document.querySelector('#account-submit');
const modeButton = document.querySelector('#account-mode-toggle');
const resetButton = document.querySelector('#reset-password');
const status = document.querySelector('#account-status');
const setupMessage = document.querySelector('#firebase-setup-message');
const accountPanel = document.querySelector('#account-session');
const accountEmail = document.querySelector('#signed-in-email');
const signOutButton = document.querySelector('#sign-out');
const verifyButton = document.querySelector('#resend-verification');
const refreshVerificationButton = document.querySelector('#refresh-verification');

let mode = 'signup';
let auth;
let authSdk;

if (!firebaseIsConfigured) {
  setupMessage.hidden = false;
  form.hidden = true;
  status.textContent = 'Account registration is not connected yet.';
} else {
  try {
    const [appSdk, loadedAuthSdk] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js'),
    ]);
    const app = appSdk.initializeApp(firebaseConfig);
    authSdk = loadedAuthSdk;
    auth = authSdk.getAuth(app);
    authSdk.onAuthStateChanged(auth, updateSession);
    setupMessage.hidden = true;
  } catch (error) {
    console.error('Firebase Auth could not initialize:', error);
    status.textContent = 'Account services could not connect. Please try again later.';
    form.querySelectorAll('button, input').forEach((control) => { control.disabled = true; });
  }
}

modeButton.addEventListener('click', () => {
  mode = mode === 'signup' ? 'signin' : 'signup';
  nameField.hidden = mode !== 'signup';
  confirmField.hidden = mode !== 'signup';
  document.querySelector('#account-name').required = mode === 'signup';
  confirmInput.required = mode === 'signup';
  formTitle.textContent = mode === 'signup' ? 'Create your account' : 'Sign in';
  submitButton.textContent = mode === 'signup' ? 'Create account' : 'Sign in';
  modeButton.textContent = mode === 'signup' ? 'Already registered? Sign in' : 'New here? Create an account';
  passwordInput.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  confirmInput.disabled = mode !== 'signup';
  confirmInput.value = '';
  setStatus('');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!auth || !authSdk) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  setBusy(true);
  try {
    if (mode === 'signup') {
      if (password !== confirmInput.value) {
        setStatus('The passwords do not match.', 'error');
        return;
      }
      const credential = await authSdk.createUserWithEmailAndPassword(auth, email, password);
      try {
        await authSdk.updateProfile(credential.user, {
          displayName: document.querySelector('#account-name').value.trim(),
        });
      } catch (profileError) {
        console.error('Could not save the account display name:', profileError);
      }
      try {
        await authSdk.sendEmailVerification(credential.user);
        setStatus('Your account is created. Check your email for a verification link.', 'success');
      } catch (verificationError) {
        console.error('Could not send the verification email:', verificationError);
        setStatus('Your account was created, but the verification email could not be sent. Use Resend verification email below.', 'error');
      }
    } else {
      const credential = await authSdk.signInWithEmailAndPassword(auth, email, password);
      await credential.user.reload();
      if (!credential.user.emailVerified) {
        await authSdk.sendEmailVerification(credential.user);
        setStatus('Please verify your email using the link we just sent. You can resend it below.', 'error');
        return;
      }
      setStatus('You are signed in.', 'success');
    }
  } catch (error) {
    setStatus(messageForAuthError(error), 'error');
  } finally {
    setBusy(false);
  }
});

resetButton.addEventListener('click', async () => {
  if (!auth || !authSdk) return;
  const email = emailInput.value.trim();
  if (!emailInput.checkValidity()) {
    emailInput.focus();
    emailInput.reportValidity();
    setStatus('Enter a valid email address first, then choose Reset password.', 'error');
    return;
  }
  resetButton.disabled = true;
  try {
    await authSdk.sendPasswordResetEmail(auth, email);
  } catch (error) {
    if (error.code !== 'auth/user-not-found' && error.code !== 'auth/invalid-email') {
      setStatus(messageForAuthError(error), 'error');
      resetButton.disabled = false;
      return;
    }
  }
  setStatus('If an account uses that email, a password reset link has been sent.', 'success');
  resetButton.disabled = false;
});

verifyButton.addEventListener('click', async () => {
  const user = auth?.currentUser;
  if (!user || !authSdk) return;
  verifyButton.disabled = true;
  try {
    await authSdk.sendEmailVerification(user);
    setStatus('Verification email sent. Check your inbox and spam folder.', 'success');
  } catch (error) {
    setStatus(messageForAuthError(error), 'error');
  } finally {
    verifyButton.disabled = false;
  }
});

signOutButton.addEventListener('click', async () => {
  if (!auth || !authSdk) return;
  try {
    await authSdk.signOut(auth);
    setStatus('You are signed out.', 'success');
  } catch (error) {
    setStatus(messageForAuthError(error), 'error');
  }
});

refreshVerificationButton.addEventListener('click', async () => {
  const user = auth?.currentUser;
  if (!user) return;
  try {
    await user.reload();
    updateSession(auth.currentUser);
    setStatus(user.emailVerified ? 'Your email is verified.' : 'We do not see verification yet. Open the link in your email, then try again.', user.emailVerified ? 'success' : '');
  } catch (error) {
    setStatus(messageForAuthError(error), 'error');
  }
});

function updateSession(user) {
  const signedIn = Boolean(user);
  form.hidden = signedIn || !firebaseIsConfigured;
  accountPanel.hidden = !signedIn;
  if (!user) return;

  accountEmail.textContent = user.email || user.displayName || 'Your account';
  const verified = user.emailVerified;
  document.querySelector('#verification-state').textContent = verified
    ? 'Your email is verified.'
    : 'Verify your email address to finish setting up your account.';
  verifyButton.hidden = verified;
  refreshVerificationButton.hidden = verified;
}

function setBusy(isBusy) {
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in';
}

function setStatus(message, kind = '') {
  status.textContent = message;
  status.dataset.kind = kind;
}

function messageForAuthError(error) {
  if (error.code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (error.code === 'auth/weak-password') return 'Choose a longer password with at least 15 characters.';
  if (error.code === 'auth/too-many-requests') return 'Too many attempts. Wait a while and try again.';
  if (error.code === 'auth/network-request-failed') return 'The account service could not be reached. Check your connection and try again.';
  return mode === 'signup'
    ? 'We could not create the account with those details. Check them and try again.'
    : 'We could not sign you in with those details. Check them and try again.';
}
