# Google / Gmail sign-in for MahiMCQs

MahiMCQs uses **Firebase Authentication Google provider**; never ask users to enter their Gmail password into the app. The Google button uses the popup flow and the existing Firebase ID-token-secured backend and user-scoped Firestore paths.

## Activate in Firebase (required before live login works)

1. In [Firebase Console](https://console.firebase.google.com/), select the Firebase project for MahiMCQs (or create a project and Web App).
2. Go to **Authentication → Sign-in method → Google**, enable the provider, choose the required support email, and save.
3. Go to **Authentication → Settings → Authorized domains** and add the actual deployment hostnames. For production, add `mahimcqs.com` and `www.mahimcqs.com` if both serve the app. For staging, add the specific `*.hostingersite.com` hostname *only if it serves this GitHub deployment*. Add `localhost` for local testing if needed.
4. Under Firebase **Project settings → Your apps → Web app**, obtain its public Firebase configuration. Configure these exact **build-time** environment variables in Hostinger:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN` (usually `<project-id>.firebaseapp.com`)
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_APP_ID`
5. **Rebuild and redeploy the GitHub Node/Vite app.** Vite substitutes `VITE_` variables at build time; simply editing Hostinger runtime variables without rebuilding does not update the site.
6. The protected API routes need Firebase Admin credentials on the **server only** (`FIREBASE_PROJECT_ID`, and `FIREBASE_CLIENT_EMAIL` plus `FIREBASE_PRIVATE_KEY`, or application default credentials). Do **not** expose private credentials with a `VITE_` prefix.
7. Run `npm ci && npm run check`. Start the API on the supported Hostinger Node plan with `npm start`. Open the actual domain and try Google login, reload, and logout. Test desktop Chrome and Android Chrome. Confirm a user cannot read another user's books.

### Troubleshooting
- **Not configured**: Missing `VITE_FIREBASE_*` values in the frontend build. Rebuild after setting them.
- **Unauthorized domain**: Add the actual host in Firebase authorized domains.
- **Operation not allowed**: Enable the Google provider in Firebase.
- **Blocked popup**: Open the website directly in Chrome and allow popups. The button invokes Google's popup within the click event.
- **Login works but API fails (401/500)**: Check that the Firebase Admin server credentials are from **the same Firebase project** as the frontend.
- **No change on live Hostinger site**: The live domain may still be using the separate Hostinger Horizons app instead of this GitHub deployment. Publishing a GitHub commit does not modify a separate Horizons site.

Firebase [Google web authentication documentation](https://firebase.google.com/docs/auth/web/google-signin) and [redirect flow caveats](https://firebase.google.com/docs/auth/web/redirect-best-practices).

This implementation intentionally does **not** automatically switch to `signInWithRedirect` on blocked popups. On non-Firebase hosting, redirect authentication can fail with third-party storage restrictions unless a first-party auth domain or reverse proxy is configured.
