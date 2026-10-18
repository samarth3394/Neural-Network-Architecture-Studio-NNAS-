# NNAS REST API Specification (v1)

### Base URL: `/api/v1`

---

### 1. Authentication (`/auth`)
- `POST /auth/register`: Create new user and personal workspace.
  - Body: `{ email, password, full_name, role }`
  - Returns: `{ access_token, token_type, user }`
- `POST /auth/login`: Authenticate with OAuth2 password flow.
  - Body (form): `username`, `password`
  - Returns: `{ access_token, token_type, user }`
- `GET /auth/me`: Fetch authenticated user profile.

---

### 2. Workspaces & Projects (`/workspaces`, `/projects`)
- `GET /workspaces`: List workspaces accessible to current user.
- `POST /workspaces`: Create new workspace.
- `GET /projects`: List projects within active workspace.
- `POST /projects`: Create a new project.

---

### 3. Architecture Studio (`/architectures`)
- `GET /architectures/catalog`: Retrieve complete layer registry with parameter schemas and categories.
- `POST /architectures/validate`: Run topological DAG cycle validation, layer shape inference, and parameter calculation.
  - Body: `ArchitectureGraph` JSON
  - Returns: `ValidationResult { is_valid, errors, warnings, total_parameters, trainable_parameters, layer_shapes, execution_order }`
- `POST /architectures/generate-code`: Generate standalone, executable PyTorch model code.
  - Returns: `{ code: string }`
- `GET /architectures`: List saved architectures in current project.
- `POST /architectures`: Save new architecture record.
- `PUT /architectures/{id}`: Update existing architecture record.

---

### 4. Datasets (`/datasets`)
- `GET /datasets`: List registered datasets with sample counts and input shapes.
- `POST /datasets/upload-csv`: Upload custom CSV dataset with automatic schema inference, missing value handling, and normalization.

---

### 5. Model Training Engine (`/training`)
- `POST /training/jobs`: Submit asynchronous training job.
  - Body: `{ project_id, architecture_id, dataset_id, epochs, batch_size, learning_rate, optimizer, early_stopping_patience }`
  - Returns: `TrainingJobResponse` with job ID and status `QUEUED`
- `GET /training/jobs`: List training jobs.
- `GET /training/jobs/{id}`: Poll live job telemetry, epoch loss/acc metrics, logs, and evaluation results.
- `POST /training/jobs/{id}/cancel`: Signal graceful worker cancellation.
- `POST /training/jobs/{id}/pause`: Pause training worker.
- `POST /training/jobs/{id}/resume`: Resume paused worker.

---

### 6. Automated Architecture Search (`/optimization`)
- `POST /optimization/jobs`: Launch resource-bounded evolutionary NAS search.
  - Body: `{ project_id, base_architecture_id, dataset_id, max_trials, timeout_seconds, strategy }`
- `GET /optimization/jobs/{id}`: Retrieve Pareto frontier candidate architectures, validation scores, and parameter counts.

---

### 7. Model Registry & Governance (`/registry`)
- `GET /registry/models`: List registered model versions.
- `POST /registry/models/{id}/transition-stage`: Transition model stage (`draft`, `trained`, `evaluated`, `approved`, `deployed`, `archived`) with validation gate enforcement.

---

### 8. Deployment & Inference (`/deployments`, `/inference`)
- `POST /deployments`: Deploy approved model to active REST endpoint.
- `GET /deployments`: List active deployed endpoints.
- `POST /deployments/{id}/benchmark`: Run empirical latency benchmark (p50, p95, p99, throughput).
- `POST /deployments/{id}/rollback`: Rollback endpoint to prior approved model version.
- `POST /inference/deployments/{id}/predict`: Run real model inference.
- `POST /inference/mnist-canvas`: Real-time interactive handwritten digit prediction with gradient saliency heatmap.

---

### 9. Monitoring & Operations (`/monitoring`, `/audit`)
- `GET /monitoring/health`: Liveness, metadata DB status, worker queue depth, PyTorch device, and storage usage.
- `GET /audit`: Query security and governance audit logs.
