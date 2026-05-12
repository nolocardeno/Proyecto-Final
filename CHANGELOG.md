# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

_No unreleased changes at this time._

---

## [1.0.0] — 2026-05-12

Initial production release of Scantral, deployed at [scantral.com](https://scantral.com).

### Added

#### Backend (Spring Boot 4 / Java 21)
- User registration and login with JWT authentication (HMAC-SHA, configurable TTL).
- Token blacklist to invalidate JWTs on logout.
- BCrypt password hashing with configurable cost factor.
- Per-IP rate limiting filter to mitigate brute-force attacks.
- CORS policy restricted to the production origin.
- Document CRUD: create, read, update, delete personal documents.
- Document fields: name, type, category, expiry date, notes, file attachment.
- Full-text and field-based document search via JPA Specifications.
- Shared groups: create, join (by code), leave, and list group documents.
- Automatic 10-character unique access code generation per group.
- Expiry alert scheduler: emails users when documents are about to expire.
- Configurable notification lead time per user (days before expiry).
- Gmail SMTP integration via App Password for email delivery.
- OCR integration: proxies document images to PaddleOCR sidecar.
- Optional AI extraction layer via Google Gemini 2.5 Flash Lite API.
- OpenAPI / Swagger UI documentation at `/swagger-ui/index.html`.
- Testcontainers-based integration tests; JaCoCo coverage gate ≥ 80 %.

#### Frontend (Angular 20 + SCSS)
- Single Page Application with Angular Router and lazy-loaded modules.
- Authentication flow: register, login, logout, JWT refresh handling.
- Document list with real-time filtering by name, type, category, and date.
- Document detail view with inline editing and file preview.
- Upload-by-photo flow: capture → OCR/AI extraction → editable form → save.
- Shared groups UI: create, join by code, view members, add/remove documents.
- Light / dark theme toggle, persisted in user preferences.
- Responsive layout for desktop, tablet, and mobile via SCSS variables.
- Unit and component tests; Karma/Istanbul coverage gate ≥ 80 %.

#### OCR Sidecar (Python / FastAPI + PaddleOCR PP-OCRv4)
- FastAPI service exposing `/ocr` endpoint for document image processing.
- Fully offline; no external API required.
- Configurable OCR language via `OCR_LANGUAGE` environment variable.

#### Infrastructure
- Multi-service Docker Compose setup: `frontend`, `backend`, `postgres`, `paddleocr`.
- Internal Docker network (`scantral-net`); only `frontend` (port 4200) is exposed.
- Nginx reverse proxy: serves the Angular SPA and forwards `/api/*` and `/uploads/*` to the backend.
- GitHub Actions CI pipeline: build + tests (both backend and frontend) + JaCoCo gate.
- GitHub Actions CD pipeline: builds and pushes Docker images to Docker Hub on `main` and `v*` tags.
- Production HTTPS via Cloudflare (TLS termination, CDN, DDoS protection).

[Unreleased]: https://github.com/nolocardeno/Scantral/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/nolocardeno/Scantral/releases/tag/v1.0.0
