# Samantha AI Testing Strategy Framework

## Overview
This document outlines the testing strategy for the Samantha AI monorepo, ensuring code quality, reliability, and maintainability across all packages and apps.

---

## 1. Testing Types
- **Unit Tests:** Test individual functions/components in isolation
- **Integration Tests:** Test interactions between modules/packages
- **End-to-End (E2E) Tests:** Test full user flows (e.g., voice input to system action)

## 2. Recommended Tools
- **TypeScript/Node.js:**
  - [Jest](https://jestjs.io/) (unit/integration)
  - [Playwright](https://playwright.dev/) or [Cypress](https://www.cypress.io/) (E2E)
  - [ts-jest](https://kulshekhar.github.io/ts-jest/) for TypeScript support
- **Python:**
  - [pytest](https://docs.pytest.org/en/stable/) (unit/integration)
  - [requests-mock](https://requests-mock.readthedocs.io/en/latest/) for API mocking

## 3. Folder Structure
- Place tests alongside source files or in a `__tests__/` or `tests/` folder:
  - `src/module/__tests__/module.test.ts`
  - `tests/integration/`
  - `tests/e2e/`

## 4. Test Coverage
- Target **80%+** code coverage for all core packages
- Use Jest or pytest coverage reports
- Add coverage badges to package READMEs

## 5. Running Tests
- All packages:
  - `pnpm test` (runs all tests)
  - `pnpm -F <package> test` (single package)
- Python backend:
  - `pytest` in the backend directory

## 6. CI Integration
- All PRs must pass tests before merging
- CI runs:
  - Linting
  - Type checks
  - All tests (unit, integration, E2E)
  - Coverage reporting

## 7. Best Practices
- Write tests for all new features and bug fixes
- Use mocks/stubs for external APIs (e.g., Gemini, ElevenLabs)
- Test error handling and edge cases
- Keep tests fast and isolated
- Review and update tests regularly

## 8. Example Commands
- Run all tests: `pnpm test`
- Run tests in a package: `pnpm -F ai-engine test`
- Run Python tests: `cd backend && pytest`
- Run E2E tests: `pnpm -F web test:e2e`

---

## References
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [pytest Docs](https://docs.pytest.org/en/stable/)

---

_Last updated: 2025_
