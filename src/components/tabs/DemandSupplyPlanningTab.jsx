import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { NoDataEmptyState } from '../SharedComponents';
import { formatINR } from '../../utils/helpers';

export default function DemandSupplyPlanningTab({ 
  demandSurge = 0, 
  capacityLoss = 0, 
  skus = [],
  isForecastIngested = false,
  onNavigateDataHub
}) {
  const activeSkus = skus && skus.length > 0 ? skus : [];

  if (!isForecastIngested || activeSkus.length === 0) {
    return (
      <NoDataEmptyState 
        title="No SKU Planning Data Available" 
        onNavigateDataHub={onNavigateDataHub} 
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center justify-between">
          <span>Demand vs. Production Capacity</span>
          <span className="text-xs text-slate-400 font-normal">6-week Puja run-up</span>
        </h3>
        <div className="space-y-4">
          {activeSkus.map((sku) => {
            const adjDemand = Math.round((Number(sku.demand) || 0) * (1 + demandSurge / 100));
            const adjCap = Math.round((Number(sku.capacity) || 0) * (1 - capacityLoss / 100));
            const gap = adjCap - adjDemand;
            const safetyPct = Math.min(100, ((Number(sku.safetyStock) || 400) / (adjCap || 1)) * 100);

            return (
              <div key={sku.id} className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm text-slate-200">
                    {sku.name} <span className="text-xs text-slate-500">({sku.id})</span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${gap < 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {gap < 0 ? `Deficit: ${gap.toLocaleString('en-IN')} units` : `Surplus: +${gap.toLocaleString('en-IN')} units`}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Demand: {adjDemand.toLocaleString('en-IN')} units</span>
                    <span>Capacity: {adjCap.toLocaleString('en-IN')} units</span>
                  </div>
                  <div className="relative w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${gap < 0 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (adjDemand / (adjCap || 1)) * 100)}%` }} />
                    <div className="absolute top-0 h-2 w-0.5 bg-amber-300" style={{ left: `${safetyPct}%` }} title="Safety stock threshold" />
                  </div>
                  <div className="text-[10px] text-amber-300/80">Safety stock threshold: {sku.safetyStock?.toLocaleString('en-IN') || 400} units</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <ShoppingBag size={18} className="text-amber-400" /> Sell-Through &amp; Markdown
        </h3>
        <div className="space-y-3">
          {activeSkus.map((sku) => (
            <div key={sku.id} className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <div className="font-medium text-slate-300">{sku.name}</div>
                <div className="text-slate-500">Sell-through: {sku.sellThrough}% · {formatINR(sku.price || 2000)}</div>
              </div>
              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider ${
                sku.sellThrough < 60 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : sku.sellThrough < 72 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {sku.sellThrough < 60 ? 'Trigger 20% Markdown' : sku.sellThrough < 72 ? 'Watch Margin' : 'Hold Full Price'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
