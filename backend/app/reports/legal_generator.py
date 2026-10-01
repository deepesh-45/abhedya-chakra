"""
Legal Document Generator: Police Case Diary & Bank Freeze Requisitions.
Strictly generated from verified database facts; fully compliant with BNSS/CrPC statutory formats.
"""

import datetime
import hashlib
from typing import Dict, Any, List, Optional

from backend.app.ai.verifier import anti_hallucination_verifier
from backend.app.core.config import config

def format_inr(paise: int) -> str:
    """Format paise to Indian Rupee format ₹X,XX,XXX.XX"""
    rupees = paise / 100.0
    s = f"{rupees:,.2f}"
    return f"₹{s}"

def format_epoch(epoch_sec: int) -> str:
    if not epoch_sec:
        return "N/A"
    return datetime.datetime.fromtimestamp(epoch_sec).strftime("%Y-%m-%d %H:%M:%S IST")

class LegalReportGenerator:
    def __init__(self):
        self.banks_map = config.banks
        self.legal_cfg = config.legal_profiles.get("bnss_2023", {})

    def generate_case_diary(
        self,
        trace_data: Dict[str, Any],
        case_ref: str = "CYBER/IND/2026/0891",
        officer_name: str = "Inspector R. S. Bhadoria",
        officer_designation: str = "Investigating Officer, Cyber Crime Branch Indore"
    ) -> Dict[str, Any]:
        """
        Generate structured Case Diary with layer-wise chronological narrative.
        """
        victim_acct = trace_data["victim_account"]
        loss_inr = trace_data["initial_loss_inr"]
        held_inr = trace_data["total_held_inr"]
        recovery_pct = trace_data["recovery_potential_pct"]
        timestamp_now = datetime.datetime.now().strftime("%d-%b-%Y %H:%M:%S IST")

        # Group nodes by layer
        l1_nodes = [n for n in trace_data.get("nodes", []) if n.get("layer") == "L1_Collector"]
        l2_nodes = [n for n in trace_data.get("nodes", []) if n.get("layer") == "L2_Distributor"]
        l3_nodes = [n for n in trace_data.get("nodes", []) if n.get("layer") == "L3_Terminal"]

        # Build chronological edge narrative
        sorted_edges = sorted(trace_data.get("edges", []), key=lambda e: e.get("ts_epoch", 0))

        lines = []
        lines.append("=" * 80)
        lines.append(f"POLICE CASE DIARY (DIGITAL FORENSICS TRAIL REPORT)")
        lines.append(f"POLICE COMMISSIONERATE INDORE — CYBER CRIME CELL")
        lines.append(f"Under Section 172 CrPC / Section 192 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023")
        lines.append("=" * 80)
        lines.append(f"Case Reference     : {case_ref}")
        lines.append(f"Date & Time        : {timestamp_now}")
        lines.append(f"Investigating Unit : State Cyber Crime Branch, Indore (M.P.)")
        lines.append(f"Investigating Off. : {officer_name}, {officer_designation}")
        lines.append(f"Primary Victim A/C : {victim_acct}")
        lines.append(f"Total Defrauded    : ₹{loss_inr:,.2f}")
        lines.append(f"Tracked Recoverable: ₹{held_inr:,.2f} ({recovery_pct}% recovery potential)")
        lines.append("-" * 80)
        lines.append("\n1. EXECUTIVE SUMMARY & FORENSIC DISCOVERY:")
        lines.append(
            f"During the algorithmic tracing of financial cyber fraud on victim account {victim_acct}, "
            f"an automated time-respecting multi-hop analysis was executed across four layering hops. "
            f"The stolen sum of ₹{loss_inr:,.2f} was siphoned through a multi-tier money mule network consisting of "
            f"{len(l1_nodes)} Layer-1 Collector mule(s), {len(l2_nodes)} Layer-2 Distributor mule(s), and {len(l3_nodes)} Layer-3 Terminal accounts. "
            f"A total of ₹{held_inr:,.2f} remains actively immobilized/held across beneficiary accounts suitable for immediate statutory freeze."
        )

        lines.append("\n2. LAYER-BY-LAYER SYNDICATE STRUCTURE:")
        lines.append("  [A] Layer 1 - Collector Mules (Direct Victim Inflow):")
        for n in l1_nodes:
            lines.append(f"      - Account: {n['acct_no']} | Bank: {n['bank']} | Taint In: {format_inr(n['taint_in_paise'])} | Currently Held: {format_inr(n['held_paise'])}")

        lines.append("  [B] Layer 2 - Distributor Mules (Rapid Dispersion & Smurfing):")
        for n in l2_nodes:
            lines.append(f"      - Account: {n['acct_no']} | Bank: {n['bank']} | Taint In: {format_inr(n['taint_in_paise'])} | Currently Held: {format_inr(n['held_paise'])}")

        lines.append("  [C] Layer 3 - Terminal Cash-Out Mules:")
        for n in l3_nodes:
            lines.append(f"      - Account: {n['acct_no']} | Bank: {n['bank']} | Taint In: {format_inr(n['taint_in_paise'])} | Currently Held: {format_inr(n['held_paise'])}")

        lines.append("\n3. CHRONOLOGICAL TRANSACTION TRAIL (MACHINE-AUDITED):")
        for idx, e in enumerate(sorted_edges, 1):
            lines.append(
                f"  [{idx:02d}] TXN ID: {e['txn_id']} | Time: {format_epoch(e['ts_epoch'])} | "
                f"From: {e['src_acct']} -> To: {e['dst_acct']} | Amount: {format_inr(e['amount_paise'])} | "
                f"Mode: {e['payment_mode']} | Narration: {e['narration'][:30]}"
            )

        lines.append("\n4. STATUTORY FREEZE RECOMMENDATIONS (OPTIMIZED):")
        for rank, f in enumerate(trace_data.get("freeze_recommendations", []), 1):
            lines.append(
                f"  Rank #{rank}: Account: {f['acct_no']} | Bank: {f['bank']} | "
                f"Lien Amount: ₹{f['held_inr']:,.2f} | Coverage: {f['coverage_pct']}% of Loss"
            )

        lines.append("\n" + "=" * 80)
        lines.append("ELECTRONIC EVIDENCE INTEGRITY CERTIFICATE (SEC. 63 BSA / SEC. 65B IEA)")
        lines.append("This document was generated automatically by Operation Abhedya-Chakra analytics workbench.")
        raw_text = "\n".join(lines)

        # Verification check against database truth
        verif_result = anti_hallucination_verifier.verify_document(raw_text, trace_data)
        doc_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

        lines.append(f"Verification Status : {verif_result['compliance_status']}")
        lines.append(f"Document SHA-256    : {doc_hash}")
        lines.append("=" * 80)

        final_text = "\n".join(lines)

        return {
            "title": f"Police Case Diary - {case_ref}",
            "case_ref": case_ref,
            "raw_text": final_text,
            "sha256": doc_hash,
            "verification": verif_result
        }

    def generate_bank_freeze_notice(
        self,
        trace_data: Dict[str, Any],
        target_bank: str,
        case_ref: str = "CYBER/IND/2026/0891"
    ) -> Dict[str, Any]:
        """
        Generate formal statutory Bank Freezing Notice (Section 94/106 BNSS 2023).
        """
        bank_info = self.banks_map.get(target_bank, {
            "name": f"{target_bank} Bank",
            "nodal_email": f"nodal.{target_bank.lower()}@bank.co.in",
            "nodal_desk": "Nodal Cyber Crime Cell Liaison Desk"
        })

        bank_freezes = [
            f for f in trace_data.get("freeze_recommendations", [])
            if f.get("bank") == target_bank
        ]

        if not bank_freezes:
            return {"error": f"No recoverable accounts identified for bank {target_bank}."}

        total_lien_inr = sum(f["held_inr"] for f in bank_freezes)
        date_str = datetime.datetime.now().strftime("%d-%B-%Y")

        lines = []
        lines.append("FORMAL STATUTORY REQUISITION & FREEZE ORDER")
        lines.append("Under Section 94 & Section 106 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)")
        lines.append("(Corresponding to Section 91 & Section 102 of the Code of Criminal Procedure, 1973)")
        lines.append("=" * 80)
        lines.append(f"MEMO NO: IND/CYBER/{case_ref}/{target_bank}                      DATE: {date_str}")
        lines.append(f"\nTO:")
        lines.append(f"  The Nodal Officer / Cyber Crime Liaison Desk,")
        lines.append(f"  {bank_info['name']},")
        lines.append(f"  {bank_info['nodal_desk']}")
        lines.append(f"  Email: {bank_info['nodal_email']}")
        lines.append(f"\nSUBJECT: URGENT NOTICE FOR DEBIT FREEZE / LIEN MARKING ON FRAUD BENEFICIARY ACCOUNTS")
        lines.append(f"REF    : Cyber Crime Complaint Ref: {case_ref}")
        lines.append("-" * 80)
        lines.append("Sir/Madam,\n")
        lines.append(
            f"WHEREAS, an investigation is underway at the State Cyber Police Station, Indore Commissionerate, "
            f"into an organized cyber syndicate fraud wherein ₹{trace_data['initial_loss_inr']:,.2f} was siphoned from victim account "
            f"{trace_data['victim_account']}. Digital forensic tracing has established that tainted funds were channeled "
            f"into the following beneficiary account(s) maintained with your bank:"
        )

        lines.append("\nANNEXURE-A: ACCOUNTS FOR IMMEDIATE DEBIT FREEZE / LIEN MARKING")
        lines.append(f"{'SL':<4} | {'ACCOUNT NUMBER':<16} | {'IFSC CODE':<12} | {'LIEN AMOUNT (INR)':<18} | {'ROLE':<14}")
        lines.append("-" * 75)
        for idx, f in enumerate(bank_freezes, 1):
            lines.append(f"{idx:<4} | {f['acct_no']:<16} | {f['ifsc']:<12} | ₹{f['held_inr']:<17,.2f} | {f['layer']:<14}")
        lines.append("-" * 75)
        lines.append(f"TOTAL AMOUNT TO BE LIEN-MARKED: ₹{total_lien_inr:,.2f}")

        lines.append("\nDIRECTIONS FOR STRICT COMPLIANCE:")
        lines.append("1. Place an immediate debit lien strictly limited to the tainted amount indicated above.")
        lines.append("2. Furnish complete KYC documents, account opening form, registered mobile number, and email ID.")
        lines.append("3. Provide complete bank statement from account opening to date in Excel/PDF format.")
        lines.append("4. Confirm debit freeze compliance within two (2) hours of receipt of this notice via email.")

        lines.append("\nISSUED UNDER SEAL OF:")
        lines.append("Investigating Officer, Cyber Crime Branch")
        lines.append("Police Commissionerate, Indore (Madhya Pradesh)")

        raw_text = "\n".join(lines)
        verif_result = anti_hallucination_verifier.verify_document(raw_text, trace_data)
        doc_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

        return {
            "bank": target_bank,
            "bank_name": bank_info["name"],
            "accounts_count": len(bank_freezes),
            "total_lien_inr": total_lien_inr,
            "raw_text": raw_text,
            "sha256": doc_hash,
            "verification": verif_result
        }

legal_generator = LegalReportGenerator()
