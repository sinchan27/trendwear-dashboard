import React from 'react';
import { 
  IndianRupee, 
  Truck, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Layers, 
  ShoppingBag, 
  Factory, 
  Package, 
  ArrowUpRight,
  Percent
} from 'lucide-react';
import { MetricCard, SignalBox, NoDataEmptyState } from '../SharedComponents';
import { formatINR } from '../../utils/helpers';

export default function ControlTowerTab({ 
  scenario, 
  skus = [], 
  suppliers = [],
  isForecastIngested = false,
  onNavigateDataHub
}) {
  const activeSkus = skus && skus.length > 0 ? skus : [];
  const activeSuppliers = suppliers && suppliers.length > 0 ? suppliers : [];

  // If no file has been ingested yet, render empty state prompting upload in Layer 1: Data Hub
  if (!isForecastIngested || activeSkus.length === 0) {
    return (
      <div className="space-y-6">
        <NoDataEmptyState 
          title="No Demand Dataset Ingested in Control Tower"
          onNavigateDataHub={onNavigateDataHub}
        />
      </div>
    );
  }

  // Dynamically calculate SKU summaries from the active ingested dataset
  const bestSellerCount = activeSkus.filter(s => Number(s.sellThrough || 0) >= 72).length;
  const markdownAtRiskCount = activeSkus.filter(s => Number(s.sellThrough || 0) < 60).length;
  const totalVolume = activeSkus.reduce((sum, s) => sum + (Number(s.demand) || 0), 0);
  const totalCapacity = activeSkus.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const projectedGMV = scenario.totalRevenue || activeSkus.reduce((sum, s) => sum + (Number(s.demand) || 0) * (Number(s.price) || 2000), 0);

  return (
    <div className="space-y-6">
      {/* Dynamic Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard 
          title="Projected Season GMV" 
          value={formatINR(projectedGMV)} 
          subtext={`From ${activeSkus.length} active Puja SKUs`} 
          icon={ArrowUpRight} 
          trend="Forecast" 
          trendColor="text-purple-400" 
        />
        <MetricCard 
          title="Total Season S&OP Cost" 
          value={formatINR(scenario.estimatedCost)} 
          subtext="Dynamic production & fabric cost" 
          icon={IndianRupee} 
          trend={scenario.stockoutRisk > 10 ? 'Elevated' : 'Optimized'} 
          trendColor={scenario.stockoutRisk > 10 ? 'text-amber-400' : 'text-emerald-400'} 
        />
        <MetricCard 
          title="On-Time Delivery Rate" 
          value={`${scenario.avgOtd}%`} 
          subtext="Weighted across active suppliers" 
          icon={Truck} 
          trend={scenario.avgOtd > 85 ? 'Healthy' : 'Watch'} 
          trendColor={scenario.avgOtd > 85 ? 'text-green-400' : 'text-amber-400'} 
        />
        <MetricCard 
          title="Stockout Risk" 
          value={`${scenario.stockoutRisk}%`} 
          subtext={scenario.stockoutRisk > 10 ? 'Action required' : 'Within tolerance'} 
          icon={AlertTriangle} 
          trend={scenario.stockoutRisk > 10 ? 'High' : 'Low'} 
          trendColor={scenario.stockoutRisk > 10 ? 'text-red-400' : 'text-green-400'} 
        />
        <MetricCard 
          title="Markdown Loss Reserve" 
          value={formatINR(scenario.markdownLoss)} 
          subtext={`${markdownAtRiskCount} SKU(s) below 60% sell-through`} 
          icon={TrendingUp} 
          trend={markdownAtRiskCount > 0 ? 'Discount Trigger' : 'Full Margin'} 
          trendColor={markdownAtRiskCount > 0 ? 'text-orange-400' : 'text-emerald-400'} 
        />
      </div>

      {/* Real-Time Live Ingestion & S&OP Execution Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Demand vs Production Capacity</span>
            <Package size={16} className="text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {totalVolume.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">demand / {totalCapacity.toLocaleString('en-IN')} cap</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full ${totalVolume > totalCapacity ? 'bg-red-500' : 'bg-blue-500'}`} 
              style={{ width: `${Math.min(100, (totalVolume / (totalCapacity || 1)) * 100)}%` }} 
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {totalVolume > totalCapacity ? `Deficit of ${(totalVolume - totalCapacity).toLocaleString('en-IN')} units` : `Surplus buffer of ${(totalCapacity - totalVolume).toLocaleString('en-IN')} units`}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collection SKU Composition</span>
            <Percent size={16} className="text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {bestSellerCount} <span className="text-xs font-normal text-emerald-400">Best-Sellers</span> · {markdownAtRiskCount} <span className="text-xs font-normal text-red-400">Markdown</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            {activeSkus.length} active collection styles currently modeled across 4 regional fabric clusters.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Supplier Health</span>
            <ShieldAlert size={16} className="text-purple-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {scenario.avgRiskScore}/100 <span className="text-xs font-normal text-slate-400">Blended Risk</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            {activeSuppliers.length} mills connected · {scenario.avgOtd}% average on-time delivery index.
          </p>
        </div>
      </div>

      {/* Cross-Functional Signals */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-indigo-400" /> Cross-Functional Live Signals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <SignalBox 
            title="Merchandising" 
            icon={ShoppingBag} 
            items={[`${activeSkus.length} SKUs in festive run-up`, `GMV: ${formatINR(projectedGMV)}`, 'Live sell-through tracking']} 
            color="border-l-blue-500" 
          />
          <SignalBox 
            title="Production" 
            icon={Factory} 
            items={[`Capacity: ${totalCapacity.toLocaleString('en-IN')} units`, '4–6 wk fabric lead time', 'Plant buffer monitoring']} 
            color="border-l-emerald-500" 
          />
          <SignalBox 
            title="Procurement" 
            icon={ShieldAlert} 
            items={[`${activeSuppliers.length} active regional mills`, `Avg. OTD: ${scenario.avgOtd}%`, 'Automated risk weighting']} 
            color="border-l-purple-500" 
          />
          <SignalBox 
            title="Logistics" 
            icon={Truck} 
            items={['DC → Store dispatch schedule', 'Peak-season freight buffer', 'Regional delivery tracking']} 
            color="border-l-cyan-500" 
          />
          <SignalBox 
            title="Financials" 
            icon={TrendingUp} 
            items={[`Cost: ${formatINR(scenario.estimatedCost)}`, `Markdown: ${formatINR(scenario.markdownLoss)}`, 'Full-margin protection']} 
            color="border-l-amber-500" 
          />
        </div>
      </div>
    </div>
  );
}
