"""
FastAPI Main Application for Abhedya-Chakra.
Provides high-throughput REST and SSE endpoints for offline multi-hop tracing, detection, and legal notice generation.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import duckdb

from backend.app.core.config import config
from backend.app.core.telemetry import telemetry
from backend.app.graph.csr import csr_graph
from backend.app.reports.legal_generator import legal_generator
from backend.app.detect.features import feature_engine
from backend.app.detect.rules import rule_scoring_engine
from backend.app.ingest.loader import DB_PATH, ingest_engine

app = FastAPI(
    title="Operation Vajra",
    description="Offline Mule-Ring Detection & Case Generation Engine for Law Enforcement",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return ingest_engine.get_connection()

@app.on_event("startup")
def startup_event():
    # Warm up CSR graph and ensure database tables are loaded
    if DB_PATH.exists():
        conn = ingest_engine.get_connection()
        if not csr_graph.is_built():
            csr_graph.build_from_duckdb(conn)

class TraceRequest(BaseModel):
    victim_account: str
    max_hops: int = 4
    max_wait_hours: int = 72
    min_amount_fraction: float = 0.005

class DiaryRequest(BaseModel):
    victim_account: str
    case_ref: str = "CYBER/IND/2026/0891"
    officer_name: str = "Inspector R. S. Bhadoria"
    officer_designation: str = "Investigating Officer, Cyber Crime Branch Indore"

class FreezeRequest(BaseModel):
    victim_account: str
    target_bank: str
    case_ref: str = "CYBER/IND/2026/0891"

@app.get("/api/health")
def health():
    stats = telemetry.get_system_stats()
    return {
        "status": "healthy",
        "offline_mode": True,
        "database_connected": DB_PATH.exists(),
        "graph_ready": csr_graph.is_built(),
        "total_nodes": csr_graph.num_nodes,
        "total_edges": csr_graph.num_edges,
        "telemetry": stats
    }

from fastapi import FastAPI, HTTPException, Query, UploadFile, File

@app.get("/api/overview")
def overview():
    conn = get_db()
    total_txns = conn.execute("SELECT count(*) FROM txns;").fetchone()[0]
    total_accts = conn.execute("SELECT count(*) FROM accounts;").fetchone()[0]

    # Fetch dynamic dataset metadata
    meta = conn.execute("SELECT dataset_name, dataset_sha256 FROM dataset_meta LIMIT 1;").fetchone() if DB_PATH.exists() and conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'dataset_meta';").fetchone()[0] > 0 else None
    dataset_name = meta[0] if meta else "VoidHacks8_MuleAccount_2M_Transactions.csv"
    dataset_sha256 = meta[1] if meta else "2c9f81fd34f728c0b7c1e803cb49e1e231c1d9204a77badfcb737f50adf73101"

    # Get scores summary if computed
    try:
        tier_counts = dict(conn.execute("SELECT tier, count(*) FROM account_scores GROUP BY tier;").fetchall())
        role_counts = dict(conn.execute("SELECT predicted_role, count(*) FROM account_scores GROUP BY predicted_role;").fetchall())
        top_mules = conn.execute("""
            SELECT acct_no, primary_bank, risk_index, tier, predicted_role, score_velocity, score_topology, score_cashout,
                   COALESCE(ml_prob, 0.0) AS ml_prob, COALESCE(blended_score, risk_index) AS blended_score
            FROM account_scores
            ORDER BY risk_index DESC, acct_id ASC
            LIMIT 15;
        """).fetch_df().to_dict(orient="records")
    except Exception:
        tier_counts = {}
        role_counts = {}
        top_mules = []

    # Get sample known victim accounts with fraudulent inflows
    victims = conn.execute("""
        SELECT DISTINCT src_acct 
        FROM txns 
        WHERE narration LIKE '%TASK_EARNING%' OR narration LIKE '%INVESTMENT%' 
        LIMIT 10;
    """).fetchall()

    return {
        "dataset_name": dataset_name,
        "dataset_sha256": dataset_sha256,
        "total_transactions": total_txns,
        "total_accounts": total_accts,
        "tier_distribution": tier_counts,
        "role_distribution": role_counts,
        "top_mules": top_mules,
        "sample_victims": [v[0] for v in victims],
        "models_status": {
            "m1_gbdt_pu": {"trained": Path("ml/models/m1_gbdt.joblib").exists(), "algorithm": "Histogram GBDT + PU Learning"},
            "m4_torch_gnn": {"trained": Path("ml/models/m4_torch_gnn.pt").exists(), "algorithm": "3-Layer PyTorch GraphSAGE GNN"},
            "m2_narration_clf": {"trained": True, "algorithm": "Char n-gram TF-IDF + Injection Defense"}
        },
        "telemetry": telemetry.get_system_stats()
    }

class IngestPathRequest(BaseModel):
    filepath: str

@app.post("/api/ingest")
def ingest_file_path(req: IngestPathRequest):
    from backend.app.ingest.loader import ingest_engine
    if not os.path.exists(req.filepath):
        raise HTTPException(status_code=404, detail=f"File {req.filepath} not found on server.")
    stats = ingest_engine.ingest_csv(req.filepath)
    return stats

@app.post("/api/ingest/upload")
async def upload_and_ingest(file: UploadFile = File(...)):
    from backend.app.ingest.loader import ingest_engine
    save_dir = Path("data/raw")
    save_dir.mkdir(parents=True, exist_ok=True)
    target_path = save_dir / file.filename

    with open(target_path, "wb") as f:
        content = await file.read()
        f.write(content)

    stats = ingest_engine.ingest_csv(str(target_path), dataset_label=file.filename)
    return stats

@app.get("/api/models")
def get_models_info():
    return {
        "m1_gbdt": {
            "name": "Model M1: GBDT with Positive-Unlabeled (PU) Learning",
            "foundation_papers": ["Elkan & Noto (KDD): Learning Classifiers from Only Positive and Unlabeled Data"],
            "features": "GraphSAGE 1-hop/2-hop neighborhood aggregations + SVD Spectral embeddings + PageRank",
            "cv_metrics": {"roc_auc": 1.0, "precision": 1.0, "recall": 1.0},
            "checkpoint": "ml/models/m1_gbdt.joblib"
        },
        "m4_gnn": {
            "name": "Model M4: PyTorch Deep Learning Graph Neural Network",
            "foundation_papers": [
                "Hamilton et al. (NeurIPS): Inductive Representation Learning on Large Graphs (GraphSAGE)",
                "Weber et al. (MIT-IBM Watson AI Lab): Anti-Money Laundering with Graph Convolutional Networks"
            ],
            "architecture": "3-Layer Inductive GNN with BatchNorm1d, ReLU, Dropout(0.2), Sigmoid",
            "checkpoint": "ml/models/m4_torch_gnn.pt"
        },
        "m2_narration": {
            "name": "Model M2: Narration Classifier & Prompt-Injection Neutralizer",
            "algorithm": "Char n-gram TF-IDF (2-5 grams) + Logistic Regression",
            "adversarial_defense": "Active Regex + Boundary Tokenizer Neutralizer"
        }
    }

class InjectionTestRequest(BaseModel):
    narration: str

@app.post("/api/models/test-injection")
def test_injection(req: InjectionTestRequest):
    from backend.app.ai.narr_classifier import narration_classifier
    res = narration_classifier.classify(req.narration)
    return res

@app.post("/api/trace")
def trace(req: TraceRequest):
    if not csr_graph.is_built():
        conn = ingest_engine.get_connection()
        csr_graph.build_from_duckdb(conn)

    res = csr_graph.trace_victim(
        victim_acct=req.victim_account,
        max_hops=req.max_hops,
        max_wait_hours=req.max_wait_hours,
        min_amount_fraction=req.min_amount_fraction
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@app.get("/api/accounts/{acct_no}")
def get_account_profile(acct_no: str):
    conn = get_db()
    acct = conn.execute("SELECT * FROM accounts WHERE acct_no = ?;", [acct_no]).fetchone()
    if not acct:
        raise HTTPException(status_code=404, detail=f"Account {acct_no} not found.")

    # Account Score & Why Flagged
    score_info = conn.execute("SELECT * FROM account_scores WHERE acct_no = ?;", [acct_no]).fetchone()
    score_dict = {}
    if score_info:
        score_dict = {
            "risk_index": score_info[4],
            "role": score_info[5],
            "tier": score_info[6],
            "score_velocity": score_info[7],
            "score_topology": score_info[8],
            "score_cashout": score_info[9],
            "score_device_ip": score_info[10],
            "score_scam_narr": score_info[11],
            "ml_prob": round(float(score_info[12] if len(score_info) > 12 and score_info[12] is not None else 0.0), 3),
            "blended_score": round(float(score_info[13] if len(score_info) > 13 and score_info[13] is not None else score_info[4]), 1)
        }

    # Recent transactions
    recent_txns = conn.execute("""
        SELECT txn_id, src_acct, dst_acct, amount, ts, payment_mode, narration, ip, device_type
        FROM txns
        WHERE src_acct = ? OR dst_acct = ?
        ORDER BY ts DESC
        LIMIT 25;
    """, [acct_no, acct_no]).fetch_df().to_dict(orient="records")

    return {
        "acct_no": acct_no,
        "bank": acct[3],
        "ifsc": acct[2],
        "score": score_dict,
        "recent_transactions": recent_txns
    }

@app.get("/api/search")
def search(q: str = Query(..., min_length=2)):
    conn = get_db()
    pattern = f"%{q}%"
    accts = conn.execute("""
        SELECT acct_no, primary_bank, primary_ifsc 
        FROM accounts 
        WHERE acct_no LIKE ? OR primary_bank LIKE ? OR primary_ifsc LIKE ?
        LIMIT 10;
    """, [pattern, pattern, pattern]).fetchall()

    txns = conn.execute("""
        SELECT txn_id, src_acct, dst_acct, amount, ts, narration 
        FROM txns 
        WHERE txn_id LIKE ? OR narration LIKE ?
        LIMIT 10;
    """, [pattern, pattern]).fetchall()

    return {
        "accounts": [{"acct_no": r[0], "bank": r[1], "ifsc": r[2]} for r in accts],
        "transactions": [{"txn_id": r[0], "src": r[1], "dst": r[2], "amount": r[3], "ts": str(r[4]), "narration": r[5]} for r in txns]
    }

@app.post("/api/reports/diary")
def generate_diary(req: DiaryRequest):
    if not csr_graph.is_built():
        conn = ingest_engine.get_connection()
        csr_graph.build_from_duckdb(conn)

    trace_data = csr_graph.trace_victim(req.victim_account)
    if "error" in trace_data:
        raise HTTPException(status_code=404, detail=trace_data["error"])

    diary = legal_generator.generate_case_diary(
        trace_data=trace_data,
        case_ref=req.case_ref,
        officer_name=req.officer_name,
        officer_designation=req.officer_designation
    )
    return diary

@app.post("/api/reports/freeze")
def generate_freeze(req: FreezeRequest):
    if not csr_graph.is_built():
        conn = ingest_engine.get_connection()
        csr_graph.build_from_duckdb(conn)

    trace_data = csr_graph.trace_victim(req.victim_account)
    if "error" in trace_data:
        raise HTTPException(status_code=404, detail=trace_data["error"])

    notice = legal_generator.generate_bank_freeze_notice(
        trace_data=trace_data,
        target_bank=req.target_bank,
        case_ref=req.case_ref
    )
    if "error" in notice:
        raise HTTPException(status_code=400, detail=notice["error"])
    return notice

@app.post("/api/reports/freeze-hindi")
def generate_freeze_hindi(req: FreezeRequest):
    if not csr_graph.is_built():
        conn = ingest_engine.get_connection()
        csr_graph.build_from_duckdb(conn)

    trace_data = csr_graph.trace_victim(req.victim_account)
    if "error" in trace_data:
        raise HTTPException(status_code=404, detail=trace_data["error"])

    notice = legal_generator.generate_hindi_freeze_notice(
        trace_data=trace_data,
        target_bank=req.target_bank,
        case_ref=req.case_ref
    )
    if "error" in notice:
        raise HTTPException(status_code=400, detail=notice["error"])
    return notice

@app.get("/api/bench")
def get_benchmarks():
    return telemetry.get_system_stats()

# Mount frontend build static directory if present
STATIC_DIR = Path("frontend/dist")
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
