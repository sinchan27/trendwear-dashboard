import React from 'react';
import { Sparkles } from 'lucide-react';
import { PLANNING_TABS, PROCUREMENT_TABS } from './data/constants';
import useDashboard from './hooks/useDashboard';

// Tabs
import ControlTowerTab from './components/tabs/ControlTowerTab';
import DemandSupplyPlanningTab from './components/tabs/DemandSupplyPlanningTab';
import PredictionSimulationTab from './components/tabs/PredictionSimulationTab';
import SupplierRiskTab from './components/tabs/SupplierRiskTab';
import FabricSourcingTab from './components/tabs/FabricSourcingTab';
import ScenarioSimulatorTab from './components/tabs/ScenarioSimulatorTab';
import ActionCenterTab from './components/tabs/ActionCenterTab';
import AIRiskStrategyTab from './components/tabs/AIRiskStrategyTab';
import DataHubTab from './components/tabs/DataHubTab';
import MLValidationTab from './components/tabs/MLValidationTab';
import MLModelMetricsTab from './components/tabs/MLModelMetricsTab';

export default function App() {
  const dashboard = useDashboard();
  const { activeTab, setActiveTab } = dashboard;

  const navigateToDataHub = () => setActiveTab('datahub');

  const renderTab = () => {
    switch (activeTab) {
      case 'datahub': 
        return (
          <DataHubTab 
            suppliers={dashboard.suppliers} 
            setSuppliers={dashboard.setSuppliers} 
            skus={dashboard.skus} 
            setSkus={dashboard.setSkus}
            isForecastIngested={dashboard.isForecastIngested}
            setIsForecastIngested={dashboard.setIsForecastIngested}
            ingestedFileName={dashboard.ingestedFileName}
            setIngestedFileName={dashboard.setIngestedFileName}
            resetForecast={dashboard.resetForecast}
          />
        );
      case 'tower': 
        return (
          <ControlTowerTab 
            scenario={dashboard.scenario} 
            skus={dashboard.skus} 
            suppliers={dashboard.suppliers} 
            isForecastIngested={dashboard.isForecastIngested}
            onNavigateDataHub={navigateToDataHub}
          />
        );
      case 'planning': 
        return (
          <DemandSupplyPlanningTab 
            demandSurge={dashboard.demandSurge} 
            capacityLoss={dashboard.capacityLoss} 
            skus={dashboard.skus} 
            isForecastIngested={dashboard.isForecastIngested}
            onNavigateDataHub={navigateToDataHub}
          />
        );
      case 'predict': 
        return (
          <PredictionSimulationTab 
            weeklySim={dashboard.weeklySim} 
            millSim={dashboard.millSim} 
            demandSurge={dashboard.demandSurge} 
            capacityLoss={dashboard.capacityLoss} 
            disruptedMillIds={dashboard.disruptedMillIds} 
            isForecastIngested={dashboard.isForecastIngested}
            onNavigateDataHub={navigateToDataHub}
          />
        );
      case 'ml-metrics': 
        return <MLModelMetricsTab />;
      case 'ml-validation': 
        return (
          <MLValidationTab 
            skus={dashboard.skus} 
            isForecastIngested={dashboard.isForecastIngested}
            onNavigateDataHub={navigateToDataHub}
          />
        );
      case 'suppliers': 
        return (
          <SupplierRiskTab 
            riskAdjusted={dashboard.riskAdjusted} 
            setRiskAdjusted={dashboard.setRiskAdjusted} 
            disruptedMillIds={dashboard.disruptedMillIds} 
            suppliers={dashboard.suppliers} 
            setSuppliers={dashboard.setSuppliers} 
            skus={dashboard.skus} 
            isForecastIngested={dashboard.isForecastIngested}
            onNavigateDataHub={navigateToDataHub}
          />
        );
      case 'fabric': 
        return (
          <FabricSourcingTab 
            fabricSourcing={dashboard.fabricSourcing} 
            skus={dashboard.skus} 
            isForecastIngested={dashboard.isForecastIngested}
            onNavigateDataHub={navigateToDataHub}
          />
        );
      case 'scenario': 
        return (
          <ScenarioSimulatorTab 
            demandSurge={dashboard.demandSurge} 
            setDemandSurge={dashboard.setDemandSurge} 
            capacityLoss={dashboard.capacityLoss} 
            setCapacityLoss={dashboard.setCapacityLoss} 
            disruptedMillIds={dashboard.disruptedMillIds} 
            toggleMillDisruption={dashboard.toggleMillDisruption} 
            scenario={dashboard.scenario} 
            suppliers={dashboard.suppliers}
            isForecastIngested={dashboard.isForecastIngested}
            onNavigateDataHub={navigateToDataHub}
          />
        );
      case 'action': 
        return (
          <ActionCenterTab 
            demandSurge={dashboard.demandSurge} 
            disruptedMillIds={dashboard.disruptedMillIds} 
            scenario={dashboard.scenario} 
            suppliers={dashboard.suppliers} 
            skus={dashboard.skus} 
            isForecastIngested={dashboard.isForecastIngested}
            onNavigateDataHub={navigateToDataHub}
          />
        );
      case 'ai-strategy': 
        return <AIRiskStrategyTab suppliers={dashboard.suppliers} />;
      default: 
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6">
      <header className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-400" size={20} />
          <h1 
            className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent"
            style={{ fontFamily: "'Minecraft', sans-serif" }}
          >
            ATLAS: 1 stop
          </h1>
        </div>
      </header>

      <div className="mb-6 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Planning Section</h2>
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {PLANNING_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Procurement Section</h2>
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {PROCUREMENT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {renderTab()}
    </div>
  );
}
