# REST API Specification

All endpoints are hosted under `/api`.

### 1. System Health
- **`GET /api/health`**
  - Returns `200 OK` with service identifier and timestamp.
- **`GET /api/system/health`**
  - Returns component-level status checks:
    ```json
    {
      "status": "PASS",
      "components": {
        "frontend": "PASS",
        "backend": "PASS",
        "database": "PASS",
        "graphEngine": "PASS",
        "temporalEngine": "PASS",
        "aiEngine": "PASS"
      }
    }
    ```

### 2. Repositories
- **`GET /api/repositories`**
  - Lists all configured demo repositories (CampusOS, Banking Core, E-Commerce, Multi-Tenant SaaS).
- **`GET /api/repositories/:id`**
  - Returns details and commit history for specified repository.
- **`GET /api/repositories/:id/commits`**
  - Returns array of commits with diff statistics.

### 3. Change Analysis
- **`POST /api/analysis`** or **`POST /api/projects/:projectId/analyses`**
  - Body: `{ "projectId": "repo-college-mgmt", "commitSha": "c891a45e21", "modelFamily": "B5_TEMPORAL_GRAPH_ML" }`
  - Returns full analysis result with risk score, affected entities, test recommendations, and explanations.

### 4. Granular Analysis Breakdown
- **`GET /api/analysis/:id/risk`** — Score, level, model version, and risk factors.
- **`GET /api/analysis/:id/impact`** — Direct, indirect, and critical components.
- **`GET /api/analysis/:id/tests`** — Recommended prioritized tests and suite reduction %.
- **`GET /api/analysis/:id/explanation`** — Grounded causal explanation and trace IDs.
- **`POST /api/analysis/:id/what-if`** — Simulates release strategies (CANARY_10, CANARY_25, DIRECT).

### 5. Governance & Outcomes
- **`POST /api/analysis/:id/decision`** — Records human release approval or mitigation requirements.
- **`GET /api/decisions`** — Retrieves immutable audit log.
- **`POST /api/analysis/:id/outcome`** — Records observed production performance and incident occurrences.
