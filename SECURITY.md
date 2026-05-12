# Security Policy

## Supported Versions

Only the latest production release deployed at [scantral.com](https://scantral.com) receives security updates. No legacy versions are actively maintained.

| Version | Supported |
| ------- | --------- |
| Latest (main) | ✅ |
| Older branches | ❌ |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in Scantral, report it responsibly by sending an email to:

**manologorrion@hotmail.com**

Include as much of the following information as possible to help understand and reproduce the issue:

- Type of vulnerability (e.g. SQL injection, XSS, broken authentication)
- Component affected (backend, frontend, OCR service)
- Step-by-step instructions to reproduce
- Proof-of-concept code or screenshots (if applicable)
- Potential impact assessment

You will receive an acknowledgement within **72 hours**. After triage, you will be kept informed of the progress toward a fix and public disclosure.

## Disclosure Policy

Scantral follows a **coordinated disclosure** model:

1. The reporter submits the vulnerability privately.
2. The maintainer acknowledges receipt and begins investigation.
3. A patch is developed and deployed to production.
4. A public disclosure is made after the fix is live, crediting the reporter (unless anonymity is requested).

We ask that you give us a reasonable amount of time to address the issue before any public disclosure.

## Security Features

Scantral implements several security controls by design:

- **Authentication** — JWT tokens signed with HMAC-SHA, short-lived with controlled renewal.
- **Token invalidation** — Logged-out tokens are added to an in-memory blacklist until expiry.
- **Password storage** — Passwords are never stored in plaintext; BCrypt hashing is applied with a configurable cost factor.
- **Rate limiting** — Per-IP request throttling to mitigate brute-force and API abuse.
- **CORS policy** — Strict origin whitelist; requests from unauthorized domains are rejected.
- **HTTPS** — All production traffic is served over HTTPS, managed by Cloudflare.
- **Internal network** — Backend, database, and OCR sidecar communicate over an isolated Docker internal network and are not exposed to the host.
- **Input validation** — Request payloads are validated at the API boundary before processing.

## Out of Scope

The following are considered out of scope for vulnerability reports:

- Vulnerabilities in third-party dependencies that have no published fix upstream.
- Denial-of-service attacks requiring physical access or volumetric bandwidth.
- Social engineering of maintainers or users.
- Issues in development or local environments that do not affect production.

## Preferred Languages

We accept reports in **English** or **Spanish**.
