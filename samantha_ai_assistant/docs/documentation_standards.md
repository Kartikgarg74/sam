# Samantha AI Documentation Standards & Templates

## Overview
This guide defines documentation standards for all code, packages, and apps in the Samantha AI monorepo. Consistent, clear documentation ensures maintainability and ease of onboarding.

---

## 1. General Principles
- Write for clarity and conciseness
- Use proper Markdown formatting
- Keep documentation up to date with code changes
- Use English, avoid jargon unless defined

## 2. Required Docs per Package/App
- `README.md` (required)
- `CHANGELOG.md` (recommended)
- API reference (inline or separate)
- Usage examples

## 3. README Template
```markdown
# <Package Name>

## Overview
Brief description of the package/app and its purpose.

## Installation
```sh
pnpm install <package-name>
```

## Usage
Example code or CLI usage.

## API Reference
- List and describe main exports, functions, or endpoints.

## Development
- How to run, test, and build locally.

## Contributing
- Guidelines for contributing, reporting issues, and PRs.

## License
MIT (or specify)
```

## 4. API Documentation
- Use JSDoc or docstrings for all public functions/classes
- Generate API docs with tools like TypeDoc or Sphinx (Python)
- Place generated docs in `docs/` or link from README

## 5. Code Comments
- Use comments to explain complex logic, not obvious code
- Prefer doc comments for exported/public APIs
- Example (TypeScript):
```typescript
/**
 * Transcribes audio using Whisper Tiny
 * @param audioBuffer - PCM audio data
 * @returns Transcription result
 */
function transcribe(audioBuffer: Buffer): Promise<string> { ... }
```

## 6. Changelog
- Use `CHANGELOG.md` in each package/app
- Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- Update with every release or significant change

## 7. Update Frequency
- Update docs with every feature, bug fix, or breaking change
- Review and refresh docs at least once per release cycle

---

## References
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [TypeDoc](https://typedoc.org/)
- [JSDoc](https://jsdoc.app/)
- [Sphinx](https://www.sphinx-doc.org/)

---

_Last updated: 2025_
