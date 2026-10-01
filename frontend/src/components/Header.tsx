import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, HardDrive, Cpu, FileText, Activity, GitFork, LayoutDashboard, UploadCloud, FileSpreadsheet, X, CheckCircle2, Zap, Layers } from 'lucide-react';
import type { SystemStats, DatasetPreset } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetry: SystemStats | null;
  datasetName?: string;
  totalTransactions?: number;
  onDatasetReload?: () => void;
  onSelectPreset?: (preset: DatasetPreset) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  datasetName = 'VoidHacks8_MuleAccount_2M_Transactions.csv',
  totalTransactions = 2000000,
  onDatasetReload,
  onSelectPreset
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [availablePresets, setAvailablePresets] = useState<DatasetPreset[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/datasets')
      .then(res => res.json())
      .then(data => {
        if (data.datasets) setAvailablePresets(data.datasets);
      })
      .catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Uploading & analyzing dataset...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadStatus('Mapping headers & indexing accounts in DuckDB...');
      const resp = await fetch('http://127.0.0.1:8000/api/ingest/upload', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        throw new Error('Failed to ingest dataset');
      }

      setUploadStatus('Ingestion complete! Updating models and workbench...');
      setTimeout(() => {
        setUploading(false);
        setShowUploadModal(false);
        setUploadStatus(null);
        if (onDatasetReload) onDatasetReload();
      }, 1000);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  const handleSelectDatasetPreset = async (preset: DatasetPreset) => {
    setUploading(true);
    setUploadStatus(`Loading ${preset.name}...`);
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: preset.filepath })
      });

      if (!resp.ok) throw new Error('Failed to load dataset');

      setUploadStatus(`${preset.name} loaded successfully!`);
      setTimeout(() => {
        setUploading(false);
        setShowUploadModal(false);
        setUploadStatus(null);
        if (onSelectPreset) {
          onSelectPreset(preset);
        } else if (onDatasetReload) {
          onDatasetReload();
        }
      }, 800);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border)',
      padding: '12px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Title & Police Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '18px',
            boxShadow: '0 2px 4px rgba(30, 64, 175, 0.2)'
          }}>
            व
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                Operation Vajra
              </h1>
              <span style={{
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid var(--primary-border)'
              }}>
                Indore Police Cyber Cell
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Offline Money Mule Detection, Money Trail Tracing & Legal Case Notice Generator
            </p>
          </div>
        </div>

        {/* Dynamic Dataset Controls & Hardware Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Quick Test Scenarios & Presets Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
              cursor: 'pointer'
            }}
          >
            <Zap size={14} />
            <span>Select Test Datasets & Scenarios</span>
          </button>

          {/* Active Dataset Badge + Switcher */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={15} color="var(--primary)" />
            <span>Dataset: <strong>{datasetName.slice(0, 24)}</strong> ({totalTransactions.toLocaleString()} txns)</span>
            <span style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '4px' }}>Change</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: 'var(--success-light)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            fontSize: '12px',
            fontWeight: 600
          }}>
            <ShieldCheck size={16} />
            <span>100% Offline / Air-Gapped</span>
          </div>

          {telemetry && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--surface-2)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HardDrive size={14} color="var(--primary)" />
                <span>RAM: <strong style={{ color: 'var(--text)' }}>{telemetry.process_ram_mb} MB</strong></span>
              </div>
              <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={14} color="var(--primary)" />
                <span>CPU: <strong style={{ color: 'var(--text)' }}>{telemetry.cpu_percent}%</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '4px' }}>
        {[
          { id: 'overview', label: 'Overview & Summary', icon: LayoutDashboard },
          { id: 'investigate', label: 'Victim Investigation & Trail', icon: GitFork },
          { id: 'legal', label: 'Case Diary & Freeze Notices', icon: FileText },
          { id: 'bench', label: 'System Benchmarks & AI Testing', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dynamic Dataset Ingestion Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '24px 28px',
            width: '740px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={20} color="var(--primary)" />
                  Select Dataset or Test Scenario
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Select from synthetic academic scenarios, high-capacity limit tests, or upload custom bank statements.
                </p>
              </div>
              <button
                onClick={() => !uploading && setShowUploadModal(false)}
                style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Curated Pre-loaded Scenarios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pre-loaded Synthetic Scenarios & Stress Tests
              </div>

              {availablePresets.map(preset => {
                const isStressTest = preset.id === 'scenario_4_mega';
                const isCurrent = datasetName.includes(preset.filepath.split('/').pop()?.slice(0, 15) || '___');

                return (
                  <div
                    key={preset.id}
                    style={{
                      border: isStressTest ? '2px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      backgroundColor: isStressTest ? '#EFF6FF' : isCurrent ? 'var(--surface-2)' : '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                          {preset.name}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: isStressTest ? '#DBEAFE' : 'var(--surface-2)',
                          color: isStressTest ? 'var(--primary)' : 'var(--text-muted)',
                          border: isStressTest ? '1px solid var(--primary-border)' : '1px solid var(--border)'
                        }}>
                          {preset.badge}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)' }}>
                            (Active)
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {preset.description}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Target Victim: <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{preset.default_victim}</strong></span>
                        <span>•</span>
                        <span>Loss Amount: <strong style={{ color: 'var(--danger)' }}>{preset.loss_amount}</strong></span>
                        <span>•</span>
                        <span>Capacity: <strong>{preset.nodes} Accounts / {preset.edges} Flows</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectDatasetPreset(preset)}
                      disabled={uploading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: isStressTest ? 'var(--primary)' : 'var(--surface-2)',
                        color: isStressTest ? '#FFFFFF' : 'var(--text)',
                        border: isStressTest ? 'none' : '1px solid var(--border)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: uploading ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: isStressTest ? '0 2px 4px rgba(37, 99, 235, 0.25)' : 'none'
                      }}
                    >
                      {isStressTest ? '⚡ Test Max Capacity' : 'Select & Trace'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom Upload Drop Zone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Or Ingest Custom Banking CSV File
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--primary-border)',
                  borderRadius: '8px',
                  padding: '24px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--primary-light)',
                  cursor: uploading ? 'wait' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <UploadCloud size={30} color="var(--primary)" />
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  Click to browse or drop any banking CSV statement here
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Auto-maps headers (Src/Dst Accounts, IFSCs, Amounts, Timestamps, Narration)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Progress Status */}
            {uploadStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
