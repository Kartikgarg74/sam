#!/bin/bash
# Database backup script for Samantha AI

date=$(date +%Y-%m-%d_%H-%M-%S)
pg_dump $DATABASE_URL > backup_$date.sql
