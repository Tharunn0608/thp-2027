# CHANGELOG — Graph-AI Based Predictive Change Impact Analysis

## [v0.1.0] - 2026-09-17
### Added
- **Requirements Traceability Matrix (RTM):** Full mapping across 14 foundation documents covering CA, RG, AI, BR, TR, WF, EX, FB, SEC, and EXP categories.
- **Architectural Foundation:** Enterprise Observability Command Center architecture with 3-column workspace.
- **T₀ Temporal Barrier Specification:** Guaranteed point-in-time state isolation preventing post-prediction telemetry, incidents, or graph changes from leaking into feature vectors.
- **Software Change-Risk Graph Engine:** Interactive multi-layer canvas modeling Code entities, API endpoints, Microservices, Databases, Kafka Queues, and External Services.
- **Point-in-Time Evidence Panel:** Explainable causal cards citing structured weights, timestamps, and verifiable incident records (e.g. INC-108).
- **Impact-Aware Test Prioritization:** P0/P1/P2 test suite ranking yielding a 98.7% test reduction with 97.4% projected failure detection retention on the microservice benchmark.
- **What-If Release Mitigation Engine:** Multi-scenario exposure estimation comparing direct deployment, 10% canary with automated rollbacks, and dark launches.
- **History & Closed-Loop Outcome Feedback View:** Complete audit trail connecting predictions at $T_0$ to post-deployment ground truth (success, rollback, test execution, latency deltas). Allows inspecting past predictions and feeding valid post-release outcomes into future historical training without retroactive temporal contamination.
- **Automated P0 Temporal Leakage Auditor & Security Gate:** Non-negotiable certification suite checking graph edge timestamp boundaries, future incident rejection, and sanitized prompt boundaries protecting LLM explanations from untrusted inputs.
- **Research Evaluation Harness:** Model comparison matrix across Baselines B0–B5 and chronological ablations A0–A5 with AUROC, F1, Recall, and Test Reduction metrics.
