# Deploy MahiMCQs to Hostinger

Use a Hostinger Node.js application that can run the Express server. Use Node 22 and keep the frontend and API on the same origin. The web root is served by Express from Vite’s `dist/` directory. Configure `npm run build` as the build command and `server/index.js` as the entry file, or use `npm start` if the hosting panel expects an npm start command. Keep Hostinger’s assigned `PORT`.

## Configuration

| Phase | Variables |
| --- | --- |
| Vite build | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID` |
| Express runtime | `FIREBASE_PROJECT_ID` and either application default credentials or `FIREBASE_CLIENT_EMAIL` with `FIREBASE_PRIVATE_KEY` |
| New AI study material | `OPENAI_API_KEY`, with optional `OPENAI_TEXT_MODEL` (default `gpt-4.1-mini`; use a model supporting strict structured output) |
| Original quiz and prediction tools | `GEMINI_API_KEY`, with optional `GEMINI_MODEL` |
| Runtime | `PORT` supplied by the host |

Use the existing Firebase project values to retain accounts and data. Keep server secrets in the hosting environment. Add the staging and production hosts to the Firebase Authentication configuration as appropriate. Configure the Storage bucket CORS policy to permit `GET` from the app origins for authenticated browser downloads. Review previously issued Firebase download tokens separately if their URLs were distributed.

## Staging rollout

1. Create a separate Firebase staging project or use a designated staging project. Enable Email/Password authentication and provision Firestore and Storage. Publish the checked-in rules to staging using `firebase deploy --only firestore:rules,storage --project STAGING_PROJECT_ID`.
2. Run `npm ci` and `npm run check`. Deploy the development branch to a staging Node.js app with the required settings. Verify that `/api/health` responds and that the home page loads.
3. Register a staging student, sign in, and upload a PDF. Check page navigation, progress restoration, bookmarks, and multi-page generation in separate and combined modes. Check an English and a Telugu document, including scanned pages. Try the same generation configuration twice and confirm the cache indicator.
4. Reopen saved material, check answers, verify progress, and print a PDF. Sign in with another staging user and verify that private PDFs, notes, materials, and attempts are inaccessible. Smoke-test the original quiz and sourced-content workflows.
5. Apply the additive rules to production and release the reviewed Node.js build after staging verification. The homepage and API should both use HTTPS on the canonical domain. Retain the previous application build for rollback.

Firestore creates `study_material` and per-book `reader_notes` documents on demand. Existing books, saved quizzes, and attempts use their original paths. No data migration or backfill is required.
