"""
High-Performance DuckDB Ingestion Engine.
Loads, normalises, and indexes 2,000,000+ transactions in <= 60 seconds with peak RAM <= 4GB.
Generates Parquet cache, dense dictionary account mapping, and graph arrays.
"""

import os
import hashlib
import time
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Callable
import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
import numpy as np

from backend.app.core.telemetry import telemetry

DB_PATH = Path("data/duckdb/abhedya.duckdb")
PARQUET_PATH = Path("data/parquet/normalised_txns.parquet")
DICT_PATH = Path("data/cache/account_dict.npz")

def compute_file_sha256(filepath: str, block_size: int = 65536) -> str:
    """Stream SHA-256 computation to avoid high RAM usage."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for block in iter(lambda: f.read(block_size), b""):
            hasher.update(block)
    return hasher.hexdigest()

class IngestEngine:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = str(db_path) if db_path else str(DB_PATH)
        self.conn: Optional[duckdb.DuckDBPyConnection] = None
        self.dataset_sha256: str = ""
        self.account_to_id: Dict[str, int] = {}
        self.id_to_account: np.ndarray = np.array([], dtype=object)

    def get_connection(self) -> duckdb.DuckDBPyConnection:
        if self.conn is None:
            self.conn = duckdb.connect(self.db_path)
            self.conn.execute("PRAGMA threads=8;")
            self.conn.execute("PRAGMA memory_limit='4GB';")
        return self.conn

    def ingest_csv(
        self,
        csv_path: str,
        progress_callback: Optional[Callable[[str, int, float, float], None]] = None
    ) -> Dict[str, Any]:
        """
        Ingest bulk transaction CSV.
        Emits progress via callback: (phase, rows, rate_rows_s, ram_mb).
        """
        telemetry.start_timer()
        t0 = time.perf_counter()

        if progress_callback:
            progress_callback("Hashing Dataset (SHA-256)", 0, 0.0, telemetry.current_ram_mb)

        self.dataset_sha256 = compute_file_sha256(csv_path)

        conn = self.get_connection()

        if progress_callback:
            progress_callback("Reading & Normalising CSV into DuckDB", 0, 0.0, telemetry.current_ram_mb)

        # 1. Clean previous staging/tables
        conn.execute("DROP TABLE IF EXISTS raw_txns;")
        conn.execute("DROP TABLE IF EXISTS accounts;")
        conn.execute("DROP TABLE IF EXISTS txns;")

        # 2. Ingest raw CSV in parallel using typed schema
        conn.execute(f"""
            CREATE TABLE raw_txns AS
            SELECT 
                CAST(Transaction_ID AS VARCHAR) AS txn_id,
                LPAD(CAST(Sender_Account AS VARCHAR), 12, '0') AS src_acct,
                LPAD(CAST(Receiver_Account AS VARCHAR), 12, '0') AS dst_acct,
                UPPER(CAST(Sender_IFSC AS VARCHAR)) AS src_ifsc,
                UPPER(CAST(Receiver_IFSC AS VARCHAR)) AS dst_ifsc,
                CAST(Amount AS DOUBLE) AS amount,
                CAST(Timestamp AS TIMESTAMP) AS ts,
                UPPER(CAST(Payment_Mode AS VARCHAR)) AS payment_mode,
                CAST(Narration AS VARCHAR) AS narration,
                CAST(IP_Address AS VARCHAR) AS ip,
                CAST(Device_Type AS VARCHAR) AS device_type
            FROM read_csv(
                '{csv_path}',
                header=true,
                parallel=true,
                ignore_errors=false
            );
        """)

        total_rows = conn.execute("SELECT count(*) FROM raw_txns;").fetchone()[0]
        t_read = time.perf_counter()
        rate_read = total_rows / max(0.001, (t_read - t0))

        if progress_callback:
            progress_callback("Building Dense Account Dictionary", total_rows, rate_read, telemetry.current_ram_mb)

        # 3. Create unique Account dictionary with integer IDs (0 .. N-1)
        conn.execute("""
            CREATE TABLE accounts AS
            WITH distinct_accts AS (
                SELECT src_acct AS acct_no, src_ifsc AS ifsc FROM raw_txns
                UNION
                SELECT dst_acct AS acct_no, dst_ifsc AS ifsc FROM raw_txns
            )
            SELECT 
                ROW_NUMBER() OVER (ORDER BY acct_no) - 1 AS acct_id,
                acct_no,
                FIRST(ifsc) AS primary_ifsc,
                LEFT(FIRST(ifsc), 4) AS primary_bank
            FROM distinct_accts
            GROUP BY acct_no;
        """)

        total_accounts = conn.execute("SELECT count(*) FROM accounts;").fetchone()[0]

        if progress_callback:
            progress_callback("Transforming & Indexing Transactions", total_rows, rate_read, telemetry.current_ram_mb)

        # 4. Create final indexed txns table with dense integer IDs and derived signals
        conn.execute("""
            CREATE TABLE txns AS
            SELECT 
                r.txn_id,
                a_src.acct_id AS src_id,
                a_dst.acct_id AS dst_id,
                r.src_acct,
                r.dst_acct,
                r.src_ifsc,
                r.dst_ifsc,
                LEFT(r.src_ifsc, 4) AS src_bank,
                LEFT(r.dst_ifsc, 4) AS dst_bank,
                r.amount,
                CAST(ROUND(r.amount * 100) AS BIGINT) AS amount_paise,
                r.ts,
                CAST(epoch(r.ts) AS BIGINT) AS ts_epoch,
                r.payment_mode,
                r.narration,
                r.ip,
                (r.ip LIKE '185.%' OR r.ip LIKE '194.%') AS ip_foreign,
                r.device_type,
                (r.device_type IN ('Web_Emulator', 'Linux_Script')) AS device_headless
            FROM raw_txns r
            JOIN accounts a_src ON r.src_acct = a_src.acct_no
            JOIN accounts a_dst ON r.dst_acct = a_dst.acct_no
            ORDER BY src_id, ts;
        """)

        # Drop raw staging table to free memory immediately
        conn.execute("DROP TABLE raw_txns;")

        # 5. Export Parquet Cache for instant warm reloads
        PARQUET_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn.execute(f"COPY txns TO '{PARQUET_PATH}' (FORMAT PARQUET, COMPRESSION ZSTD);")

        # 6. Extract memory dictionary for fast graph queries
        acct_rows = conn.execute("SELECT acct_id, acct_no FROM accounts ORDER BY acct_id;").fetchall()
        self.id_to_account = np.array([r[1] for r in acct_rows], dtype=object)
        self.account_to_id = {r[1]: r[0] for r in acct_rows}

        DICT_PATH.parent.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(DICT_PATH, id_to_account=self.id_to_account)

        total_time = time.perf_counter() - t0
        peak_ram = telemetry.peak_ram_mb

        stats = {
            "dataset_sha256": self.dataset_sha256,
            "total_transactions": total_rows,
            "total_accounts": total_accounts,
            "ingest_time_seconds": round(total_time, 2),
            "rows_per_second": int(total_rows / max(0.001, total_time)),
            "peak_ram_mb": round(peak_ram, 2),
            "parquet_cache_size_mb": round(os.path.getsize(PARQUET_PATH) / (1024 * 1024), 2) if PARQUET_PATH.exists() else 0.0
        }

        if progress_callback:
            progress_callback("Ingestion Complete", total_rows, stats["rows_per_second"], peak_ram)

        return stats

ingest_engine = IngestEngine()
