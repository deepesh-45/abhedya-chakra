import { ShieldCheck, HardDrive, Cpu, FileText, Activity, GitFork, LayoutDashboard } from 'lucide-react';
import type { SystemStats } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetry: SystemStats | null;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, telemetry }) => {
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
            अ
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                Operation Abhedya-Chakra
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
                Indore Police Cyber Forensics
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Offline Mule-Ring Detection, Multi-Hop Taint Tracking & Automated Legal Case Workbench
            </p>
          </div>
        </div>

        {/* Live Hardware & Offline Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <span>Air-Gapped / Offline Verified</span>
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
          { id: 'overview', label: 'Overview & Statistics', icon: LayoutDashboard },
          { id: 'investigate', label: 'Victim Investigation & Graph', icon: GitFork },
          { id: 'legal', label: 'Case Diary & Freeze Notices', icon: FileText },
          { id: 'bench', label: 'Live Benchmarks & Logs', icon: Activity }
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
    </header>
  );
};
