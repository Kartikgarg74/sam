# Incident Response & Capacity Planning Runbook

## 1. Incident Response

### Common Incidents
- **API downtime:**
  1. Check Railway/Vercel status dashboards
  2. Review backend logs and Prometheus/Grafana alerts
  3. Roll back to previous deployment if needed
  4. Notify team and document incident
- **High error rate:**
  1. Check Grafana alerts for error spikes
  2. Review recent code changes and logs
  3. Hotfix or roll back as needed
- **Resource exhaustion (CPU/memory):**
  1. Review Prometheus metrics
  2. Scale up resources or optimize code
  3. Set up auto-scaling thresholds

### Escalation
- If unable to resolve in 30 minutes, escalate to lead engineer
- For security incidents, notify security officer immediately

## 2. Capacity Planning
- Review usage metrics monthly (Grafana dashboards)
- Forecast growth based on command/API usage trends
- Adjust Railway/Vercel/Upstash plans as needed
- Document all scaling actions and forecasts

## 3. Documentation
- Keep this runbook updated with new incident types and procedures
- Review after every major incident (postmortem)
