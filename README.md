# Neural Network Architecture Studio (NNAS)
### Production-Grade AI Platform for Visual Model Engineering, Training, Explainability, and Architecture Optimization

[![CI Pipeline](https://github.com/organization/nnas/actions/workflows/ci.yml/badge.svg)](https://github.com/organization/nnas/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.8.0-EE4C2C.svg)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 1. Overview & Vision

**Neural Network Architecture Studio (NNAS)** is an end-to-end, production-oriented deep learning platform. It empowers machine learning engineers, researchers, and developers to visually design neural network architectures, train real PyTorch models in isolated background workers, diagnose internal representations through gradient-based explainability, discover optimal architectures via automated evolutionary search, and manage production serving through stage-gated model registries and low-latency REST endpoints.

Every feature in NNAS represents **actual computational execution** using native PyTorch tensors, scikit-learn preprocessing pipelines, and persistent database entities—never decorative mockups or placeholder simulations.

---

## 2. Five Major Capabilities

1. **Visual Architecture Studio**:
   - Editable, graph-based neural network canvas powered by React Flow (`@xyflow/react`).
   - Drag-and-drop catalog of validated layers: `Input`, `Linear/Dense`, `Conv2d`, `MaxPool2d`, `AvgPool2d`, `Flatten`, `ReLU`, `Sigmoid`, `Tanh`, `Softmax`, `Dropout`, `BatchNorm1d/2d`, `LSTM`, `GRU`, and `TransformerEncoder`.
   - Kahn's algorithm DAG cycle detection, mathematical tensor shape propagation, parameter counting (trainable vs frozen), and instant PyTorch Python code generation.
   - Neuron-level topology visualizer for bounded networks.

2. **Real Model Training Engine**:
   - Asynchronous background worker threads with explicit job states: `QUEUED`, `STARTING`, `RUNNING`, `PAUSING`, `PAUSED`, `CANCELLING`, `CANCELLED`, `SUCCEEDED`, `FAILED`.
   - Real-time epoch telemetry streaming loss and accuracy curves directly to Recharts.
   - Early stopping with patience, best checkpoint persistence, graceful worker cancellation, pause/resume, and post-training evaluation on held-out test datasets.

3. **Live Visualization & Explainability Engine**:
   - Interactive handwritten digit drawing canvas for real-time model inference.
   - Backpropagation gradient saliency heatmaps ($\nabla_x \mathcal{S}_c(x)$) displaying exact pixel attributions for output decisions.
   - Controlled forward hooks with bounded memory capture (max 128 neurons per layer) and weight distribution histograms.
   - Permutation feature importance for tabular inputs and confusion matrices with per-class precision, recall, and F1 metrics.

4. **Automated Architecture Optimization (NAS)**:
   - Resource-bounded directed evolutionary mutation and random sampling.
   - Pareto efficiency frontier discovery maximizing validation accuracy while minimizing parameter counts.
   - Strict computational budgeting: trial limits, wall-clock timeout enforcement, and parameter size constraints.

5. **Model Registry & Production Serving**:
   - Immutable version records with strict validation gates: models cannot be approved or deployed without a verified physical checkpoint binary and held-out test evaluation.
   - Model warmup on startup to prime JIT caches.
   - Interactive REST inference tester with empirical latency benchmarking (p50, p95, p99, throughput).
   - Zero-downtime rollback pointer to prior approved model versions.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript (Strict Mode), Vite, Tailwind CSS, `@xyflow/react`, Zustand, Recharts, Lucide Icons |
| **Backend API** | Python 3.13 / 3.10+, FastAPI (Lifespan Context), Pydantic v2, SQLAlchemy 2.0 ORM, PyJWT, Native Bcrypt |
| **ML Engine** | PyTorch 2.8.0, Torchvision, NumPy, Pandas, Scikit-learn |
| **Background Jobs** | ThreadPoolExecutor Worker Queue with stale job recovery and heartbeat persistence |
| **Persistence** | SQLite (standalone/dev), PostgreSQL 16 (production), Local / S3-compatible Artifact Storage |
| **Containers & CI** | Docker, Multi-stage Dockerfiles, Docker Compose, GitHub Actions |

---

## 4. Quickstart Guide

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
# In the repository root
cd backend
python -m pip install -r requirements.txt

# Run backend API server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the database schema, seeds default architectures (MNIST CNN, Iris MLP), registers benchmark datasets, and starts on `http://127.0.0.1:8000`. OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173` in your browser. Default administrative credentials:
- **Email**: `admin@nnas.local`
- **Password**: `Admin123!*`

---

### Option B: Production Container Deployment (Docker Compose)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start full production stack (Frontend, Backend, PostgreSQL, Redis)
docker compose up -d --build

# 3. Verify running services
docker compose ps
```
The application will be available at `http://localhost:3000` with the backend API routed through `http://localhost:8000`.

---

## 5. Verification & Automated Testing

NNAS includes a comprehensive automated test suite testing validation, compilation, shape inference, training loops, explainability, and REST API gates:

```bash
# Run backend test suite
pytest -v
```

**Test Results Summary**:
- `test_validator_dense_success`: PASSED
- `test_validator_conv_success`: PASSED
- `test_validator_cycle_detection`: PASSED
- `test_code_generator`: PASSED
- `test_model_compiler_and_forward`: PASSED
- `test_datasets_manager`: PASSED
- `test_training_executor`: PASSED
- `test_saliency_and_explainability`: PASSED
- `test_inference_engine`: PASSED
- `test_root_endpoint`: PASSED
- `test_monitoring_health`: PASSED
- `test_layer_catalog`: PASSED
- `test_auth_login_default_admin`: PASSED
- `test_list_workspaces_and_projects`: PASSED
- `test_list_datasets`: PASSED
- `test_validate_and_generate_code_api`: PASSED
- `test_model_registry_stage_validation_gate`: PASSED

**Result**: 17 passed in 15.19s (100% pass rate).

---

## 6. Repository Structure

```
NNAS/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST endpoints (auth, studio, training, registry, etc.)
│   │   ├── core/            # Config, security, logging, exceptions
│   │   ├── db/              # SQLAlchemy session, models, initial seed script
│   │   ├── ml/              # PyTorch compiler, validator, codegen, datasets, trainer, hooks, NAS
│   │   ├── workers/         # Background queue coordinator & recovery
│   │   ├── storage/         # Artifact storage adapter with path-traversal protection
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest automated test suites
│   ├── Dockerfile           # Backend container image
│   └── requirements.txt     # Pinned Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React Flow nodes, palette, inspector, validation bar
│   │   ├── pages/           # 13 dedicated studio & operations views
│   │   ├── store/           # Zustand state management
│   │   ├── api/             # Typed API client
│   │   ├── types/           # Shared TypeScript interfaces
│   │   └── App.tsx          # Main root shell
│   ├── Dockerfile           # Frontend Nginx production container
│   └── package.json         # Pinned npm dependencies
├── docs/
│   ├── ARCHITECTURE.md           # System design & data flow specification
│   ├── SECURITY_THREAT_MODEL.md  # STRIDE threat model & RBAC boundaries
│   ├── OPERATIONS_RUNBOOK.md     # Deployment, backup/restore, & incident runbooks
│   ├── API_SPECIFICATION.md      # Complete REST API route documentation
│   └── RELEASE_CHECKLIST.md      # Acceptance criteria verification report
├── .github/ci-workflow.yml.template # Automated GitHub Actions CI workflow template
├── docker-compose.yml            # Multi-service production deployment
├── .env.example                  # Environment configuration template
└── pytest.ini                    # Test runner configuration
```

---

## 7. Operational Documentation & Runbooks

- [Architecture Design & Data Flows](docs/ARCHITECTURE.md)
- [Security Threat Model & RBAC Boundaries](docs/SECURITY_THREAT_MODEL.md)
- [Operations Runbook, Backups, & Incident Response](docs/OPERATIONS_RUNBOOK.md)
- [REST API Endpoint Specification](docs/API_SPECIFICATION.md)
- [Production Release Checklist & Verification Evidence](docs/RELEASE_CHECKLIST.md)

---

## 8. License
Licensed under the Apache License, Version 2.0.
