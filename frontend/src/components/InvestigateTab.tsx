import { useState, useEffect } from 'react';
import { Search, Play, Pause, RotateCcw, Download, ArrowRight, Zap, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import type { TraceResponse, NodeData, FreezeRecommendation, EdgeData } from '../types';
import { GraphCanvas } from './GraphCanvas';

interface InvestigateTabProps {
  initialVictim: string;
  onNavigateToLegal: (victim: string) => void;
  onDatasetChange?: () => void;
}

export const InvestigateTab: React.FC<InvestigateTabProps> = ({ initialVictim, onNavigateToLegal, onDatasetChange }) => {
  const [victimInput, setVictimInput] = useState(initialVictim || 'AIRP10000024');
  const [traceData, setTraceData] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchingDataset, setSwitchingDataset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Selected Node Drawer
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [accountDetails, setAccountDetails] = useState<any | null>(null);

  // Temporal Playback Slider State
  const [minTs, setMinTs] = useState<number>(0);
  const [maxTs, setMaxTs] = useState<number>(0);
  const [currentTs, setCurrentTs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const presets = [
    {
      id: 'scenario_4_mega',
      name: 'Scenario 4: Mega Capacity Limit Test',
      victim: 'SBIN10005001',
      path: 'data/synthetic/scenario_4_mega_capacity_stress_test_500nodes.csv',
      badge: '511 Nodes · 1,650 Flows',
      loss: '₹5 Crore',
      isStress: true
    },
    {
      id: 'scenario_1_smurfing',
      name: 'Scenario 1: Fast Smurfing',
      victim: 'SBIN10009901',
      path: 'data/synthetic/scenario_1_fast_smurfing.csv',
      badge: '267 Nodes · IEEE AML',
      loss: '₹15 Lakh',
      isStress: false
    },
    {
      id: 'scenario_2_investment',
      name: 'Scenario 2: Investment Scam',
      victim: 'SBIN10008000',
      path: 'data/synthetic/scenario_2_investment_scam.csv',
      badge: '357 Nodes · IBM Watson',
      loss: '₹25 Lakh',
      isStress: false
    },
    {
      id: 'scenario_3_cyclic',
      name: 'Scenario 3: Cyclic Laundering',
      victim: 'AXIS10007701',
      path: 'data/synthetic/scenario_3_cyclic_ring.csv',
      badge: '263 Nodes · Nature 2025',
      loss: '₹18 Lakh',
      isStress: false
    },
    {
      id: 'benchmark_2m',
      name: 'VoidHacks 2M Production',
      victim: 'AIRP10000024',
      path: 'VoidHacks8_MuleAccount_2M_Transactions.csv',
      badge: '2M Txns · Benchmark',
      loss: '₹10 Lakh+',
      isStress: false
    }
  ];

  const handleSelectScenario = async (p: typeof presets[0]) => {
    setSwitchingDataset(true);
    setStatusMessage(`Loading ${p.name}...`);
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: p.path })
      });
      if (!resp.ok) throw new Error('Failed to load dataset scenario');
      setStatusMessage(`${p.name} loaded! Tracing money trail...`);
      setVictimInput(p.victim);
      if (onDatasetChange) onDatasetChange();
      await fetchTrace(p.victim);
      setStatusMessage(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSwitchingDataset(false);
    }
  };

  const fetchTrace = async (acct: string) => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setAccountDetails(null);
    setIsPlaying(false);

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victim_account: acct, max_hops: 4 })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Failed to trace victim account');
      }

      const data: TraceResponse = await resp.json();
      setTraceData(data);

      // Compute timestamps range for playback
      if (data.edges.length > 0) {
        const timestamps = data.edges.map(e => e.ts_epoch);
        const earliest = Math.min(...timestamps);
        const latest = Math.max(...timestamps);
        setMinTs(earliest);
        setMaxTs(latest);
        setCurrentTs(latest); // Default to full trail visible
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialVictim) {
      setVictimInput(initialVictim);
      fetchTrace(initialVictim);
    }
  }, [initialVictim]);

  // Fetch account profile when a node is clicked
  useEffect(() => {
    if (!selectedNode) return;
    fetch(`http://127.0.0.1:8000/api/accounts/${selectedNode.acct_no}`)
      .then(res => res.json())
      .then(data => setAccountDetails(data))
      .catch(console.error);
  }, [selectedNode]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTs((prev: number) => {
        const step = Math.max(60, Math.floor((maxTs - minTs) / 100)) * playbackSpeed;
        if (prev + step >= maxTs) {
          setIsPlaying(false);
          return maxTs;
        }
        return prev + step;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, maxTs, minTs, playbackSpeed]);

  const handleExportCSV = () => {
    if (!traceData) return;
    const headers = ['Txn_ID,Src_Account,Dst_Account,Amount_INR,Taint_INR,Hop,Narration,Mode\n'];
    const rows = traceData.edges.map((e: EdgeData) =>
      `"${e.txn_id}","${e.src_acct}","${e.dst_acct}",${e.amount_paise / 100},${e.taint_paise / 100},${e.hop},"${e.narration}","${e.payment_mode}"`
    );
    const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money_trail_${traceData.victim_account}.csv`;
    a.click();
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Quick Test Scenarios & Capacity Stress Test Switcher Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '14px 18px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              1-Click Dataset Scenarios & Graph Capacity Limits:
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              (Select below to test multi-hop rings and maximum scale without UI lag)
            </span>
          </div>
          {statusMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-light)',
              padding: '4px 10px',
              borderRadius: '6px'
            }}>
              <CheckCircle2 size={14} />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {presets.map(p => {
            const isSelected = victimInput === p.victim;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectScenario(p)}
                disabled={switchingDataset || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: p.isStress
                    ? (isSelected ? '#1D4ED8' : '#EFF6FF')
                    : (isSelected ? 'var(--primary)' : 'var(--surface-2)'),
                  color: p.isStress
                    ? (isSelected ? '#FFFFFF' : 'var(--primary)')
                    : (isSelected ? '#FFFFFF' : 'var(--text)'),
                  border: p.isStress
                    ? '1.5px solid var(--primary)'
                    : (isSelected ? '1px solid var(--primary)' : '1px solid var(--border)'),
                  fontSize: '12px',
                  fontWeight: isSelected || p.isStress ? 700 : 500,
                  cursor: switchingDataset ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: p.isStress && !isSelected ? '0 1px 3px rgba(37,99,235,0.15)' : 'none'
                }}
              >
                {p.isStress ? <Sparkles size={14} /> : <Layers size={14} />}
                <span>{p.name}</span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)'
                }}>
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Header Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '16px 20px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            value={victimInput}
            onChange={e => setVictimInput(e.target.value)}
            placeholder="Enter 12-digit Victim Account Number (e.g. AIRP10000024)"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)'
            }}
            onKeyDown={e => e.key === 'Enter' && fetchTrace(victimInput)}
          />
          <button
            onClick={() => fetchTrace(victimInput)}
            disabled={loading}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {loading ? 'Tracing Trail...' : 'Trace Money Trail'}
          </button>
        </div>

        {traceData && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text)'
              }}
            >
              <Download size={14} />
              <span>Export Money Trail CSV</span>
            </button>
            <button
              onClick={() => onNavigateToLegal(traceData.victim_account)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--success)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <span>Draft Freeze Notices</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: 'var(--danger-light)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {traceData && (
        <>
          {/* Metrics Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL SIPHONED (VICTIM)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                ₹{traceData.initial_loss_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>RECOVERABLE (CURRENTLY HELD)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
                ₹{traceData.total_held_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{traceData.recovery_potential_pct}% recoverable</div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600 }}>CASHED-OUT (TERMINAL)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)', marginTop: '4px' }}>
                ₹{traceData.total_cashed_out_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ACCOUNTS IN RING</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                {traceData.num_nodes} nodes · {traceData.num_edges} hops
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>TRACE LATENCY</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                {traceData.timing_ms} ms
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sub-second benchmark</div>
            </div>
          </div>

          {/* Temporal Playback Slider Bar */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '12px 20px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
            </button>

            <button
              onClick={() => { setIsPlaying(false); setCurrentTs(minTs); }}
              style={{ padding: '6px', color: 'var(--text-muted)' }}
              title="Reset to Start"
            >
              <RotateCcw size={16} />
            </button>

            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', minWidth: '120px' }}>
              Temporal Scrubbing:
            </span>

            <input
              type="range"
              min={minTs}
              max={maxTs}
              value={currentTs}
              onChange={e => {
                setIsPlaying(false);
                setCurrentTs(Number(e.target.value));
              }}
              style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />

            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text)', minWidth: '160px', textAlign: 'right' }}>
              {new Date(currentTs * 1000).toLocaleString('en-IN')}
            </span>

            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 5].map(spd => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: playbackSpeed === spd ? 'var(--primary-light)' : 'var(--surface-2)',
                    color: playbackSpeed === spd ? 'var(--primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Graph Visualization + Inspection Drawer */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '2.5fr 1fr' : '1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--layer-victim)' }} />
                    <span>Victim</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--layer-1)' }} />
                    <span>L1 Initial Receiver</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--layer-2)' }} />
                    <span>L2 Money Splitter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--layer-3)' }} />
                    <span>L3 Cash-Out / Destination</span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>Click any node to inspect account details</span>
              </div>

              <GraphCanvas
                nodes={traceData.nodes}
                edges={traceData.edges}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                maxTimestamp={currentTs}
              />
            </div>

            {/* Selected Node Inspection Drawer */}
            {selectedNode && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '560px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Account Forensic Profile</h4>
                  <button onClick={() => setSelectedNode(null)} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Close</button>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--surface-2)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{selectedNode.acct_no}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedNode.bank} · IFSC: {selectedNode.ifsc}</div>
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    width: 'fit-content'
                  }}>
                    {selectedNode.layer} (Hop {selectedNode.hop})
                  </div>
                </div>

                {accountDetails?.score && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600 }}>Mule Risk Index</span>
                      <strong style={{ color: 'var(--danger)' }}>{accountDetails.score.risk_index} / 100</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      • Pass-Through Score: {accountDetails.score.score_velocity} / 30<br/>
                      • Fan Topology Score: {accountDetails.score.score_topology} / 25<br/>
                      • Cash-out Marker Score: {accountDetails.score.score_cashout} / 20
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Recent Linked Transactions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {accountDetails?.recent_transactions?.slice(0, 8).map((txn: any) => (
                      <div key={txn.txn_id} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{txn.txn_id}</span>
                          <strong>₹{txn.amount.toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{txn.narration.slice(0, 32)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommended Freeze Targets Table */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                  Recommended Accounts to Freeze (Ranked by Recoverable Money)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Accounts currently holding stolen money, ready for immediate freezing under Section 94 BNSS
                </p>
              </div>
              <button
                onClick={() => onNavigateToLegal(traceData.victim_account)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Generate Bank Freeze Notices
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Priority Rank</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Account Number</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Bank</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>IFSC Code</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Role in Trail</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Recoverable Stolen Funds</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Share of Stolen Money</th>
                </tr>
              </thead>
              <tbody>
                {traceData.freeze_recommendations.map((rec: FreezeRecommendation, idx: number) => (
                  <tr key={rec.acct_no} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--primary)' }}>#{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{rec.acct_no}</td>
                    <td style={{ padding: '10px 14px' }}>{rec.bank}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{rec.ifsc}</td>
                    <td style={{ padding: '10px 14px' }}>{rec.layer}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--success)' }}>
                      ₹{rec.held_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{rec.coverage_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
