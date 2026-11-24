# Enable customer email accounts

The account page uses Firebase Authentication. The Firebase web app configuration is intentionally blank until a project is created. No user can register or sign in until setup is complete.

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/) and register a Web app in that project.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Authentication → Settings → Authorized domains**, add the exact Render hostname for this site and any custom domain.
4. In **Project settings → General → Your apps**, copy the Web app configuration values for `apiKey`, `authDomain`, `projectId`, and `appId` into `scripts/firebase-config.js`.
5. In Authentication settings, set the password policy minimum to 15 characters. The page checks the same minimum and accepts passphrases.
6. In Authentication email templates, review the verification and password reset messages and set their return URLs to this site.
7. Keep the Firebase web API key restricted to this site's HTTP referrers. If you change its API allowlist, preserve Firebase Authentication's required Identity Toolkit API and Token Service API. Firebase web config is public by design; never put a service account key in this site.
8. Enable email enumeration protection and review/tighten the Identity Toolkit API quota in Firebase/Google Cloud settings to reduce account-discovery and brute-force abuse.

The sign-up page creates an account with a display name and email, sends a verification message, supports sign-in and password reset, and lets a signed-in user sign out. It does not collect a home address. Phone sign-in is not enabled; it needs SMS verification, reCAPTCHA, consent language, and abuse/cost limits configured in Firebase.

The account feature currently authenticates users only. Saved routes and stages remain in browser storage and do not sync across devices. Do not describe favorites as account-synced unless a protected database and security rules are added.
