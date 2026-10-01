"""
Explainable Mule Risk Scoring & Classification Engine.
Computes 0-100 Mule Risk Index, assigns Risk Tiers, and generates human-auditable 'Why Flagged' rationale cards.
"""

import json
import time
from typing import Dict, Any, List
import duckdb

class RuleScoringEngine:
    def __init__(self):
        pass

    def compute_scores(self, conn: duckdb.DuckDBPyConnection) -> Dict[str, Any]:
        """Compute rule-based risk score for all accounts in DuckDB."""
        t0 = time.perf_counter()

        conn.execute("DROP TABLE IF EXISTS account_scores;")

        conn.execute("""
            CREATE TABLE account_scores AS
            WITH raw_scores AS (
                SELECT 
                    f.acct_id,
                    f.acct_no,
                    f.primary_ifsc,
                    f.primary_bank,
                    f.in_deg_distinct,
                    f.out_deg_distinct,
                    f.out_in_ratio,
                    f.ptr_15m_approx,
                    f.foreign_ip_ratio,
                    f.headless_ratio,
                    f.cashout_narr_ratio,
                    -- Component 1: Velocity Pass-Through (Weight 30)
                    CASE 
                        WHEN f.ptr_15m_approx >= 0.85 THEN 30.0
                        WHEN f.out_in_ratio >= 0.85 AND f.out_cnt >= 2 THEN 20.0
                        WHEN f.out_in_ratio >= 0.70 THEN 10.0
                        ELSE 0.0
                    END AS score_velocity,
                    -- Component 2: Fan Topology (Weight 25)
                    CASE 
                        WHEN f.in_deg_distinct >= 20 THEN 25.0  -- L1 Collector
                        WHEN f.in_deg_distinct >= 5 AND f.out_in_ratio >= 0.80 THEN 20.0
                        WHEN f.out_deg_distinct BETWEEN 3 AND 15 AND f.out_in_ratio >= 0.75 THEN 25.0 -- L2 Distributor
                        ELSE 0.0
                    END AS score_topology,
                    -- Component 3: Cash-out Signals (Weight 20)
                    CASE 
                        WHEN f.cashout_narr_ratio >= 0.50 THEN 20.0
                        WHEN f.cashout_narr_ratio >= 0.10 THEN 10.0
                        ELSE 0.0
                    END AS score_cashout,
                    -- Component 4: Device/IP Anomaly (Weight 15)
                    LEAST(15.0, (f.foreign_ip_ratio * 10.0 + f.headless_ratio * 10.0)) AS score_device_ip,
                    -- Component 5: Scam Narration markers (Weight 10)
                    CASE 
                        WHEN f.scam_narr_cnt > 0 THEN 10.0
                        ELSE 0.0
                    END AS score_scam_narr,
                    -- Role Assignment
                    CASE
                        WHEN f.in_deg_distinct >= 10 AND f.out_in_ratio >= 0.70 THEN 'COLLECTOR'
                        WHEN f.out_deg_distinct BETWEEN 3 AND 15 AND f.out_in_ratio >= 0.75 THEN 'DISTRIBUTOR'
                        WHEN f.cashout_narr_ratio >= 0.30 OR f.foreign_ip_ratio >= 0.50 OR f.headless_ratio >= 0.50 THEN 'TERMINAL'
                        WHEN f.out_cnt = 0 AND f.in_cnt > 0 THEN 'TERMINAL'
                        ELSE 'REGULAR'
                    END AS predicted_role
                FROM account_features f
            ),
            blended AS (
                SELECT 
                    r.*,
                    ROUND(LEAST(100.0, GREATEST(0.0, 
                        r.score_velocity + r.score_topology + r.score_cashout + r.score_device_ip + r.score_scam_narr
                    ))) AS risk_index
                FROM raw_scores r
            )
            SELECT 
                b.acct_id,
                b.acct_no,
                b.primary_ifsc,
                b.primary_bank,
                b.risk_index,
                b.predicted_role,
                CASE 
                    WHEN b.risk_index >= 85 THEN 'Critical'
                    WHEN b.risk_index >= 65 THEN 'High'
                    WHEN b.risk_index >= 40 THEN 'Medium'
                    ELSE 'Low'
                END AS tier,
                b.score_velocity,
                b.score_topology,
                b.score_cashout,
                b.score_device_ip,
                b.score_scam_narr
            FROM blended b
            ORDER BY b.risk_index DESC;
        """)

        tier_counts = conn.execute("""
            SELECT tier, count(*) as cnt 
            FROM account_scores 
            GROUP BY tier 
            ORDER BY cnt DESC;
        """).fetchall()

        role_counts = conn.execute("""
            SELECT predicted_role, count(*) as cnt 
            FROM account_scores 
            GROUP BY predicted_role 
            ORDER BY cnt DESC;
        """).fetchall()

        elapsed = time.perf_counter() - t0

        return {
            "elapsed_seconds": round(elapsed, 2),
            "tier_distribution": {r[0]: r[1] for r in tier_counts},
            "role_distribution": {r[0]: r[1] for r in role_counts}
        }

rule_scoring_engine = RuleScoringEngine()
