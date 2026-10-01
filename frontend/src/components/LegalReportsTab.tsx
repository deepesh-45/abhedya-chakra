import { useState, useEffect } from 'react';
import { ShieldCheck, Printer, Copy, Check, FileText, Building2 } from 'lucide-react';

interface LegalReportsTabProps {
  victimAccount: string;
}

export const LegalReportsTab: React.FC<LegalReportsTabProps> = ({ victimAccount }) => {
  const [docType, setDocType] = useState<'diary' | 'freeze'>('diary');
  const [targetBank, setTargetBank] = useState<string>('AXIS');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDocument = async () => {
    if (!victimAccount) return;
    setLoading(true);

    try {
      if (docType === 'diary') {
        const resp = await fetch('http://127.0.0.1:8000/api/reports/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ victim_account: victimAccount })
        });
        const data = await resp.json();
        setReportData(data);
      } else {
        const resp = await fetch('http://127.0.0.1:8000/api/reports/freeze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ victim_account: victimAccount, target_bank: targetBank })
        });
        const data = await resp.json();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [docType, targetBank, victimAccount]);

  const handleCopy = () => {
    if (reportData?.raw_text) {
      navigator.clipboard.writeText(reportData.raw_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Document Selector & Actions */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '16px 20px',
        border: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setDocType('diary')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: docType === 'diary' ? 'var(--primary)' : 'var(--surface-2)',
              color: docType === 'diary' ? '#FFFFFF' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={16} />
            <span>Police Case Diary (Sec 192 BNSS)</span>
          </button>

          <button
            onClick={() => setDocType('freeze')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: docType === 'freeze' ? 'var(--primary)' : 'var(--surface-2)',
              color: docType === 'freeze' ? '#FFFFFF' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building2 size={16} />
            <span>Bank Freeze Requisition (Sec 94 BNSS)</span>
          </button>

          {docType === 'freeze' && (
            <select
              value={targetBank}
              onChange={e => setTargetBank(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: '#FFFFFF'
              }}
            >
              <option value="AXIS">AXIS Bank</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="KKBK">Kotak Mahindra Bank</option>
              <option value="SBIN">State Bank of India</option>
              <option value="ICIC">ICICI Bank</option>
              <option value="IPOS">India Post Payments Bank</option>
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)'
            }}
          >
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--primary)'
            }}
          >
            <Printer size={16} />
            <span>Print Notice</span>
          </button>
        </div>
      </div>

      {/* Anti-Hallucination Guardrail Certificate Banner */}
      {reportData?.verification && (
        <div style={{
          backgroundColor: 'var(--success-light)',
          border: '1px solid var(--success-border)',
          borderRadius: '10px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={28} color="var(--success)" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>
                {reportData.verification.compliance_status}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Automated Programmatic Guardrail: Checked {reportData.verification.counts.accounts_checked} Accounts, {reportData.verification.counts.txns_checked} Transactions, {reportData.verification.counts.ifscs_checked} IFSCs. Zero Unverified Entities.
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SHA-256 Digital Custody Hash:</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {reportData.sha256?.slice(0, 24)}...
            </div>
          </div>
        </div>
      )}

      {/* Legal Notice Document Preview */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        padding: '32px',
        boxShadow: 'var(--shadow-md)',
        minHeight: '480px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Generating court-ready legal notice...</div>
        ) : reportData?.raw_text ? (
          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.6,
            color: 'var(--text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {reportData.raw_text}
          </pre>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No notice generated. Please select a victim account to initiate.
          </div>
        )}
      </div>
    </div>
  );
};
