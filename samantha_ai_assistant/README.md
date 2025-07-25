# Samantha AI Assistant Monorepo

## Overview
Samantha AI is a voice-controlled AI assistant for Mac automation, designed for developers and power users. It leverages Gemini 2.5 Flash, Whisper Tiny, and ElevenLabs for intelligent command processing, voice transcription, and TTS, with a modular, scalable architecture optimized for Mac M2 hardware and free-tier cloud services.

---

## Architecture Diagram

```mermaid
graph TD
  subgraph Frontend
    Web[apps/web (Next.js 14)]
  end
  subgraph Backend
    FastAPI[apps/backend (FastAPI)]
  end
  subgraph Data
    Upstash[Upstash (Redis)]
    Postgres[Supabase/Neon (Postgres)]
  end
  subgraph Monitoring
    Prometheus[Prometheus]
    Grafana[Grafana]
  end

  Web -- API/WS --> FastAPI
  FastAPI -- Cache --> Upstash
  FastAPI -- DB --> Postgres
  Prometheus -- Scrape --> FastAPI
  Grafana -- DataSource --> Prometheus
```

---

## Directory Structure

| Directory                                      | Description/Status                |
|------------------------------------------------|-----------------------------------|
| `apps/web`                                     | **Active**: Next.js 14 web UI     |
| `apps/backend`                                 | **Active**: FastAPI backend       |
| `apps/frontend-legacy`                         | Legacy: Old TypeScript frontend   |
| `backend-legacy`                               | Legacy: Original Flask backend    |
| `backend-flask-legacy`                         | Legacy: Duplicate Flask backend   |
| `packages/voice-core`                          | Shared voice/audio processing     |
| `packages/ai-engine`                           | Gemini integration, AI logic      |
| `packages/mac-automation`                      | Mac automation core               |
| `packages/command-intelligence`                | Orchestration, pattern learning   |
| `packages/monitoring`, `packages/analytics`    | Monitoring, analytics, BI         |
| `docs/`                                        | Documentation, architecture, etc. |
| `tools/deployment/`                            | CI/CD, deployment, runbooks       |

---

## Setup & Development

### Prerequisites
- Node.js v20+, Python 3.11+, pnpm, Docker (for monitoring)
- Mac M2 (recommended), 8GB RAM, 256GB+ storage
- `.env` files with all required secrets (see `.env.example`)

### Install Dependencies
```sh
pnpm install --frozen-lockfile
cd apps/backend
pip install -r ../../backend/requirements.txt  # If using legacy Flask, otherwise see below
cd ../../apps/backend
pip install -r requirements.txt                # For FastAPI backend
```

### Run Backend (FastAPI)
```sh
cd apps/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Run Frontend (Next.js)
```sh
cd apps/web
pnpm dev
```

### Monitoring (Prometheus/Grafana)
See `tools/deployment/monitoring_grafana_prometheus.md` for setup.

---

## Development Workflow
- Use `apps/web` and `apps/backend` for all new features.
- Use `pnpm` for all package management and scripts.
- Run tests and linting before pushing code.
- See `docs/development_workflow.md` for best practices.

---

## Deployment
- **Frontend:** Deploy `apps/web` to Vercel.
- **Backend:** Deploy `apps/backend` to Railway (or your preferred Python host).
- **Environment variables:** Set in Vercel/Railway dashboards for production.
- **Database:** Use Supabase or Neon for Postgres.
- **Redis:** Use Upstash for serverless Redis.

---

## Troubleshooting
- If you see duplicate/legacy directories, use only the `apps/web` and `apps/backend` directories for active development.
- For dependency or build errors, ensure you are in the correct directory and using the correct Python/Node version.
- For legacy code, see the `*-legacy` directories and their README files for context.
- For more help, see the `docs/` directory and deployment runbooks.

---

## Legacy/Archived Directories
- `backend-legacy`, `backend-flask-legacy`, `apps/frontend-legacy` are kept for reference only. **Do not use for new development.**

---

## Contributing
- See `docs/development_workflow.md` and `docs/documentation_standards.md` for guidelines.

---

## License
MIT (see LICENSE file)
