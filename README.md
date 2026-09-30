# AI Change-Risk Graph for Software Releases

> **"Predict what a software change could affect before release."**  
> *Graph-AI Based Predictive Change Impact Analysis for Risk-Aware Software Release Engineering*

---

## 1. Project Overview & Core Idea

When a developer changes code, the impact can ripple through files, APIs, microservices, databases, event streaming queues, external third-party providers, infrastructure, and end-users. 

Traditional approaches (manual code review, static code linters, isolated unit tests, and rule-based impact tools) do not capture the dynamic confluence of **structural dependencies, runtime behavior, historical incident context, test mappings, and chronological point-in-time constraints**.

Our platform constructs a continuously updated **Temporal Software Change-Risk Graph** and leverages graph-AI risk reasoning to:
1. **Identify Affected Components**: Calculate 1-hop direct, 2-hop indirect, and critical blast radius through bidirectional AST and dependency traversal.
2. **Predict Release Risk**: Compute calibrated 0–100 risk scores and confidence levels before production deployment.
3. **Prioritize Targeted Tests**: Rank regression suites and eliminate redundant tests (delivering 80–95% suite reduction with high failure detection retention).
4. **Deliver Evidence-Grounded Explanations**: Trace predictions directly to observed call traces, runtime volume, and historical post-mortems.
5. **Simulate What-If Release Scenarios**: Compare Canary 10%, Canary 25%, and Direct Release exposures.
6. **Support Human-in-the-Loop Decisions**: Maintain strict separation between AI intelligence and authoritative engineering release decisions with full audit logging.
7. **Close the Feedback Loop**: Record post-release telemetry (latency, error rates, incidents) to inform future learning cycles.

---

## 2. Academic Positioning

> *"Our contribution is the integration of temporal software dependency information with runtime behaviour, historical incident evidence, AI-based risk prediction, test prioritization, and evidence-grounded explanation into one actionable change-risk analysis pipeline."*

- **Graph**: Structural relationship and knowledge representation (Code, APIs, Services, DBs, Queues, Tests, Incidents).
- **AI / ML**: Quantitative risk scoring and component reachability estimation.
- **Explanation**: Human-readable reasoning grounded strictly in real observed data.
- **Testing**: Testing is not replaced; the system intelligently prioritizes tests most relevant to the change.

---

## 3. Supported Multi-Domain Repositories

The platform is **repository-agnostic** and can analyze supported software projects across different architectures:

1. **CampusOS (College Management System)**:
   - Educational ERP: Student Enrollment, Fee Billing, Course Catalog, Exam Scheduler, Registrar DB.
2. **Core Banking Ledger & Wire System**:
   - High-integrity Financial Engine: Wire Validation, Double-Entry Ledger, OFAC Sanctions, SWIFT Gateway.
3. **E-Commerce Microservices Testbed**:
   - Distributed Retail System: Checkout API, Cart Service, Payment Gateway, Kafka Event Bus, Order DB.
4. **Multi-Tenant Cloud SaaS Platform**:
   - Enterprise SaaS: RBAC Gateway, Tenant Isolation Engine, Audit Logging.

---

## 4. Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Motion.
- **Backend & API**: Node.js, Express, TypeScript (`tsx`).
- **Database**: In-memory `DatabaseStore` with clean schema initialization, immutable audit logs, and idempotent seeding.
- **Graph & ML Engines**: Custom `SoftwareRiskGraphEngine` with bidirectional `CONTAINS` traversal and `ModelRiskPipeline` supporting Baselines B0–B5.

---

## 5. Prerequisites & Local Setup

### Requirements
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Operating System**: macOS, Linux, or Windows (WSL recommended)

### Quick Start (VS Code)

```bash
# 1. Clone or extract the project ZIP
cd ai-change-risk-graph

# 2. Install dependencies
npm install

# 3. Seed database with multi-domain repositories
npm run seed

# 4. Start full-stack application (Frontend + Backend API on Port 3000)
npm run dev
```

Open your browser to: **`http://localhost:3000`**

---

## 6. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Express backend and Vite frontend concurrently on port 3000 |
| `npm run seed` | Seeds demo repositories, graph topologies, incidents, and telemetry |
| `npm test` | Runs the automated audit suite (graph traversal, leakage guard, ML models) |
| `npm run lint` | Runs TypeScript static verification (`tsc --noEmit`) |
| `npm run build` | Compiles frontend assets and bundles server for production |
| `npm run start` | Launches compiled production server from `dist/` |

---

## 7. REST API Endpoints

- `GET /api/health` — Service health check
- `GET /api/system/health` — Comprehensive component status (Frontend, Backend, Database, Graph, AI)
- `GET /api/repositories` — List all configured repositories
- `GET /api/repositories/:id/commits` — List commits for target repository
- `GET /api/projects/:id/graph` — Retrieve point-in-time ($T_0$) graph snapshot
- `POST /api/analysis` — Trigger change analysis for commit
- `GET /api/analysis/:id/risk` — Breakdown of risk score and factors
- `GET /api/analysis/:id/impact` — Directly and indirectly affected entities
- `GET /api/analysis/:id/tests` — Recommended regression test suite
- `GET /api/analysis/:id/explanation` — Grounded natural-language explanation
- `POST /api/analysis/:id/what-if` — Simulate release exposure scenarios
- `POST /api/analysis/:id/decision` — Submit human release decision
- `POST /api/analysis/:id/outcome` — Record post-deployment feedback

---

## 8. Demo Workflow for Capstone Presentation

1. **Repository Selection**: In the left sidebar or Repository Explorer, select **CampusOS** or **Core Banking Ledger**.
2. **Commit Inspection**: Select a target commit (e.g., student GPA validation or wire AML threshold changes).
3. **Trigger Analysis**: Click **Analyze Change**.
4. **Inspect Graph**: Observe the interactive canvas highlighting changed nodes, 1-hop direct impacts, and critical downstream dependencies.
5. **Review AI Risk**: Inspect the calibrated 0–100 risk score and contributing factors.
6. **Prioritize Tests**: Review recommended tests showing 80–90% suite reduction.
7. **Read Explanation**: Verify that explanations cite real call traces, observed telemetry, and past incidents.
8. **What-If Simulation**: Toggle between Canary 10% and Direct Release to compare risk exposure.
9. **Record Decision**: Enter release rationale and submit human approval (*Release with Mitigation*).
10. **Feedback Loop**: Record observed post-release outcome to close the continuous learning loop.
