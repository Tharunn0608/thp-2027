# PROJECT DECISION LOG

| ID | Decision | Context & Justification | Impacted Modules | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | Full-Stack Express + React 19 Architecture | Sandboxed port 3000 requirement for cloud deployment and instant interactive reactivity without flaky external daemon processes. | Core backend / frontend serving | APPROVED |
| **DEC-002** | In-Engine Heterogeneous Property Graph Engine | Realizes typed nodes (Service, API, DB, Queue, Code, Incident) and multi-relational edges without requiring external unauthenticated Neo4j clusters. | Graph Layer, Traversal Engine | APPROVED |
| **DEC-003** | Point-in-Time $T_0$ Temporal Feature Barrier | Absolute prohibition of post-prediction telemetry, test runs, or incidents from entering feature generation. Enforced via timestamp validation. | Temporal Feature Pipeline, RTM SEC-03 | APPROVED |
| **DEC-004** | Grounded LLM Explanation Boundary | LLM acts strictly as a structured evidence synthesizer. Quantitative risk scores and test priorities remain deterministic to prevent hallucination. | AI Explanation Layer, RTM AI-09 | APPROVED |
| **DEC-005** | Controlled Microservice Benchmark Testbed | E-Commerce checkout testbed with 12 controlled change scenarios (low to critical risk) clearly marked as `controlled_synthetic` to uphold academic honesty. | Data layer, Research evaluation | APPROVED |
| **DEC-006** | Test Reduction vs. Failure Retention Metric Pair | Test reduction is paired with retained failure detection rate so test suites are not blindly pruned at the expense of regression discovery. | Test Prioritization, Research Spec | APPROVED |
