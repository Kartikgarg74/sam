# Samantha AI Monorepo Development Workflow

## Overview
This document outlines best practices and workflow guidelines for efficient, scalable development in the Samantha AI monorepo. It is tailored for Mac M2 hardware and leverages pnpm for package management.

---

## 1. Monorepo Structure
- All core apps and packages are located under `samantha-ai-assistant/`
- Shared logic is modularized in `packages/`
- Use relative imports for internal packages

## 2. Branching Strategy
- **main**: Always production-ready
- **feature/*:** For new features
- **fix/*:** For bug fixes
- **docs/*:** For documentation updates
- **test/*:** For testing/experiments

## 3. Commit Conventions
- Use [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Example: `feat(voice-core): add VAD noise cancellation`

## 4. Code Review
- All changes to `main` require a pull request (PR)
- PRs must:
  - Pass all CI checks
  - Be reviewed by at least one other developer
  - Include a clear description and reference related issues

## 5. Development Best Practices
- Use pnpm for all package management: `pnpm install`, `pnpm run ...`
- Use workspaces for cross-package development: `pnpm -F <package> ...`
- Keep dependencies up to date and minimal
- Write modular, reusable code
- Add/maintain tests for all new features
- Document public APIs and complex logic

## 6. Local Development
- Use Mac M2 optimized settings (see performance docs)
- Use `.env` files for local secrets (never commit these)
- Use `pnpm dev` or `pnpm start` for local servers
- Use `pnpm build` to test production builds

## 7. CI/CD Pipeline
- All PRs trigger automated tests and builds
- Linting and type checks must pass
- Deployments are automated via Railway/Vercel (see deployment docs)

## 8. Collaboration
- Communicate blockers early
- Use issues for bugs, features, and questions
- Reference issues in commits and PRs
- Review and update documentation as you go

## 9. Security & Secrets
- Never commit secrets, API keys, or credentials
- Use `.env` and secret management tools
- Review `.gitignore` regularly

---

## References
- [Monorepo Best Practices](https://nx.dev/concepts/monorepo)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

_Last updated: 2025_
