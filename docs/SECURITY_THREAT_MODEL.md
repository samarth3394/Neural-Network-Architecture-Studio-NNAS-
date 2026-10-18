# NNAS Security & Threat Model Specification

### 1. Threat Modeling Overview
Neural Network Architecture Studio (NNAS) is evaluated against standard threat modeling frameworks (STRIDE) to ensure resilience against arbitrary code execution, unauthorized data access, privilege escalation, and resource exhaustion.

---

### 2. Threat Analysis & Mitigations

| Threat Category | Potential Risk | NNAS Security Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Impersonation of legitimate users or services | Cryptographically signed JWT tokens with HS256 algorithm and expiration checks. Passwords salted and hashed with `bcrypt`. |
| **Tampering** | Modification of model weights, graphs, or datasets | SHA-256 integrity checksums computed on artifact uploads. Immutable version records in the Model Registry. |
| **Repudiation** | Denying actions performed on critical ML assets | Centralized audit log (`audit_logs`) recording user ID, action, resource type, resource ID, timestamp, and metadata. |
| **Information Disclosure** | Exposure of private training data or internal paths | Strict error envelopes hiding internal stack traces from clients. Sensitive model tensors are never transmitted over public channels. |
| **Denial of Service** | Resource exhaustion via huge models or unbounded training | Hard quotas: Max 50MB upload limit, max concurrent background training jobs (4), timeout limits on NAS searches, and bounded visualization hooks. |
| **Elevation of Privilege** | Viewers modifying models or deploying unapproved endpoints | Server-side Role-Based Access Control (RBAC) enforced on every protected endpoint (`owner`, `admin`, `ml_engineer`, `researcher`, `viewer`). |

---

### 3. Critical Security Controls

#### 3.1 Prohibition of Arbitrary Code Execution
- **Zero `eval()` or `exec()`**: NNAS never executes Python code supplied by clients.
- **Controlled Layer Catalog**: All neural network modules are instantiated strictly through the vetted `LAYER_REGISTRY` mapping.
- **Code Preview Isolation**: PyTorch code generation is strictly output-only (static code string generation for export).

#### 3.2 Path Traversal Prevention
- Any user-provided subpaths are normalized (`os.path.normpath`).
- Paths containing `..` or absolute paths outside `LOCAL_STORAGE_DIR` are rejected with security errors.

#### 3.3 Strict Upload Validations
- File size enforced prior to memory loading (50MB threshold).
- Content validated against CSV parsing and shape verification before database commit.
- Files failing integrity checks are immediately unlinked from storage.

#### 3.4 Model Registry Validation Gates
- Production models cannot be approved or deployed without passing automated validation gates:
  1. A physical model checkpoint binary must exist and pass verification.
  2. The model must have completed evaluation on held-out test data with recorded accuracy/loss metrics.

#### 3.5 Token Handling & Password Security
- Passwords must meet minimum complexity requirements and are hashed with unique salts using native bcrypt.
- JWT access tokens include short-lived expirations and user ID validation.
- All CORS origins are restricted to configured domain whitelists.
