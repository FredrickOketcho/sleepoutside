// Copy the web app configuration from Firebase Console > Project settings > Your apps.
// Firebase web config is public client configuration, not a service-account secret.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

export const firebaseIsConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim().length > 0,
);
