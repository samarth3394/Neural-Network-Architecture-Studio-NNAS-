# NNAS Operations Runbook & Deployment Guide

### 1. Operational Overview
This document outlines standard operating procedures (SOPs), deployment workflows, health checks, backup/restore procedures, and incident response playbooks for NNAS.

---

### 2. Startup & Local Deployment Procedures

#### Option A: Quick Standalone Startup (Local Development)
1. **Prerequisites**: Python 3.10+ and Node.js 18+.
2. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
4. Access the web interface at `http://localhost:5173`. Default admin credentials: `admin@nnas.local` / `Admin123!*`.

#### Option B: Production Container Deployment (Docker Compose)
1. Configure `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   # Update SECRET_KEY and POSTGRES_PASSWORD
   ```
2. Start the full production stack:
   ```bash
   docker compose up -d --build
   ```
3. Verify running containers:
   ```bash
   docker compose ps
   ```

---

### 3. Health Checks & Monitoring Endpoints

| Endpoint | Protocol | Purpose | Expected Response |
| :--- | :--- | :--- | :--- |
| `GET /` | HTTP | Service liveness | `{"status": "operational", "version": "1.0.0"}` |
| `GET /api/v1/monitoring/health` | HTTP | Deep health (DB, queue, disk, device) | Status 200 with component statuses |
| `GET /docs` | HTTP | Interactive OpenAPI documentation | Swagger UI |

---

### 4. Database Migrations & Backup Procedures

#### PostgreSQL Backup Command
```bash
docker exec -t nnas-postgres pg_dump -U nnas_user -d nnas_db -F c -b -v -f /var/lib/postgresql/data/nnas_backup_$(date +%Y%m%d_%H%M%S).dump
```

#### PostgreSQL Restoration Procedure
```bash
# 1. Stop backend service to prevent write conflicts
docker compose stop backend

# 2. Restore database from dump file
docker exec -t nnas-postgres pg_restore -U nnas_user -d nnas_db -c -v /var/lib/postgresql/data/<backup_file>.dump

# 3. Restart backend service
docker compose start backend
```

---

### 5. Incident Response Playbooks

#### Incident 1: Worker Queue Saturation
- **Symptom**: Jobs remain in `QUEUED` state indefinitely.
- **Root Cause**: Concurrency limit reached or workers crashed.
- **Resolution**:
  1. Inspect active workers: `curl http://localhost:8000/api/v1/monitoring/health`
  2. If jobs are hung, cancel via API `POST /api/v1/training/jobs/{id}/cancel`
  3. If necessary, restart the backend service; stale jobs will be auto-recovered to `FAILED`.

#### Incident 2: Model Serving Latency Spike
- **Symptom**: Endpoint latency p95 exceeds 500ms.
- **Resolution**:
  1. Benchmark endpoint via `POST /api/v1/deployments/{id}/benchmark`
  2. If performance degraded, execute instant rollback to prior approved version:
     `POST /api/v1/deployments/{id}/rollback?target_model_id=<prior_approved_id>`
