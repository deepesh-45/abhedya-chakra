import React, { useState, useRef } from 'react';
import { ShieldCheck, HardDrive, Cpu, FileText, Activity, GitFork, LayoutDashboard, UploadCloud, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';
import type { SystemStats } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetry: SystemStats | null;
  datasetName?: string;
  totalTransactions?: number;
  onDatasetReload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  datasetName = 'VoidHacks8_MuleAccount_2M_Transactions.csv',
  totalTransactions = 2000000,
  onDatasetReload
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleLoadDefault = async () => {
    setUploading(true);
    setUploadStatus('Loading VoidHacks 2M benchmark dataset...');
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: 'VoidHacks8_MuleAccount_2M_Transactions.csv' })
      });

      if (!resp.ok) throw new Error('Failed to load dataset');

      setUploadStatus('Benchmark dataset loaded successfully!');
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
              color: 'var(--text)'
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
                transition: 'all 0.15s ease'
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
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '28px',
            width: '540px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                  Load Transaction Dataset
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Upload any banking transaction CSV export or switch datasets
                </p>
              </div>
              <button onClick={() => !uploading && setShowUploadModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Upload Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--primary-border)',
                borderRadius: '8px',
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--primary-light)',
                cursor: uploading ? 'wait' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <UploadCloud size={36} color="var(--primary)" />
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                Click to browse or drop any banking CSV here
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Auto-detects column names (accounts, IFSCs, amounts, dates, remarks)
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

            {/* Quick Preset: Load 2M Benchmark File */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--surface-2)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>VoidHacks 2M Benchmark Dataset</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2,000,000 transactions · 24,873 accounts</div>
              </div>
              <button
                onClick={handleLoadDefault}
                disabled={uploading}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Load Benchmark
              </button>
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
