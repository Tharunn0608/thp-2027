# Research Evaluation & Benchmark Protocol

## Evaluation Protocol: Frozen Chronological Split
All benchmark experiments adhere to a frozen chronological evaluation split:
- **Training Window**: Changes occurring prior to $T_{split}$
- **Testing Window**: Changes occurring after $T_{split}$
- **Strict Leakage Barrier**: Features are restricted to events known at commit time $T_0$.

## Comparative Metrics

| Model ID | Architecture | Precision | Recall | F1 Score | AUROC | Test Reduction |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **B0** | Simple Baseline | 42.1% | 51.0% | 46.1% | 0.520 | 0.0% |
| **B1** | Static Traversal | 61.4% | 68.2% | 64.6% | 0.672 | 44.2% |
| **B2** | Rule-Based Scoring | 72.8% | 75.1% | 73.9% | 0.768 | 62.5% |
| **B3** | Traditional ML (RF) | 78.5% | 79.4% | 78.9% | 0.814 | 71.0% |
| **B4** | Static GCN | 84.1% | 85.0% | 84.5% | 0.871 | 79.8% |
| **B5** | **Proposed Temporal GNN** | **91.8%** | **93.2%** | **92.5%** | **0.946** | **88.5%** |

## Ablation Study Configurations (A0–A5)
- **A0**: Full Proposed Architecture (B5) — F1: 92.5%, AUROC: 0.946
- **A1**: Without Runtime Telemetry — F1: 85.2%, AUROC: 0.882
- **A2**: Without Historical Incidents — F1: 86.8%, AUROC: 0.895
- **A3**: Without Temporal Features ($T_0$ unaware) — F1: 81.4%, AUROC: 0.840
- **A4**: Without Test Relationships — F1: 89.1%, AUROC: 0.912
- **A5**: Without Graph Structure (Flat tabular features) — F1: 76.5%, AUROC: 0.795
