import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { InvestigateTab } from './components/InvestigateTab';
import { LegalReportsTab } from './components/LegalReportsTab';
import { BenchmarkTab } from './components/BenchmarkTab';
import type { OverviewData } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedVictim, setSelectedVictim] = useState<string>('AIRP10000024');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);

  const loadOverview = () => {
    fetch('http://127.0.0.1:8000/api/overview')
      .then(res => res.json())
      .then(data => {
        setOverviewData(data);
        if (data.sample_victims && data.sample_victims.length > 0) {
          setSelectedVictim(data.sample_victims[0]);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSelectPreset = (preset: any) => {
    loadOverview();
    setSelectedVictim(preset.default_victim);
    setActiveTab('investigate');
  };

  const handleSelectVictim = (victim: string) => {
    setSelectedVictim(victim);
    setActiveTab('investigate');
  };

  const handleNavigateToLegal = (victim: string) => {
    setSelectedVictim(victim);
    setActiveTab('legal');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telemetry={overviewData?.telemetry || null}
        datasetName={overviewData?.dataset_name}
        totalTransactions={overviewData?.total_transactions}
        onDatasetReload={loadOverview}
        onSelectPreset={handleSelectPreset}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'overview' && (
          <OverviewTab
            data={overviewData}
            onSelectVictim={handleSelectVictim}
          />
        )}

        {activeTab === 'investigate' && (
          <InvestigateTab
            initialVictim={selectedVictim}
            onNavigateToLegal={handleNavigateToLegal}
            onDatasetChange={loadOverview}
          />
        )}

        {activeTab === 'legal' && (
          <LegalReportsTab
            victimAccount={selectedVictim}
          />
        )}

        {activeTab === 'bench' && (
          <BenchmarkTab />
        )}
      </main>
    </div>
  );
};

export default App;
