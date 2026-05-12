# Contributing to Scantral

Thank you for your interest in contributing! This document explains how to report issues, suggest improvements, and submit code changes.

> **Note:** Scantral is a Final Cycle Project (*Trabajo Fin de Ciclo*). Contributions are welcome for educational purposes, but the maintainer makes all final decisions on merging and direction.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Development Setup](#development-setup)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style](#code-style)
- [Tests](#tests)
- [Commit Messages](#commit-messages)

---

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it. Report unacceptable behavior to **manologorrion@hotmail.com**.

---

## Reporting Bugs

Before opening an issue, please:

1. Search [existing issues](https://github.com/nolocardeno/Scantral/issues) to avoid duplicates.
2. Check you are using the latest version of the code on `main`.

When filing a bug, include:

- A clear, descriptive title.
- Steps to reproduce the problem.
- Expected vs. actual behavior.
- Environment details (OS, Docker version, browser if frontend).
- Relevant logs or screenshots.

**Security vulnerabilities must not be reported via public issues.** See [SECURITY.md](SECURITY.md) for the responsible disclosure process.

---

## Suggesting Enhancements

Open an issue with the `enhancement` label and include:

- A clear description of the proposed feature and the problem it solves.
- Any alternative approaches you considered.
- If applicable, mockups or references to similar implementations.

---

## Development Setup

Full setup instructions are in [README.md](README.md) and [DEPLOY.md](DEPLOY.md). Quick summary:

```bash
# Clone
git clone https://github.com/nolocardeno/Scantral.git
cd Scantral

# Copy and fill in env variables
cp .env.example .env

# Start all services
docker compose up -d --build
```

For local development without Docker you will need:

| Component | Requirement |
| --------- | ----------- |
| Backend   | Java 21, Maven 3.9+ (or use `./mvnw`) |
| Frontend  | Node.js 22+, Angular CLI 20 |
| OCR sidecar | Python 3.10+, pip |
| Database  | PostgreSQL 17 (or Docker) |

---

## Submitting a Pull Request

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes, following the [Code Style](#code-style) guidelines.
3. Add or update tests as appropriate (see [Tests](#tests)).
4. Ensure all tests pass locally before pushing.
5. Open a Pull Request against `main` with a clear description of what was changed and why.
6. Reference any related issues in the PR description (e.g. `Closes #42`).

PRs that break the CI pipeline (build failure, coverage gate below 80 %, linting errors) will not be merged until the issues are resolved.

---

## Code Style

### Backend (Java / Spring Boot)

- Follow standard Java naming conventions (camelCase methods, PascalCase classes).
- Keep controllers thin — business logic belongs in the service layer.
- Use constructor injection; avoid field injection with `@Autowired`.
- Do not suppress warnings without a comment explaining why.

### Frontend (TypeScript / Angular)

- Follow the [Angular Style Guide](https://angular.dev/style-guide).
- Use `async`/`await` over `.subscribe()` chains where possible.
- Keep components small and delegate data-fetching to services.
- Styles must use the existing SCSS variable system; do not hardcode colors or sizes.

### Python (OCR sidecar)

- Follow [PEP 8](https://peps.python.org/pep-0008/).
- Keep `app.py` focused on the FastAPI endpoint; heavy logic goes in separate modules.

---

## Tests

### Backend

```bash
cd backend
./mvnw -B verify
```

The JaCoCo gate requires ≥ 80 % instruction and branch coverage. New code must include corresponding unit or integration tests.

### Frontend

```bash
cd frontend
npm ci
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
```

Coverage gate: ≥ 80 %. New components and services must include Jasmine/Karma tests.

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

Examples:
```
feat(backend): add document sharing via group invite code
fix(frontend): correct dark-mode contrast on document card
docs: update DEPLOY.md with Cloudflare HTTPS notes
test(backend): add integration tests for DocumentRepository specs
```
