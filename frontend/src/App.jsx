import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import OverviewView from './components/OverviewView';
import DemandForecastView from './components/DemandForecastView';
import StudioView from './components/StudioView';
import CatalogMatrixView from './components/CatalogMatrixView';
import ScenarioComparison from './components/ScenarioComparison';
import PipelineStatusView from './components/PipelineStatusView';
import MonitoringSection from './components/MonitoringSection';
import { PRESETS } from './data/presets';
import { checkBackendHealth } from './services/api';

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ ...PRESETS[0].payload });
  
  // Default to Midnight Navy theme (Section 19: Dark/navy visual design)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('stockflow_theme') || 'midnight-navy';
  });

  const [backendStatus, setBackendStatus] = useState({
    isOnline: false,
    latency: 0,
    data: null,
  });

  // Synchronize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stockflow_theme', theme);
  }, [theme]);

  // Periodic API health check
  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      const res = await checkBackendHealth();
      if (isMounted) {
        setBackendStatus(res);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // When an item is selected from catalog, watchlist, or forecast view
  const handleSelectCatalogItem = (item) => {
    setFormData(prev => ({
      ...prev,
      "SKU_ID": item.sku,
      "Product ID": item.sku,
      "Category": item.category,
      "Price": item.price,
      "Competitor Pricing": item.compPrice,
      "Warehouse_ID": item.warehouse,
      "Inventory_Level": item.inStock,
      "Reorder_Point": item.rop,
      "Safety_Stock": item.safetyStock || 30,
      "Warehouse_Capacity": item.warehouseCapacity || 500,
      "Demand_lag_1": item.lag1,
      "Demand_lag_7": item.lag7,
      "Demand_roll_7": item.roll7,
    }));
    setActiveView('studio');
  };

  return (
    <div className="app-shell">
      {/* Left Sidebar Navigation (Structured per Section 15) */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        backendStatus={backendStatus} 
      />

      {/* Main App Content Area */}
      <div className="app-main-content">
        {/* Top Header Navigation */}
        <TopNav 
          activeView={activeView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          setTheme={setTheme}
        />

        {/* View Workspace Routing */}
        <main className="page-workspace" id="main-content">
          {activeView === 'overview' && (
            <OverviewView 
              setActiveView={setActiveView} 
              onSelectCatalogItem={handleSelectCatalogItem}
              searchQuery={searchQuery}
              backendStatus={backendStatus}
            />
          )}

          {activeView === 'forecast' && (
            <DemandForecastView 
              setActiveView={setActiveView}
              onSelectCatalogItem={handleSelectCatalogItem}
            />
          )}

          {activeView === 'catalog' && (
            <CatalogMatrixView 
              onSelectCatalogItem={handleSelectCatalogItem}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {activeView === 'studio' && (
            <StudioView 
              formData={formData} 
              setFormData={setFormData} 
            />
          )}

          {activeView === 'simulation' && (
            <ScenarioComparison />
          )}

          {activeView === 'pipeline' && (
            <PipelineStatusView backendStatus={backendStatus} />
          )}

          {activeView === 'telemetry' && (
            <MonitoringSection backendStatus={backendStatus} />
          )}
        </main>
      </div>
    </div>
  );
}
