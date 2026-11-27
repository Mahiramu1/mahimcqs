# MahiMCQs implementation plan

## Implemented on this branch

- Repository audit and isolated branch. The existing React, Express, Firebase and Gemini architecture remains the base for student accounts, books, original quizzes and curated content.
- Authenticated PDF downloads, owner-only file deletion, zoom, last-page restoration, and private page notes and bookmarks.
- Shared page-range parser, bounded independent and combined generation, native extraction, optional English and Telugu OCR, and actionable extraction errors.
- Server-side OpenAI structured generation for notes, MCQs and flashcards. Server validation checks page numbers and exact supporting excerpts against the submitted text. Generated output is cached per student, book, model, source and configuration.
- Automatic Firestore saving, saved study-material library, general and handwritten-style notes, flashcards, server-scored practice, and print-to-PDF.
- Deployment configuration, automated tests and staging instructions in [DEPLOYMENT.md](DEPLOYMENT.md).

## Verification and remaining milestones

- Complete staging acceptance testing with Firebase Auth, Firestore, Storage, and OpenAI credentials. Validate multilingual and scanned PDFs, source fidelity, cross-account access, and export rendering.
- Expand the reader with PDF search, selectable text and highlight annotations, thumbnail selection, chapter selection, and layout controls. Add DOCX ingestion and richer text layout analysis.
- Move generation to resumable background jobs before enabling whole-book processing. Add cancellation, retention, quotas, cost reporting, and configurable generation types and question formats.
- Expand structured notes, diagram and mind-map views, revision scheduling, timed examinations and analytics.
- Extend source ingestion and retrieval for verified PYQs and current affairs. Existing administrator imports require real source records.
- Complete paid memberships, administrative usage controls, dedicated routes, and offline PWA flows.
