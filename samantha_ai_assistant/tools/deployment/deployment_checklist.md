# Samantha AI Deployment Checklist

## Pre-Deploy
- [ ] All tests pass in CI
- [ ] Code reviewed and approved
- [ ] Environment variables/secrets set for target environment
- [ ] Database migrations reviewed
- [ ] Backups taken

## Deploy
- [ ] Trigger CI/CD pipeline (GitHub Actions, Railway, Vercel)
- [ ] Monitor build and deployment logs
- [ ] Run database migrations (`db_migrate.sh`)

## Post-Deploy
- [ ] Smoke test API and frontend
- [ ] Check system health dashboard
- [ ] Monitor logs and alerts for errors
- [ ] Confirm backups are intact

## Rollback (if needed)
- [ ] Restore previous backup
- [ ] Revert deployment in Railway/Vercel
- [ ] Notify team and document incident

## Scaling & Performance Tuning
- Railway backend auto-scaling: Set min/max instances, resource limits (cpu/memory), and concurrency in railway.json
- Adjust healthcheck path as needed (default: /api/v1/status)
- Vercel frontend auto-scales by default; tune regions and routes in vercel.json if needed
- Monitor resource usage in Railway/Vercel dashboards and adjust limits for optimal performance
