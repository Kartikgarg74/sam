# Production Deployment Architecture

```mermaid
graph TD
  subgraph Frontend
    Vercel[Vercel (Next.js)]
  end
  subgraph Backend
    Railway[Railway (FastAPI)]
  end
  subgraph Data
    Upstash[Upstash (Redis)]
    Postgres[Supabase/Neon (Postgres)]
  end
  subgraph Monitoring
    Prometheus[Prometheus]
    Grafana[Grafana]
  end

  Vercel -- API/WS --> Railway
  Railway -- Cache --> Upstash
  Railway -- DB --> Postgres
  Prometheus -- Scrape --> Railway
  Grafana -- DataSource --> Prometheus
```

**Description:**
- **Frontend:** Deployed on Vercel, communicates with backend via API/WebSocket.
- **Backend:** Deployed on Railway, handles business logic, API, and WebSocket.
- **Cache:** Upstash Redis for caching, pub/sub, and real-time features.
- **Database:** Supabase or Neon for managed Postgres.
- **Monitoring:** Prometheus scrapes backend metrics; Grafana visualizes and alerts.
