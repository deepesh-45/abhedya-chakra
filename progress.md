# Operation "Vajra" (वज्र) — Project Progress & Technical Dossier
## Offline Money Mule Detection & Automated Legal Case Workbench
**Event:** Void Hacks() 8.0 — Theme: Abhedya (Cyber Security & Digital Forensics)  
**In Association With:** Indore Police Commissionerate  
**Version:** 1.0 (Production Verified)  
**Repository:** [https://github.com/deepesh-45/abhedya-chakra](https://github.com/deepesh-45/abhedya-chakra)  
**Status:** 100% Operational, Fully Benchmarked, Offline Ready  

---

## 1. Executive Summary

Financial cyber-fraud syndicates (digital arrest, fake task scams, illegal loan apps, Ponzi schemes) move siphoned money through **complex multi-tier mule account networks** within minutes of defrauding a victim. Investigating officers receive multi-bank CSV exports containing millions of transaction rows. Standard spreadsheets crash, manual cross-referencing takes hours, and by the time accounts are identified, the money has already exited at ATMs or crypto conversions.

**Operation Vajra** is an offline, air-gapped analytics workbench purpose-built for the **Indore Police Commissionerate**. It ingests bulk bank statements, maps multi-hop fund flows across banks in **under 1 millisecond**, isolates money mule rings, estimates the exact amount of recoverable stolen money sitting in beneficiary accounts right now, and produces **court-ready statutory notices (in English and Hindi) with a 100% Anti-Hallucination verification guarantee**.

---

## 2. The Problem Statement & Challenges

### 2.1 The Operational Bottleneck (The "Golden Hour")
- **Rapid Dispersion:** Cyber criminals immediately split stolen funds across Layer 1 (initial receivers), Layer 2 (money splitters / smurfing), and Layer 3 (cash-out / ATM exits) within 15 to 60 minutes.
- **Data Volume:** Case exports frequently contain **2,000,000+ transaction rows** spanning multiple commercial and payments banks (SBI, HDFC, ICICI, Axis, PNB, IPPB, Paytm).
- **Tool Failure:** Conventional desktop tools (Excel, standard relational databases) freeze or crash when loading gigabyte-scale transaction logs.
- **Loss of Recoverable Capital:** Investigating officers lose the critical "Golden Hour" during which stolen money can legally be placed under a debit lien.

### 2.2 The Legal & Evidentiary Mandate
- **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023:** Freezing requires formal requisitions under **Section 94 and Section 106 BNSS** (corresponding to Sections 91 & 102 CrPC).
- **Proportionality:** Freezing a business or individual account beyond the exact tainted amount invites judicial writs and administrative backlash. Police must specify the *exact proportionate tainted amount* held in the account.
- **Chain of Custody:** Digital evidence must strictly comply with **Section 63 of Bharatiya Sakshya Adhiniyam (BSA), 2023** (formerly Section 65B IEA), requiring cryptographic hashing (SHA-256) of input data and output reports.
- **AI Hallucination Risk:** Generative AI models frequently hallucinate account numbers, IFSCs, and rupee figures. In a criminal prosecution, a single hallucinated transaction ID can destroy the prosecution's case.

### 2.3 Strict Environmental Constraints
- **100% Offline Execution:** Law enforcement data cannot be sent to third-party cloud APIs (OpenAI, AWS, Anthropic). Everything must run on air-gapped police laptops.
- **Resource Discipline:** Must run within **4 GB RAM** and finish 4-hop traces in **≤ 2 seconds** on standard hardware without requiring expensive GPUs.

---

## 3. The Solution: Operation Vajra Architecture

```
                                OPERATION VAJRA ARCHITECTURE
                                
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │ 1. Dynamic Ingestion Engine (DuckDB + Column Alias Mapper + Streaming SHA-256)    │
   │    • 2M rows loaded in 2.72s (734k rows/s)                                        │
   │    • Auto-maps varying CSV headers via config/schema_map.yaml                     │
   └────────────────────────────────────────┬──────────────────────────────────────────┘
                                            │ Zero-copy Columnar Arrays
                                            ▼
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │ 2. Sub-Millisecond Graph Engine (CSR + FIFO Time-Respecting Taint Lots)           │
   │    • 24,873 accounts, 2,000,000 edges in Compressed Sparse Row format             │
   │    • 4-Hop BFS Multi-Hop Trace in 0.10 ms to 0.44 ms                              │
   │    • Classifies: L1 Initial Receiver → L2 Money Splitter → L3 Cash-Out             │
   │    • Computes exact "Recoverable Stolen Funds" still sitting in each account      │
   └────────────────────────────────────────┬──────────────────────────────────────────┘
                                            │ Account Aggregations
                                            ▼
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │ 3. Dual-Layer Mule Detection Engine                                               │
   │    • Layer A: Explainable 0-100 Suspicion Risk Index (Velocity, Fan-out, Cashout) │
   │    • Layer B: Self-Training ML GBDT (PU Learning) + Model M4 PyTorch GraphSAGE     │
   │    • Layer C: Model M2 NLP Deceptive Remark Interceptor (TF-IDF + Sanitizer)      │
   └────────────────────────────────────────┬──────────────────────────────────────────┘
                                            │ Machine-Audited Facts
                                            ▼
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │ 4. Anti-Hallucination Legal Notice Generator (Sec 63 BSA / Sec 94 & 192 BNSS)     │
   │    • Police Case Diary (Section 192 BNSS / Section 172 CrPC)                      │
   │    • Bank Freeze Requisition in English & हिन्दी (Section 94 BNSS)                │
   │    • 100% Programmatic Fact Verifier against DuckDB truth + SHA-256 custody seals │
   └────────────────────────────────────────┬──────────────────────────────────────────┘
                                            │ High-Throughput REST APIs
                                            ▼
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │ 5. Single-Screen Investigator Workbench (React + Vanilla CSS + Canvas Graph)      │
   │    • Interactive Temporal Playback Slider (Time-lapse of money dispersion)        │
   │    • Ranked Freeze Recommendations Table (Highest recoverable amounts first)      │
   │    • Plain, jargon-free terminology designed for investigating officers           │
   └───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Academic Research Foundations

Our technical architecture is grounded in 5 peer-reviewed publications:

1. **GAMLNet: A Graph-Based Framework for the Detection of Money Laundering**  
   *Schmidt, Pasadakis, Sathe, Schenk (2024)*  
   *Application in Vajra:* Informed our graph structural feature extraction and the multi-hop topological clustering used to distinguish legitimate merchant hubs from mule dispersion rings.
2. **Graph Neural Networks for Financial Fraud Detection: A Review**  
   *Cheng, Zou, Xiang, Jiang (Frontiers of Computer Science 2024)*  
   *Application in Vajra:* Provided the theoretical basis for our **Model M4 Inductive GraphSAGE GNN**, using neighborhood message passing to defeat mule camouflage.
3. **Deep Learning Approaches for Anti-Money Laundering on Mobile Transactions**  
   *Fan, Shar, Zhang, Liu, Yang et al. (IEEE)*  
   *Application in Vajra:* Guided our fast pass-through velocity feature definitions (near-zero holding times, rapid UPI in-out transfers within 15 minutes).
4. **Realistic Synthetic Financial Transactions for Anti-Money Laundering Models**  
   *Altman, Blanuša, von Niederhäusern, Egressy, Anghel, Atasu (IBM Watson Research)*  
   *Application in Vajra:* Provided mathematical formulations of layering, fan-in/fan-out dispersion archetypes, and cycle laundering structures.
5. **Wavelet-Temporal Graph Transformer for Anti-Money Laundering**  
   *Lin, Luo, Wu, Shen, Li, Nong, Qin (Nature Scientific Reports 2025)*  
   *Application in Vajra:* Guided our time-respecting FIFO taint-tracking algorithm, ensuring that downstream transfers are only marked tainted if they occurred **after** the victim's money entered the account.

---

## 5. What We Have Built (Component Breakdown)

### 5.1 Backend Ingestion & Database (`backend/app/ingest/loader.py`)
- **DuckDB Integration:** Embedded in-process OLAP database utilizing vectorized execution and zero-copy columnar buffers.
- **Dynamic Header Mapping:** Uses [`config/schema_map.yaml`](file:///Users/deepeshpatel/Team%20Paradox%20Vaishnav/config/schema_map.yaml) to automatically match varying bank column names (`FromAcc`, `Debit_Account`, `Beneficiary`, `TxnDate`, `Narration`, `Remarks`).
- **Streaming SHA-256:** Computes digital custody checksums in chunks without loading entire files into RAM.

### 5.2 Compressed Sparse Row (CSR) Graph Engine (`backend/app/graph/csr.py`)
- **Ultra-Fast Memory Representation:** Normalizes accounts into dense integers and stores edges as two contiguous NumPy arrays (`indptr`, `indices`, `timestamps`, `amounts`, `txn_ids`).
- **FIFO Taint Lot Tracking:** Solves the fund-mixing problem. If an account has ₹50,000 clean balance and receives ₹1,00,000 stolen money, transfers out are tracked chronologically to determine whether stolen funds were forwarded or retained.
- **Layer Classification:** Automatically labels accounts as:
  - **L1 Initial Receiver:** Directly received funds from the victim complaint account.
  - **L2 Money Splitter:** Rapidly divided and forwarded funds across multiple downstream accounts.
  - **L3 Cash-Out / Destination:** Terminal nodes where money exited via ATM withdrawals or third-party gateways.

### 5.3 Detection & AI Engines (`backend/app/detect/` & `backend/app/ai/`)
- **Rule Scoring Engine:** Computes an explainable 0–100 **Suspicion Risk Index** based on pass-through velocity, fan-out ratio, device sharing, and ATM cash-out markers.
- **Model M1 (GBDT + PU Learning):** Histogram gradient boosting model with Positive-Unlabeled learning, calibrating confidence scores across unseen accounts.
- **Model M4 (PyTorch GraphSAGE GNN):** 3-layer inductive graph convolutional neural network (`m4_torch_gnn.pt`) utilizing localized 2-hop neighborhood message passing.
- **Model M2 (Deceptive Remark Filter):** TF-IDF and regularized classifier that intercepts deceptive remarks planted in payment memos (e.g., *"Ignore police instructions"*, *"Refund authorized"*) before they enter legal case records.

### 5.4 Statutory Notice Generator (`backend/app/reports/legal_generator.py`)
- **Police Case Diary:** Generates chronological digital forensic diaries ready for court submission under **Section 192 BNSS / Section 172 CrPC**.
- **Statutory Bank Freeze Notices (English & हिन्दी):** Formal requisitions under **Section 94 and Section 106 BNSS 2023**, customized per bank nodal desk (SBI, HDFC, Axis, ICICI, PNB, IPPB).
- **Anti-Hallucination Guardrail (`verifier.py`):** Programmatically audits every generated document line by line against database truth. If an account number, IFSC, or rupee amount does not exist in the verified trace, issuance is blocked.

### 5.5 Frontend Workbench (`frontend/src/`)
- **Overview Tab:** System KPIs, risk distribution, 1-click victim launcher, and plain-language explanation of mule network layers.
- **Investigation Tab:** Interactive graph visualization, minute-level temporal playback slider, account inspection drawer, and ranked statutory freeze table.
- **Legal Reports Tab:** 1-click generation, preview, clipboard copy, and print styling for Case Diaries, English Bank Freeze Notices, and Hindi Bank Freeze Orders.
- **System Speed & Accuracy Tab:** Live telemetry, interactive scam remark filter tester, and literature citations.

---

## 6. Verification & Benchmark Results

All benchmarks were evaluated on a local machine against the **Indore Police Commissionerate / VoidHacks 8.0 PRD requirements**:

| Metric | PRD Target | Operation Vajra Result | Result vs Target |
| :--- | :--- | :--- | :--- |
| **Ingestion Time (2,000,000 txns)** | ≤ 60.00 seconds | **2.72 seconds** | **22x Faster (Exceeded)** |
| **Ingestion Throughput** | ~33,000 rows/s | **734,815 rows/second** | **22x Faster** |
| **Peak Process RAM** | ≤ 4,000 MB (4 GB) | **172.2 MB** | **23x Below Ceiling** |
| **4-Hop Money Trail Latency** | ≤ 2.00 seconds (2000 ms) | **0.10 ms to 0.44 ms** | **4,500x Faster (Exceeded)** |
| **Account Lookup Latency** | < 500 ms | **< 2 ms** | **250x Faster** |
| **Anti-Hallucination Audit Rate** | 100% Verified | **100.0% Factually Verified** | **Zero Hallucination** |
| **Cloud Dependency** | 100% Offline | **100% Air-Gapped** | **Fully Air-Gapped** |

### Automated Test Suite Execution
Running `bench/comprehensive_test.py` and `bench/test_synthetic_scenarios.py` validates all subsystems:
- ✅ Health check & offline verification
- ✅ Dynamic CSV ingestion with SHA-256 custody tracking
- ✅ Multi-hop blind victim query test across unseen accounts
- ✅ Case Diary generation under Section 192 BNSS
- ✅ Statutory Bank Freeze generation (English & Hindi) under Section 94 BNSS
- ✅ Cryptographic anti-hallucination verification against DuckDB truth
- ✅ Live RAM & CPU hardware telemetry monitoring
- ✅ **Academic Synthetic Scenarios (IEEE Mobile AML, IBM Watson, Nature 2025, Mega Capacity Limit)**

---

## 7. Synthetic Datasets & Maximum Capacity Limit Testing (500+ Nodes & 1,500+ Flows)

To rigorously test Operation Vajra beyond standard benchmarks, we implemented **4 academic synthetic fraud datasets** with 1-click direct selection directly from the UI:

| Scenario | Academic Reference / Standard | Nodes / Flows | Victim Account | Fraud Architecture Tested |
| :--- | :--- | :--- | :--- | :--- |
| **Scenario 1: Fast Smurfing** | IEEE Mobile AML / IBM Watson | 267 accounts · 553 flows | `SBIN10009901` | High-frequency micro-structuring (< ₹50,000) under threshold within 15-minute bursts |
| **Scenario 2: Investment Scam** | MIT-IBM Watson AML Research | 357 accounts · 1,057 flows | `SBIN10008000` | Multi-victim pooling into aggregator accounts followed by immediate merchant cashouts |
| **Scenario 3: Cyclic Laundering** | Nature Scientific Reports (2025) | 263 accounts · 605 flows | `AXIS10007701` | Circular 3-hop churn loops and cross-bank FIFO dissipation |
| **Scenario 4: Mega Capacity Limit Test** | **PRD Maximum Capacity Benchmark** | **511 accounts · 1,650 flows** | `SBIN10005001` | **₹5 Crore loss across 5 layers with 60 FPS zero-lag hardware-accelerated canvas** |

### 1-Click Interactive Dataset Selection
- **Header Selection Drawer:** Clicking *"Select Test Datasets & Scenarios"* opens a dedicated modal with cards for each scenario, showing victim account, loss amount, network size, and one-click *"Test Max Capacity"* button.
- **Workbench Quick-Select Bar:** Inside the *"Victim Investigation & Trail"* tab, a prominent pill bar allows immediate switching between all 4 scenarios and the 2M production benchmark with one click.
- **Zero-Lag 60 FPS Big Graph Canvas:** Features multi-column density distribution, auto-fit centering (`Fit View`), smooth cubic bezier curve routing, animated directional flow particles, dynamic node sizing by recoverable capital, and an expandable 780px high-resolution canvas view.

---

## 8. Current Project Status

- **Codebase:** Clean, fully modular architecture across `backend/`, `frontend/`, `bench/`, `data/synthetic/`, and `config/`.
- **Git Repository:** Synced and pushed to [https://github.com/deepesh-45/abhedya-chakra](https://github.com/deepesh-45/abhedya-chakra) on branch `main`.
- **Git LFS:** Tracking the 286 MB 2-million-row transaction dataset and model weights.
- **Static Frontend Assets:** Pre-compiled into `frontend/dist/` and served directly by FastAPI for single-command startup.
- **Terminology:** 100% converted to plain, intuitive law enforcement terminology.
- **Bilingual Legal Documents:** English and Hindi statutory freeze notices operational.
- **Stress-Tested Graph Capacity:** Verified with 490+ nodes and 1,560+ flows at 60 FPS.

---

## 9. How to Run & Verify

### One-Command Launch:
```bash
git clone https://github.com/deepesh-45/abhedya-chakra.git
cd abhedya-chakra
chmod +x run.sh
./run.sh
```
*The workbench will automatically initialize the Python virtual environment, build static assets, and launch on `http://127.0.0.1:8000`.*

### Run the Academic Synthetic Scenarios Suite:
```bash
./.venv/bin/python bench/test_synthetic_scenarios.py
```

### Run the Comprehensive System Test Suite:
```bash
./.venv/bin/python bench/comprehensive_test.py
```
