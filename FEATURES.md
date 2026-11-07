# MahiMCQs feature inventory
## Added in expansion
- Browser-based scanned-page OCR using local Tesseract English and Telugu packs (requires browser to download OCR language files).
- Browser print-to-PDF question exports; Telugu rendering depends on installed or remotely loaded Noto Sans Telugu font.
- Saved question-set search, reopen, remove and print UI.
- Quiz attempt analytics based on actual Firestore attempt records.
- PYQ ingestion format and read-only filtering API; **no verified PYQ questions supplied**. Only records with source URLs and exam paper references are accepted. Do not label generated questions as genuine PYQs.
- Cost guardrails through bounded question generation, with limits still requiring production audit.
## Remains necessary for a complete production service
- Complete phone OTP UI, onboarding, subscriptions/payment integration, admin import workflows, trusted PDF source-page verification on the server, durable queue and cache fencing, usage quotas, verified real PYQ licensing and import, timely sourced current affairs ingestion, AI prediction testing and labeling, automated unit and end-to-end testing, security audit, deploy/hosting configuration, and Android packaging.
- No secret keys or credentials are committed to the repository.
- An imported verified PYQ corpus or current-affairs feed is external data, not something that can be truthfully fabricated.
