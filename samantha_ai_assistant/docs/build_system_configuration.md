# Samantha AI Build System Configuration

## Overview
This document describes the build system setup and best practices for the Samantha AI monorepo, optimized for Mac M2 hardware and pnpm workspaces.

---

## 1. Package Management
- Use **pnpm** for all dependency management and scripts
- Install dependencies: `pnpm install`
- Build all packages: `pnpm build`
- Build a specific package: `pnpm -F <package> build`

## 2. TypeScript Build
- All core packages and apps use TypeScript
- Each package/app has its own `tsconfig.json`
- Build artifacts are output to `dist/` folders
- Use incremental builds for speed (`tsconfig.json` → `incremental: true`)
- Clean builds: `pnpm clean` (if defined)

## 3. Build Caching
- pnpm and TypeScript both support incremental builds
- Avoid deleting `tsbuildinfo` files unless troubleshooting
- Use pnpm workspace caching for faster rebuilds
- For CI, enable persistent caching (see CI config)

## 4. Mac M2 Optimizations
- Use Apple Silicon-native Node.js and pnpm for best performance
- Prefer ARM64-native dependencies when available
- Use `--max-old-space-size=2048` for memory-intensive builds
- Monitor CPU/RAM usage with Activity Monitor
- Keep build artifacts small (<50MB per package)

## 5. Build Troubleshooting
- If builds fail:
  - Run `pnpm install` to refresh dependencies
  - Delete `node_modules/` and `dist/` if issues persist
  - Check for conflicting TypeScript versions
  - Review `tsconfig.json` for correct paths and settings
- For Mac M2-specific issues:
  - Ensure all dependencies are ARM64-compatible
  - Use Rosetta only if absolutely necessary

## 6. Best Practices
- Commit only source files, never `dist/` or build artifacts
- Keep `tsconfig.json` and build scripts in sync across packages
- Use consistent output directories (`dist/`)
- Document any custom build steps in package README

## 7. CI/CD Build Pipeline
- All PRs trigger builds and tests in CI
- Use pnpm caching in CI for faster builds
- Artifacts are not committed; deployments use fresh builds

---

## References
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Apple Silicon Node.js](https://nodejs.org/en/download)

---

_Last updated: 2025_
