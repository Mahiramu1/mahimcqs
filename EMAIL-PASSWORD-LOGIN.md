# MahiMCQs — email and password login / Hostinger deployment

The application now uses Firebase Authentication **Email/Password** for login, account creation, forgot-password recovery, session persistence and logout. It no longer presents Google or mobile OTP sign-in. Passwords are handled by Firebase Authentication, **not** MySQL or the Express server.

## 1. Enable the authentication provider — required

1. Open https://console.firebase.google.com and choose the **same Firebase project** configured for MahiMCQs.
2. In **Authentication → Sign-in method**, enable **Email/Password** (password sign-in). Email-link passwordless sign-in is not required.
3. **Only after arranging migration for existing Google/phone users**, disable **Google** and **Phone** sign-in providers there.
4. In **Authentication → Settings → Authorized domains**, confirm `mahimcqs.com`, `www.mahimcqs.com` (if used), and the actual staging hostname.
5. Review **Authentication → Templates** to ensure password-reset (and optional verification) emails have an appropriate sender/domain. Test delivery from a new account.
6. Deploy the checked-in Firestore and Storage rules using the Firebase CLI on your Firebase project:
   `firebase deploy --only firestore:rules,storage`
   Firebase rules and provider settings are **not** deployed by Hostinger or a GitHub commit.

The client, API middleware and proposed security rules require `firebase.sign_in_provider === 'password'`. The API middleware will reject Google/phone tokens; the updated security rules enforce the same on PDF/book access when deployed.

## 2. Important: existing student accounts

Changing sign-in methods does not automatically convert users. Firestore books and saved questions are stored under each Firebase user's unique ID (UID).

- Students who previously registered with a Google account or mobile OTP **must migrate/attach a password credential to their existing Firebase user** to keep access to their books.
- Do not delete old Firebase users or blindly create replacement users and expect books to appear: a new UID has a different library.
- Arrange a tested migration for existing accounts, then disable legacy providers. For a brand-new project without existing real users, you can disable them immediately.
- Existing sessions signed in through Google/phone are signed out by the app; backend routes and new Firebase rules reject their access as well.

## 3. Hostinger Node.js configuration

This GitHub app is Vite + React and Express. It requires a Hostinger plan with Node.js support and cannot be deployed as a static-only Horizons/Website Builder app **without replacing that separate site**.

Repository: https://github.com/Mahiramu1/mahimcqs
Branch: `main`
Node: version 22
Install: `npm ci`
Build: `npm run build`
Server: `npm start` (starts `server/index.js`)
Health check: `https://YOUR_HOST/api/health` should return `{"ok":true,"service":"MahiMCQs API"}`

**Build-time public values** (Firebase Console → Project settings → Your apps → Web app):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_APP_ID`

**Server-only values** (Hostinger environment; never commit them or use `VITE_`):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` (or application default credentials)
- `GEMINI_API_KEY` for AI generation
- Optional `GEMINI_MODEL`, `PORT`

The Firebase frontend and Admin backend must use the **same Firebase project**. Vite bakes `VITE_` variables into the compiled client bundle, so **rebuild** whenever they change.

## 4. Verify the switch

1. Run `npm ci && npm run check` before deployment. Run the GitHub Actions workflow on `main`.
2. On staging, open the app in Chrome and Android Chrome. Confirm only the email/password form appears.
3. Create a test student account with an email and an 8+ character password. Log out, log in, and refresh the page to confirm persistent session.
4. Use Forgot password to test Firebase's reset email. Test an incorrect password and a duplicate registration.
5. Upload a small PDF, generate/save questions, and confirm the same account sees its records after another login.
6. Test that a Google/phone session cannot access the protected API or another student's Firestore and Storage data.
7. Verify that the Node API and Firebase security rules deploy successfully before switching production DNS or overwriting any existing site.

**Deployment note:** GitHub commit/CI success is not Hostinger deployment. A separate Hostinger Horizons site will not update from this repository automatically.
