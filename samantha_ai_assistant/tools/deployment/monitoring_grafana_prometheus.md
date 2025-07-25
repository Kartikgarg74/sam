# Monitoring & Alerting: Grafana + Prometheus Setup

## 1. Deploy Prometheus (Docker Example)

Create a `prometheus.yml` config:
```yaml
scrape_configs:
  - job_name: 'samantha-backend'
    static_configs:
      - targets: ['host.docker.internal:8001']  # Or your backend host:port
```

Run Prometheus:
```sh
docker run -d -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

## 2. Deploy Grafana (Docker Example)
```sh
docker run -d -p 3000:3000 grafana/grafana
```

## 3. Connect Grafana to Prometheus
- Open Grafana at http://localhost:3000 (admin/admin)
- Add Prometheus as a data source (URL: http://host.docker.internal:9090)

## 4. Create Dashboards
- Import or create dashboards for:
  - CPU, memory, disk (Gauges)
  - Command counts (Counters)
  - Error rates

## 5. Set Up Alerts
- In Grafana, add alert rules (e.g., high CPU, memory, error count)
- Configure notification channels (email, Slack, etc.)

## 6. Production Notes
- Use managed Grafana Cloud or Axiom for SaaS monitoring
- Ensure Prometheus can reach your backend metrics endpoint in production
- Secure Grafana with strong passwords and/or SSO

## 7. References
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
