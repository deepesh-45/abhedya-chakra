"""
Synthetic Dataset Generator based on Peer-Reviewed Academic Literature:
1. IBM Watson Research (Altman et al.) - Smurfing, Layering & Fan-Out Structuring
2. IEEE Mobile Transactions (Fan et al.) - UPI/IMPS Pass-Through Velocity & Device Clustering
3. Nature Scientific Reports (Lin et al., 2025) - Cyclic & Multi-Bank Laundering Topologies
"""

import os
import random
import datetime
from pathlib import Path
import pandas as pd
import numpy as np

OUTPUT_DIR = Path("data/synthetic")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BANKS = ["SBIN", "HDFC", "ICIC", "AXIS", "KKBK", "PUNB", "BARB", "PYTM", "IPOS"]
MODES = ["UPI", "IMPS", "NEFT", "RTGS"]
BENIGN_NARRATIONS = [
    "Salary for month", "Grocery store payment", "Rent transfer", "Utility bill",
    "Dining out", "E-commerce purchase", "Family support", "College fees",
    "Medical reimbursement", "Electricity bill payment"
]
SCAM_NARRATIONS = [
    "Task bonus payout", "VIP investment tier", "Crypto release", "Commission 10%",
    "Part time rating work", "USDT clearance", "Refund verification", "Immediate settlement"
]

def make_acct(bank: str, num: int) -> str:
    return f"{bank}1000{num:04d}"

def make_ifsc(bank: str) -> str:
    return f"{bank}000{random.randint(1000, 9999)}"

def make_ip() -> str:
    return f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}"

def generate_scenario_1_fast_smurfing():
    """
    Scenario 1: Fast Pass-Through Smurfing Syndicate (IEEE Mobile AML / IBM Watson)
    - 1 Victim defrauded of ₹25,00,000
    - 2 L1 Initial Receivers (within 10 mins)
    - 16 L2 Money Splitters (within 25 mins)
    - 48 L3 Cash-Out Destinations
    - 2,500 benign background transactions
    """
    print("Generating Scenario 1: Fast Smurfing Syndicate...")
    txns = []
    base_time = datetime.datetime(2026, 9, 20, 10, 0, 0)

    victim = "SBIN10009901"
    l1_nodes = ["HDFC10009902", "ICIC10009903"]
    l2_nodes = [make_acct(random.choice(BANKS), 9100 + i) for i in range(16)]
    l3_nodes = [make_acct(random.choice(BANKS), 9200 + i) for i in range(48)]

    # Step 1: Victim transfers to L1
    amt_part = 1250000.0
    for idx, l1 in enumerate(l1_nodes):
        t1 = base_time + datetime.timedelta(minutes=idx * 4)
        txns.append({
            "Transaction_ID": f"TXN_SMURF_L1_{idx:02d}",
            "Source_Account": victim,
            "Destination_Account": l1,
            "Source_IFSC": make_ifsc("SBIN"),
            "Destination_IFSC": make_ifsc(l1[:4]),
            "Amount_INR": amt_part,
            "Timestamp": t1.strftime("%Y-%m-%d %H:%M:%S"),
            "Payment_Mode": "IMPS",
            "Narration": "Task investment deposit",
            "IP_Address": "49.36.12.88",
            "Device_Type": "Android"
        })

    # Step 2: L1 splits into L2 (8 each within 15 minutes)
    for l1_idx, l1 in enumerate(l1_nodes):
        splitters = l2_nodes[l1_idx * 8 : (l1_idx + 1) * 8]
        split_amt = round(amt_part / 8, 2)
        for s_idx, l2 in enumerate(splitters):
            t2 = base_time + datetime.timedelta(minutes=12 + s_idx * 2)
            txns.append({
                "Transaction_ID": f"TXN_SMURF_L2_{l1_idx}_{s_idx}",
                "Source_Account": l1,
                "Destination_Account": l2,
                "Source_IFSC": make_ifsc(l1[:4]),
                "Destination_IFSC": make_ifsc(l2[:4]),
                "Amount_INR": split_amt,
                "Timestamp": t2.strftime("%Y-%m-%d %H:%M:%S"),
                "Payment_Mode": "UPI",
                "Narration": "Split settlement",
                "IP_Address": "103.21.144.12",
                "Device_Type": "Android"
            })

    # Step 3: L2 disperses to L3 (3 each within 30 minutes)
    for l2_idx, l2 in enumerate(l2_nodes):
        terminals = l3_nodes[l2_idx * 3 : (l2_idx + 1) * 3]
        term_amt = round(split_amt / 3, 2)
        for t_idx, l3 in enumerate(terminals):
            t3 = base_time + datetime.timedelta(minutes=28 + t_idx * 3)
            txns.append({
                "Transaction_ID": f"TXN_SMURF_L3_{l2_idx}_{t_idx}",
                "Source_Account": l2,
                "Destination_Account": l3,
                "Source_IFSC": make_ifsc(l2[:4]),
                "Destination_IFSC": make_ifsc(l3[:4]),
                "Amount_INR": term_amt,
                "Timestamp": t3.strftime("%Y-%m-%d %H:%M:%S"),
                "Payment_Mode": "UPI",
                "Narration": "ATM Cash withdrawal payout",
                "IP_Address": "103.21.144.12",
                "Device_Type": "iOS"
            })

    # Background regular transactions
    bg_accounts = [make_acct(random.choice(BANKS), 1000 + i) for i in range(200)]
    for i in range(2500):
        src = random.choice(bg_accounts)
        dst = random.choice(bg_accounts)
        if src == dst:
            continue
        dt = base_time + datetime.timedelta(minutes=random.randint(-60, 180))
        txns.append({
            "Transaction_ID": f"TXN_BENIGN_S1_{i:04d}",
            "Source_Account": src,
            "Destination_Account": dst,
            "Source_IFSC": make_ifsc(src[:4]),
            "Destination_IFSC": make_ifsc(dst[:4]),
            "Amount_INR": round(random.uniform(150, 12000), 2),
            "Timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "Payment_Mode": random.choice(MODES),
            "Narration": random.choice(BENIGN_NARRATIONS),
            "IP_Address": make_ip(),
            "Device_Type": random.choice(["Android", "iOS", "Windows"])
        })

    df = pd.DataFrame(txns)
    out_path = OUTPUT_DIR / "scenario_1_fast_smurfing.csv"
    df.to_csv(out_path, index=False)
    print(f"Scenario 1 saved: {out_path} ({len(df)} transactions)")
    return out_path

def generate_scenario_2_investment_scam():
    """
    Scenario 2: Multi-Victim Pooling & Layering (IBM Watson Archetype)
    - 5 Victims defrauded of ₹40,00,000 combined
    - 3 Common L1 Collector Accounts
    - 24 L2 Distributor Mules
    - 40 L3 Exit Accounts
    - 4,000 benign background transactions
    """
    print("Generating Scenario 2: Investment Scam Pooling...")
    txns = []
    base_time = datetime.datetime(2026, 9, 22, 14, 0, 0)

    victims = [make_acct(random.choice(BANKS), 8000 + i) for i in range(5)]
    l1_collectors = [make_acct("PUNB", 8100 + i) for i in range(3)]
    l2_splitters = [make_acct(random.choice(BANKS), 8200 + i) for i in range(24)]
    l3_exits = [make_acct(random.choice(BANKS), 8300 + i) for i in range(40)]

    # Victims pool into L1
    for v_idx, v in enumerate(victims):
        target_l1 = l1_collectors[v_idx % 3]
        amt = round(random.uniform(600000, 950000), 2)
        t = base_time + datetime.timedelta(minutes=v_idx * 15)
        txns.append({
            "Transaction_ID": f"TXN_INV_L1_{v_idx}",
            "Source_Account": v,
            "Destination_Account": target_l1,
            "Source_IFSC": make_ifsc(v[:4]),
            "Destination_IFSC": make_ifsc("PUNB"),
            "Amount_INR": amt,
            "Timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
            "Payment_Mode": "RTGS",
            "Narration": "VIP investment capital",
            "IP_Address": "117.200.45.19",
            "Device_Type": "Android"
        })

    # L1 fans out to L2 splitters
    for l1 in l1_collectors:
        for idx in range(8):
            dst = random.choice(l2_splitters)
            t = base_time + datetime.timedelta(hours=2, minutes=idx * 10)
            txns.append({
                "Transaction_ID": f"TXN_INV_L2_{l1}_{idx}",
                "Source_Account": l1,
                "Destination_Account": dst,
                "Source_IFSC": make_ifsc("PUNB"),
                "Destination_IFSC": make_ifsc(dst[:4]),
                "Amount_INR": round(random.uniform(90000, 150000), 2),
                "Timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                "Payment_Mode": "IMPS",
                "Narration": "Settlement remittance",
                "IP_Address": "103.110.22.4",
                "Device_Type": "Windows"
            })

    # L2 fans out to L3 exits
    for l2 in l2_splitters:
        for idx in range(2):
            dst = random.choice(l3_exits)
            t = base_time + datetime.timedelta(hours=5, minutes=idx * 20)
            txns.append({
                "Transaction_ID": f"TXN_INV_L3_{l2}_{idx}",
                "Source_Account": l2,
                "Destination_Account": dst,
                "Source_IFSC": make_ifsc(l2[:4]),
                "Destination_IFSC": make_ifsc(dst[:4]),
                "Amount_INR": round(random.uniform(45000, 75000), 2),
                "Timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                "Payment_Mode": "UPI",
                "Narration": "Payout",
                "IP_Address": "103.110.22.4",
                "Device_Type": "Android"
            })

    # Benign transactions
    bg_accounts = [make_acct(random.choice(BANKS), 2000 + i) for i in range(300)]
    for i in range(4000):
        src = random.choice(bg_accounts)
        dst = random.choice(bg_accounts)
        if src == dst:
            continue
        dt = base_time + datetime.timedelta(hours=random.randint(-12, 48))
        txns.append({
            "Transaction_ID": f"TXN_BENIGN_S2_{i:04d}",
            "Source_Account": src,
            "Destination_Account": dst,
            "Source_IFSC": make_ifsc(src[:4]),
            "Destination_IFSC": make_ifsc(dst[:4]),
            "Amount_INR": round(random.uniform(200, 15000), 2),
            "Timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "Payment_Mode": random.choice(MODES),
            "Narration": random.choice(BENIGN_NARRATIONS),
            "IP_Address": make_ip(),
            "Device_Type": random.choice(["Android", "iOS", "Windows"])
        })

    df = pd.DataFrame(txns)
    out_path = OUTPUT_DIR / "scenario_2_investment_scam.csv"
    df.to_csv(out_path, index=False)
    print(f"Scenario 2 saved: {out_path} ({len(df)} transactions)")
    return out_path

def generate_scenario_3_cyclic_ring():
    """
    Scenario 3: Cyclic Laundering & Cross-Bank Churn (Nature Sci Rep 2025)
    - Tests FIFO dissipation and cycle-breaking across multi-bank hops
    - 1 Victim (₹18,00,000)
    - 12 Cyclic Mule Nodes cycling funds across Axis, Kotak, HDFC, SBI
    - 3,000 background transactions
    """
    print("Generating Scenario 3: Cyclic Laundering Ring...")
    txns = []
    base_time = datetime.datetime(2026, 9, 25, 11, 0, 0)

    victim = "AXIS10007701"
    cycle_nodes = [make_acct(BANKS[i % len(BANKS)], 7710 + i) for i in range(12)]

    # Victim -> First node
    txns.append({
        "Transaction_ID": "TXN_CYC_INIT",
        "Source_Account": victim,
        "Destination_Account": cycle_nodes[0],
        "Source_IFSC": make_ifsc("AXIS"),
        "Destination_IFSC": make_ifsc(cycle_nodes[0][:4]),
        "Amount_INR": 1800000.0,
        "Timestamp": base_time.strftime("%Y-%m-%d %H:%M:%S"),
        "Payment_Mode": "RTGS",
        "Narration": "Digital arrest bail release deposit",
        "IP_Address": "182.74.19.2",
        "Device_Type": "Android"
    })

    # Cycle round-robin: 0->1->2->3->4...->11->2->...
    curr_amt = 1800000.0
    for step in range(20):
        src = cycle_nodes[step % 12]
        dst = cycle_nodes[(step + 1) % 12]
        t = base_time + datetime.timedelta(minutes=15 * (step + 1))
        txns.append({
            "Transaction_ID": f"TXN_CYC_HOP_{step:02d}",
            "Source_Account": src,
            "Destination_Account": dst,
            "Source_IFSC": make_ifsc(src[:4]),
            "Destination_IFSC": make_ifsc(dst[:4]),
            "Amount_INR": round(curr_amt, 2),
            "Timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
            "Payment_Mode": "IMPS",
            "Narration": "Internal clearing transfer",
            "IP_Address": "182.74.19.2",
            "Device_Type": "Android"
        })
        curr_amt -= 35000.0 # Some leakage

    # Benign transactions
    bg_accounts = [make_acct(random.choice(BANKS), 3000 + i) for i in range(250)]
    for i in range(3000):
        src = random.choice(bg_accounts)
        dst = random.choice(bg_accounts)
        if src == dst:
            continue
        dt = base_time + datetime.timedelta(hours=random.randint(-10, 36))
        txns.append({
            "Transaction_ID": f"TXN_BENIGN_S3_{i:04d}",
            "Source_Account": src,
            "Destination_Account": dst,
            "Source_IFSC": make_ifsc(src[:4]),
            "Destination_IFSC": make_ifsc(dst[:4]),
            "Amount_INR": round(random.uniform(100, 20000), 2),
            "Timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "Payment_Mode": random.choice(MODES),
            "Narration": random.choice(BENIGN_NARRATIONS),
            "IP_Address": make_ip(),
            "Device_Type": random.choice(["Android", "iOS", "Windows"])
        })

    df = pd.DataFrame(txns)
    out_path = OUTPUT_DIR / "scenario_3_cyclic_ring.csv"
    df.to_csv(out_path, index=False)
    print(f"Scenario 3 saved: {out_path} ({len(df)} transactions)")
    return out_path

if __name__ == "__main__":
    generate_scenario_1_fast_smurfing()
    generate_scenario_2_investment_scam()
    generate_scenario_3_cyclic_ring()
    print("All 3 academic synthetic scenarios generated successfully!")
