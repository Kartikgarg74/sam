# Samantha AI Assistant Monorepo

This monorepo contains all the code for the Samantha AI Assistant, a voice-controlled AI assistant for Mac automation. It is designed with efficiency and performance in mind, specifically targeting Mac M2 devices with limited resources.

## Project Structure

- `apps/`: Contains the main applications.
  - `backend/`: FastAPI server for voice processing and AI integration.
  - `desktop/`: Electron application for the desktop interface (future development).
  - `web/`: Next.js application for the management interface.
- `packages/`: Contains shared libraries and components.
  - `voice-core/`: Core logic for voice processing.
  - `ai-engine/`: Utilities for Gemini AI integration.
  - `mac-automation/`: macOS specific automation scripts and utilities.
  - `ui-components/`: Reusable UI components.
  - `types/`: Shared TypeScript type definitions.
- `tools/`: Contains development and deployment scripts.
  - `dev-scripts/`: Various development utilities.
  - `deployment/`: Configuration and scripts for production deployment.
- `docs/`: Project documentation.
  - `architecture/`: System design and architectural documentation.
  - `api/`: API documentation.
  - `user-guide/`: End-user documentation.

## Getting Started

Further instructions for setting up the development environment and running the applications will be provided in the respective `README.md` files within each sub-project.
