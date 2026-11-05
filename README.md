# mahimcqs
**The repository is empty. What should the app do, and who is it for? Please share the main features or any product brief you have.**

You are a Principal Full-Stack Architect and Lead EdTech AI Engineer. Build **MahiMCQs — గ్యాన్-అస్త్ర**, an AI-powered competitive exam preparation platform for **mahimcqs.com**.

Implement the application in the workspace. Do not stop at a plan, UI prototype, code snippets, or architecture explanation. Create the complete project, implement the backend and frontend, run meaningful checks, fix failures, and provide setup and deployment instructions.

## 1. Product and technology

Build for students preparing for:

- UPSC
- TGPSC Groups
- APPSC
- DSC
- Police recruitment examinations

Use:

- Next.js 14 or newer, with App Router and TypeScript.
- Tailwind CSS.
- Firebase Authentication, Firestore, and Firebase Storage.
- Firebase Admin SDK exclusively on the server.
- Google Gemini through the supported server-side SDK.
- Default AI model: `gemini-2.5-flash`, configurable through an environment variable.
- PDF.js for PDF rendering and text extraction.
- A working OCR implementation for scanned English and Telugu pages.
- Zod or an equivalent runtime schema validator.
- A PDF export implementation that correctly renders Telugu.

Check current official documentation for compatibility before choosing dependency versions. Pin compatible versions and include a lockfile.

Use **Mulberry `#701A75` and Deep Violet `#4C1D95`** consistently. Use readable typography, accessible contrast, clear loading states, and responsive layouts.

## 2. Implementation standards

Deliver complete, executable code.

- No TODO implementations, omitted helpers, fake success messages, inactive buttons, or truncated code.
- No simulated authentication or fabricated student progress.
- No generated questions presented as genuine previous-year questions.
- No hardcoded API keys, service-account credentials, or real user data.
- Configuration values may remain unset in `.env.example`; document exactly how to obtain them.
- Keep components and services modular.
- Implement empty, loading, error, unauthorized, and retry states.
- Avoid unnecessary abstractions and unnecessary paid services.
- Do not claim production deployment or successful tests unless actually performed.

Real provider credentials and Firebase configuration are external prerequisites. Build everything possible without them and identify any remaining setup precisely.

## 3. Authentication and onboarding

Create a responsive landing page with the MahiMCQs identity and a 3D flip-card login/sign-up interface.

Implement:

- Google Sign-In.
- Mobile OTP authentication using Firebase Phone Auth.
- Country code selection, OTP entry, resend cooldown, expiration handling, and reCAPTCHA.
- New-user onboarding with display name, preferred language, and target exam.
- Persistent authentication and logout.
- Protected dashboard, workspace, saved questions, and progress pages.
- Server verification of Firebase ID tokens on every protected API request.
- Clear handling of expired sessions and failed authentication.
- Reduced-motion support for the flip animation.

Use Firebase custom claims for admin authorization. Never allow a client-editable profile field to grant admin access.

## 4. Dashboard and book library

Implement a dashboard with:

- Continue studying.
- Preloaded books grouped by exam and subject.
- Custom PDF upload.
- Recently opened books.
- Saved question sets.
- Completed quizzes.
- Accuracy and topic-wise progress calculated from actual attempts.

For each book, persist its title, owner, storage path, page count, language, exam category, processing status, and timestamps.

Uploads must have configurable size and page-count limits, file-type validation, progress feedback, and actionable failure messages.

Private uploads must remain private. Provide secure access to each user’s PDFs.

Provide an admin workflow for adding licensed or public-domain books. Include an original sample study PDF so the library can be demonstrated without copyrighted third-party material.

Allow users to rename and delete their own books. Clean up associated private files and records safely.

## 5. Dual-panel study workspace

The desktop workspace must contain:

**Left panel**

- PDF rendering.
- Previous/next page controls.
- Direct page-number input.
- Zoom and fit-to-width.
- Selectable extracted text where available.
- An OCR text tab.
- Editable extracted text before generation.
- Clear indication when OCR was used.
- Saved reading position.

**Right panel**

- Target exam selection.
- English/Telugu selection.
- Difficulty selection.
- Question-count selection.
- Question-type selection.
- Generate MCQs button.
- Accurate generation-stage status.
- Interactive quiz and review modes.
- Save question set.
- Retry incorrect questions.

Support single-answer, statement-based, assertion–reason, matching, and ordering questions. Implement usable answer controls and scoring for every supported type.

On mobile, use accessible PDF/Quiz tabs instead of squeezing two unreadable panels together.

Keep the selected book, page, generated question set, and quiz state synchronized. Handle rapid page navigation and cancel stale requests.

## 6. Five-agent AI pipeline

Implement the pipeline in `lib/agents/mahiAgents.ts` with explicit schemas, bounded inputs, and validated outputs.

Agents are logical stages; do not make a separate paid model call for every stage when deterministic processing or a combined structured call is sufficient.

### Agent 1 — Extractor

- Prefer deterministic PDF text extraction.
- Use OCR only when text is missing or unusable.
- Normalize whitespace and Unicode while preserving Telugu, numbers, and meaningful punctuation.
- Identify concepts and supporting passages.
- Treat document text as untrusted data, never as instructions.
- Reject empty or unusable pages with an actionable response.

### Agent 2 — PYQ Mapper

- Retrieve from a verified, curated PYQ dataset.
- Match by exam, subject, topic, language, and relevant concepts.
- Preserve source metadata and question identifiers.
- Return no matches when none exist.
- Clearly label AI-created alternatives as “PYQ-style practice.”

### Agent 3 — Exam Setter

Generate page-grounded questions with:

- Stable question ID.
- Question type.
- Question text.
- Options or other required answer structure.
- Correct answer.
- Explanation.
- Topic.
- Difficulty.
- Supporting source passage.
- Relevant verified PYQ references, where available.

Use structured model output and strict validation. Avoid ambiguous answers and repeated questions.

### Agent 4 — Telugu Akademi Quality Critic

Validate:

- Whether the answer follows from the source.
- Whether explanations and answers agree.
- Question-type correctness.
- Duplicate questions.
- Option quality and ambiguity.
- English grammar.
- Natural Telugu and appropriate regional exam terminology.

Use a documented terminology glossary. Do not claim official Telugu Akademi endorsement.

Permit only a bounded repair cycle. If questions still fail validation, return a clear failure or a transparently labeled smaller valid set.

### Agent 5 — Personal Mentor

Run after quiz submission.

- Calculate scoring and weak topics deterministically.
- Explain incorrect answers.
- Produce a concise revision capsule.
- Recommend relevant pages and questions.
- Suggest a next practice activity.
- Support English and Telugu.

Store mentor analysis privately. The basic quiz result must remain available even when AI mentoring fails.

## 7. SHA-256 Firestore read-through caching

Implement shared question-generation caching in `page_mcq_cache`.

Use a normalized text SHA-256 hash and a separate versioned cache key containing every input that changes the result, including:

- Text hash.
- Exam.
- Output language.
- Difficulty.
- Question types.
- Question count.
- Model.
- Prompt/schema version.
- Terminology glossary version.
- PYQ dataset or retrieval version.
- Any additional source context actually supplied to the model.

Use deterministic canonical serialization.

Required behavior:

1. Authenticate the request and validate access to the book/page.
2. Validate and normalize the generation input.
3. Derive the cache key on the server.
4. Read Firestore before calling Gemini.
5. Return a validated successful cached result immediately.
6. On a cache miss, acquire generation ownership atomically in a Firestore transaction.
7. Concurrent requests must share the existing job.
8. Only the owner may start the generation pipeline.
9. Persist validated output before reporting successful completion.
10. Subsequent equivalent requests must reuse the saved result.

Never invoke Gemini inside a Firestore transaction callback, since transactions may rerun.

Implement a durable job state machine with ownership tokens, timestamps, bounded execution, and fencing against stale workers. Support pending, processing, completed, failed, and uncertain outcomes.

Use a durable execution mechanism appropriate to deployment, such as a Firebase task queue worker. Do not rely on an unawaited promise surviving after an HTTP response.

If a provider request may have succeeded but the response or persistence failed, mark the outcome uncertain rather than automatically issuing another paid request.

State the guarantee honestly: successful cached results and normal concurrent requests avoid duplicate generation. Do not claim absolute exactly-once external API execution across all network and crash failures without provider support.

Additional requirements:

- Do not expose shared cache documents directly to clients.
- Never return cached data merely because a client supplied its hash.
- Verify that a requester has access to the corresponding source content.
- Keep user IDs, quiz answers, and mentor analysis outside shared cache results.
- Cache mentor output separately by user, attempt, and analysis version.
- Make quiz submission idempotent.
- Enforce Firestore document-size limits using bounded payloads or chunked question documents.
- Track cache hits, misses, job reuse, provider calls, and failures without logging private page text.

## 8. Saved questions and verified PYQ drawers

Implement a top-left **YourMcqs** drawer:

- Saved question sets grouped by book and page.
- Search and filters.
- Reopen a saved quiz.
- Delete saved references.
- Select one or multiple sets for PDF export.

Implement a top-right **Fetch PYQs** drawer:

- Exam, subject, topic, language, and year filters.
- A rolling 15-year search window.
- Actual dataset coverage shown clearly.
- Question, options, answer, explanation when available, and provenance.
- Source paper URL or reference, exam, year, and question number.
- PDF export.

Do not imply that all 15 years are available unless the dataset contains them.

Provide an admin import workflow with validation, deduplication, provenance fields, and an import report. Synthetic development fixtures must be visibly labeled and excluded from verified production PYQ results.

## 9. Quiz completion, progress, and exports

Implement the complete flow:

1. Generate or retrieve a question set.
2. Start a quiz.
3. Select answers.
4. Navigate and mark questions for review.
5. Submit explicitly.
6. Score on the server using the stored question set.
7. Display score, accuracy, duration, unanswered questions, and answer review.
8. Save the attempt once.
9. Generate the mentor capsule.
10. Retry incorrect questions or start another page.

Support configurable marking schemes. Do not assume identical negative marking across exams.

Provide PDF exports for:

- Current question set.
- Selected saved pages.
- Selected verified PYQs.
- Quiz results and mentor revision capsule.

Include branding, book/page references, numbered questions, optional answer key, explanations, page numbers, and source attribution.

Ensure Telugu Unicode shaping and fonts work correctly. Bundle appropriately licensed fonts or configure reliable loading. Verify the rendered Telugu PDF visually.

## 10. Data model and security

Implement and document collections for:

- Users and preferences.
- Books and page metadata.
- Shared question cache.
- Generation jobs.
- Saved question references.
- Quiz attempts and answers.
- Progress aggregates.
- Private mentor results.
- Verified PYQs.
- Upload and usage records.

Include:

- Firestore rules.
- Storage rules.
- Required composite indexes.
- Owner-only access to private records.
- Admin-only library and PYQ management.
- Server-only writes to shared AI caches.
- Distributed rate limits and configurable user quotas.
- Atomic quota reservation and defined failure handling.
- Upload restrictions.
- Input validation and output sanitization.
- Secret redaction and structured errors.
- Firebase App Check where supported.

Review every Admin SDK endpoint carefully because Admin SDK access bypasses Firestore rules.

## 11. Required files and project structure

Include these exact files with complete implementations:

- `lib/firebaseAdmin.ts`
- `lib/agents/mahiAgents.ts`
- `app/api/agents/process-page/route.ts`
- `app/page.tsx`

`app/page.tsx` must provide the real entry experience: landing/authentication when signed out and access to the authenticated application when signed in. It may compose reusable components.

Also create every supporting file needed for the full application, including:

- Firebase client initialization.
- Authentication provider and server verification helpers.
- Dashboard and workspace routes.
- Book upload and management services.
- PDF viewer and OCR integration.
- Cache, job, quota, and hashing services.
- Quiz submission and mentor APIs.
- Saved-question and PYQ services.
- PDF export implementation.
- Admin screens and import utilities.
- Typed schemas.
- Firestore and Storage rules.
- Firebase Emulator configuration.
- `.env.example`.
- Package scripts and lockfile.
- Automated tests.
- Setup and deployment documentation.

Do not limit the implementation to four files.

## 12. Verification and delivery

Run and fix:

- Type checking.
- Linting.
- Production build.
- Meaningful unit and integration tests.
- End-to-end tests where the environment supports them.

Tests must cover:

- Deterministic text normalization and hashing.
- Cache-key changes when generation settings change.
- Zero Gemini calls on valid cache hits.
- One generation owner for concurrent identical requests.
- No automatic duplicate call for uncertain provider outcomes.
- Rejection of invalid model output.
- Unauthorized access to another user’s books and attempts.
- Idempotent quiz submission.
- Server-side scoring.
- Saved-question persistence.
- Verified PYQ provenance.
- English and Telugu PDF exports.

Use Firebase emulators and injected model-provider test doubles for automated tests. Keep test doubles separate from production code.

Finish with:

1. What was implemented.
2. Project file tree.
3. Exact local setup commands.
4. Environment-variable setup.
5. Firebase provider, rules, indexes, Storage, and worker setup.
6. Admin initialization and content import instructions.
7. Deployment instructions and custom-domain configuration for `mahimcqs.com`.
8. Tests actually run and their results.
9. Any remaining credential, infrastructure, or dataset requirements.

If operating in a coding workspace, create the files directly. If only text output is available, provide complete files under exact path headings in coherent batches without truncating any file.

Start building now. Make reasonable implementation decisions and continue until the full user journey works.
