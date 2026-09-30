# AI / ML Model Architecture & Baselines

## Baselines & Proposed Model (B0–B5)

### B0: Random / Heuristic Baseline
Simple baseline assigning fixed default risk without structural or historical awareness.

### B1: Static Dependency Traversal Baseline
Evaluates reachability solely by traversing static AST import graphs and counting reachable dependent nodes and maximum topological depth.

### B2: Rule-Based Impact Analysis
Incorporates tiered component criticality multipliers (e.g. Critical DBs = 22 pts, Direct Dependents = 10 pts).

### B3: Traditional Machine Learning Baseline
Random Forest / Gradient Boosted tabular classifier trained on static code metrics (lines changed, cyclomatic complexity, churn).

### B4: Static Graph Convolutional Network (GCN)
Applies node message passing on static architecture graphs without temporal or runtime weighting.

### B5: Proposed Temporal Graph Neural Network (Prototype)
Fuses:
1. Bidirectional topological reach and criticality.
2. Real-time runtime request volume (RPS on active paths).
3. Chronological historical incident proximity prior to $T_0$.
4. Recent pre-release latency drift indicators.

Output: Calibrated probability ($0.0 - 1.0$), risk score ($0 - 100$), and risk category (LOW, MEDIUM, HIGH, CRITICAL).
