# MahiMCQs - application setup

This repository contains a **working-code foundation**, not a finished production SaaS. Changes are merged to the main branch only after GitHub CI checks pass. Do not add secrets to GitHub.

## Local
- Install Node.js 20.19+ or 22.12+.
- Run `npm install`.
- Copy `.env.example` to `.env` and fill in Firebase project values and the server-only GEMINI_API_KEY.
- Create a Firebase project, add a Web App, **enable Email/Password authentication** (not email-link login), and create Firestore and Storage. See [EMAIL-PASSWORD-LOGIN.md](EMAIL-PASSWORD-LOGIN.md).
- In Firebase Authentication > Settings > Authorized domains, add your development and production domains.
- Deploy `firestore.rules` and `storage.rules` with `firebase deploy --only firestore:rules,storage` after reviewing them.
- Provide Firebase Admin credentials using Application Default Credentials or server environment variables (never VITE_ variables).
- Run `npm run server` in one terminal and `npm run dev` in another.
- Open the local Vite address.

## Deployment to Hostinger
The project requires a Node.js server (not a drag-and-drop Hostinger Website Builder static site). Hostinger plan must support persistent Node.js apps. Build with `npm install && npm run build`, then run `npm start` from the project root. Set all runtime server secrets in deployment environment; set VITE_ public settings at build time. Point your domain to the server as described by Hostinger for your plan. Don't repoint the live domain until a staging deployment passes manual tests.

## Implemented
Email/password sign-in, registration, password reset, user-scoped Firebase book upload, PDF rendering + text extraction, manual text correction, Gemini generation via authenticated backend, basic Firestore caching, save question sets, server-scored quiz attempts, JSON question export, delete book, English/Telugu generation selection, responsive desktop/mobile layout.

## Incomplete — do not market as ready
Production OCR (including Telugu), verified PYQ ingestion, current affairs, prediction mode, PDF export, admin controls, subscriptions, quotas, comprehensive server-side page provenance, concurrency fencing/robust durable background generation, ownership-safe deletion of saved child records, tests, and production review. The server currently trusts client-provided page text after confirming book ownership; it does not verify it matches the stored PDF page. The cache generation-lock handling is simplified and does NOT guarantee exactly-once requests. Firebase SDK and Gemini credentials are required. GitHub CI runs the production build and available tests; Firebase sign-in must still be tested using a configured project and live deployment.

## Important checks before launch
Test with a text PDF, a scanned PDF, a second account, concurrent generation requests, slow Gemini requests, private storage and Firestore access, large uploads, and Telugu output. Validate every generated question against the original PDF; AI can make mistakes. Configure budget and rate limits server-side.
