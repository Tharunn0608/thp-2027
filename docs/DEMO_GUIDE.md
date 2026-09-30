# Capstone Demonstration Script

## Step-by-Step Evaluator Walkthrough

### 1. Launch Platform
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### 2. Multi-Domain Repository Tour
- In the left sidebar, click **Active Repository** and select **College Management System (CampusOS)**.
- Observe the architecture: 12 nodes including Student Management, Bursar Service, Registrar DB, and Exam Scheduler.
- Click **Core Banking Ledger & Wire System**. Notice the completely distinct financial microservice topology with SWIFT Gateway and double-entry ledger.

### 3. Change Impact & Graph Visualizer
- Select commit `c891a45e21` on CampusOS (*feat(enrollment): validate student prerequisite GPA*).
- Click **Analyze Change**.
- Inspect the **Change-Risk Graph Canvas**:
  - The node `validateEnrollmentEligibility()` is highlighted in blue (Modified).
  - The parent service `StudentService` is highlighted in amber (1-Hop Direct Impact via reversed containment).
  - Downstream `RegistrarDB` and `BursarService` are highlighted in purple (Critical Impact).

### 4. Risk Factors & Evidence Grounding
- In the **Risk Evidence Panel**, examine the AI risk assessment: **78 / 100 (HIGH RISK)**.
- Review grounded evidence citing:
  1. AST modification to prerequisite validation logic.
  2. Active traffic on student enrollment pathways.
  3. Prior incident linkage (`INC-COL-094`: enrollment deadlock).

### 5. Intelligent Test Prioritization
- Switch to the **Tests Scope** tab.
- Observe the test selection table: **12 tests recommended out of 64 total** (**81.25% test reduction**).
- Each test shows an explicit causal justification (e.g. *"Direct test for StudentService.validateEnrollmentEligibility"*).

### 6. What-If Release Simulator
- Switch to the **What-If Release** tab.
- Click **Canary (10% Traffic)**: Note residual risk drops to 34 / 100 with blast radius isolated.
- Click **Direct Release**: Shows full exposure across all student enrollment portals.

### 7. Human Decision Gate & Feedback
- Enter release conditions in the rationale box: *"Approved for 10% canary traffic rollout with monitoring on Bursar latency."*
- Click **Approve with Mitigation (Canary 10%)**.
- Confirmation displays that the decision is locked in the immutable audit log.
- Switch to **History & Feedback** to observe the recorded decision and closed-loop outcome.
