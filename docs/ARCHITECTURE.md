# NNAS Architecture Specification
## Neural Network Architecture Studio (NNAS)

### 1. Executive Architecture Summary
Neural Network Architecture Studio (NNAS) is a production-grade AI platform engineered for visual neural network architecture design, verifiable model training, explainability, automated architecture search, and model serving.

The system is designed with strict separation of concerns across four core layers:
1. **Interactive Client (Frontend)**: React, TypeScript (strict mode), Vite, Tailwind CSS, `@xyflow/react` for visual architecture editing, Zustand for client state, and Recharts for live telemetry.
2. **REST API Gateway (Backend)**: FastAPI async runtime with versioned `/api/v1` routes, Pydantic schemas, and JWT/RBAC security.
3. **ML Execution Engine**: Native PyTorch compiler, topological sort DAG validator, zero-leakage dataset pipeline, controlled hook manager for neuron explainability, and evolutionary NAS optimizer.
4. **Data & Storage Layer**: PostgreSQL / SQLite metadata persistence via SQLAlchemy ORM, and SHA-256 fingerprint-verified artifact storage.

---

### 2. High-Level Component Interaction Diagram

```
+-----------------------------------------------------------------------------------+
|                            NNAS Web Client (React + TS)                           |
|  [Architecture Studio] [Datasets] [Training Jobs] [Explainability] [Deployments]  |
+----------------------------------------+------------------------------------------+
                                         | REST / HTTPS (Bearer JWT)
                                         v
+-----------------------------------------------------------------------------------+
|                               FastAPI Core Server                                 |
|   /api/v1/auth | /workspaces | /architectures | /datasets | /training | /registry     |
+-------------------+--------------------+--------------------+---------------------+
                    |                    |                    |
                    v                    v                    v
         +--------------------+ +-----------------+ +-------------------+
         | Database Session   | | Background Job  | | Artifact Storage  |
         | PostgreSQL / SQLite| | Thread/Worker   | | (Local / S3)      |
         | SQLAlchemy Models  | | Queue Manager   | | Checkpoints/Blobs |
         +--------------------+ +--------+--------+ +-------------------+
                                         |
                                         v
                      +--------------------------------------+
                      |      PyTorch ML Execution Engine     |
                      |  - Graph -> nn.Module Compiler       |
                      |  - Topological Shape Propagation     |
                      |  - Real Training Loop & Checkpointing|
                      |  - Gradient Saliency & Hooks         |
                      |  - Evolutionary NAS & Pareto Search  |
                      |  - Low-Latency Inference Runtime     |
                      +--------------------------------------+
```

---

### 3. Core Subsystems

#### 3.1 Visual Architecture Studio & Graph Compiler
- **Strict Architecture Schema**: Architectures are stored as a versioned JSON graph containing typed nodes, parameter dictionaries, and directed edges.
- **Controlled Layer Catalog**: Arbitrary code execution is strictly prohibited. Layers are constructed exclusively through a controlled registry (`Input`, `Linear`, `Conv2d`, `MaxPool2d`, `AvgPool2d`, `Flatten`, `ReLU`, `Sigmoid`, `Tanh`, `Softmax`, `Dropout`, `BatchNorm1d/2d`, `LSTM`, `GRU`, `TransformerEncoder`).
- **Graph Validation Algorithm**:
  1. Detects cycles using Kahn's algorithm (directed acyclic graph validation).
  2. Ensures reachability from the primary `Input` node.
  3. Propagates mathematical tensor shapes layer-by-layer starting from `input_shape`.
  4. Calculates exact parameter counts (trainable vs frozen).
  5. Emits structured validation errors for collapsed spatial dimensions or shape mismatches.
- **PyTorch Dynamic Compiler**: Assembles valid graph nodes into an executable `CompiledNetwork(nn.Module)` with forward hook inspection support.

#### 3.2 Real Model Training Subsystem
- **Job States**: `QUEUED`, `STARTING`, `RUNNING`, `PAUSING`, `PAUSED`, `CANCELLING`, `CANCELLED`, `SUCCEEDED`, `FAILED`.
- **Worker Isolation**: Training jobs run in background worker threads, never blocking incoming HTTP requests.
- **Resilience**: On backend startup, stale jobs left in `RUNNING` or `STARTING` are automatically identified and marked with recovery status.
- **Callbacks**: Live epoch metric emissions stream `train_loss`, `val_loss`, `train_acc`, `val_acc`, and per-epoch duration to the browser.
- **Early Stopping & Checkpointing**: Automatic best model checkpointing to disk/S3 based on minimum validation loss.

#### 3.3 Zero-Leakage Dataset Management
- **Partitioning**: 70% Train, 15% Validation, 15% Held-Out Test.
- **Leakage Prevention**: Feature scaling (e.g., `StandardScaler`, `MinMaxScaler`) fits strictly on the training partition and transforms validation/test partitions.
- **Fingerprinting**: SHA-256 content hashes verify dataset integrity.
- **Built-in Offline Support**: Real torchvision MNIST download with automatic synthetic digit rasterizer fallback, ensuring 100% offline self-contained reliability.

#### 3.4 Live Explainability & Model Diagnostics
- **Neuron Activations**: Controlled forward hooks capture intermediate layer activations bounded to 128 neurons per layer to avoid memory leaks.
- **Gradient Saliency**: $\nabla_x \mathcal{S}_c(x)$ calculates exact gradient sensitivity of output class score with respect to input pixels.
- **Permutation Importance**: Shuffles tabular feature columns on validation data to quantify feature drops.
- **Diagnostic Transparency**: Clear labels distinguish mathematical gradient sensitivity from causal claims.

#### 3.5 Automated Architecture Search (NAS)
- **Directed Evolutionary Mutation**: Mutates layer widths, swaps activations, adjusts dropout, or inserts dense layers.
- **Pareto Efficiency Frontier**: Computes non-dominated candidate architectures that maximize validation accuracy while minimizing parameter count.
- **Strict Resource Bounds**: Trial count limits, timeout budgets, and maximum parameter constraints prevent compute exhaustion.

#### 3.6 Serving & Deployment Subsystem
- **Validation Gates**: Models cannot transition to `approved` or `deployed` without a verified physical checkpoint file and held-out test evaluation metrics.
- **Model Warm-up**: Pre-allocates tensors and executes warm-up runs to prime JIT caches before accepting traffic.
- **Empirical Benchmarking**: Measures p50, p95, p99 latencies and throughput (req/s).
- **Rollback Pointer**: Zero-downtime pointer switch to any approved model version.
