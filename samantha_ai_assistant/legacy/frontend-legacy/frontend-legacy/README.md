# Samantha AI Assistant Frontend Application

## Purpose
This module serves as the main frontend application for the Samantha AI Assistant. It orchestrates the interaction between the voice processing pipeline, the AI engine, and Mac automation capabilities to provide a seamless user experience.

## Dependencies
- `@samantha-ai-assistant/voice-core`: Handles audio capture, transcription, response synthesis, and audio playback.
- `@samantha-ai-assistant/ai-engine`: Manages intent classification, command routing, context management, and natural language response generation.
- `@samantha-ai-assistant/mac-automation`: Provides functionalities for automating tasks on macOS, including file system operations, application control, and system-level actions.

## Key Components
- `SamanthaApp` class: The main application class that initializes and manages the core modules.
- `main.ts`: The entry point of the frontend application.

## Usage Examples
To start the frontend application:

```bash
pnpm --filter @samantha-ai-assistant/frontend start
```

To build the frontend application:

```bash
pnpm --filter @samantha-ai-assistant/frontend build
```

## API Reference
(To be filled with detailed API documentation as the project evolves)

## Development Setup
1. Ensure you have `pnpm` installed globally.
2. Navigate to the monorepo root directory.
3. Run `pnpm install` to install all dependencies.
4. Navigate to this `apps/frontend` directory.
5. Run `pnpm dev` to start the TypeScript compiler in watch mode for development.

## Testing
(To be filled with testing instructions)

## Contributing
(To be filled with contribution guidelines)