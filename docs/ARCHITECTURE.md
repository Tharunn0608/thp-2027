# System Architecture

## 1. High-Level Architecture

```
+-------------------------------------------------------------------------------+
|                             CLIENT / FRONTEND                                 |
|   React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts       |
|                                                                               |
|   [Main Dashboard]      [Graph Canvas]          [What-If Simulator]           |
|   [Change Summary]      [Test Priority Table]   [Research Benchmarks]         |
|   [Repository Browser]  [Decision Gate]         [History & Feedback Loop]     |
+---------------------------------------+---------------------------------------+
                                        | HTTP / REST (Fetch API)
                                        v
+-------------------------------------------------------------------------------+
|                             SERVER / BACKEND                                  |
|   Node.js + Express 4 + TypeScript (port 3000)                                |
|                                                                               |
|   /api/health           /api/repositories       /api/analysis                 |
|   /api/analysis/:id/*   /api/what-if            /api/decision                 |
+-------------------+-------------------+-------------------+-------------------+
                    |                   |                   |
                    v                   v                   v
+-----------------------+ +-----------------------+ +-----------------------+
|  Graph Engine (AST)   | |  Temporal Pipeline    | |   ML Pipeline (B0-B5) |
|  - SoftwareRiskGraph  | |  - T0 Cutoff Guard    | |   - B1 Static Reach   |
|  - Bidirectional      | |  - Chronological      | |   - B2 Rule Baseline  |
|    CONTAINS bubbling  | |    Isolation          | |   - B5 Temporal GNN   |
+-----------------------+ +-----------------------+ +-----------------------+
                    |                   |                   |
                    +-------------------+-------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                             DATABASE STORE                                    |
|   DatabaseStore (In-Memory / SQLite Pattern)                                  |
|   - Repository metadata & Git commits                                         |
|   - Point-in-time graph snapshots                                             |
|   - Human decision audit logs                                                 |
|   - Post-deployment ground-truth outcomes                                     |
+-------------------------------------------------------------------------------+
```

## 2. Temporal Point-in-Time Isolation ($T_0$)

To prevent future information leakage into prediction features, all historical telemetry, graph relationships, and incidents are bounded by the commit creation timestamp ($T_0$). Any artifact with timestamp $> T_0$ is purged prior to feature extraction.
