import React from 'react';
import { ArrowRight, Factory, Package, ShieldAlert, IndianRupee } from 'lucide-react';
import { HandoffCard, NoDataEmptyState } from '../SharedComponents';
import { SUPPLIERS as DEFAULT_SUPPLIERS } from '../../data/constants';
import { formatINR } from '../../utils/helpers';

export default function ActionCenterTab({ 
  demandSurge = 0, 
  disruptedMillIds = [], 
  scenario, 
  suppliers = DEFAULT_SUPPLIERS, 
  skus = [],
  isForecastIngested = false,
  onNavigateDataHub
}) {
  const activeSuppliers = suppliers && suppliers.length > 0 ? suppliers : DEFAULT_SUPPLIERS;
  const activeSkus = skus && skus.length > 0 ? skus : [];

  if (!isForecastIngested || activeSkus.length === 0) {
    return (
      <NoDataEmptyState 
        title="No S&OP Decision Actions Available" 
        onNavigateDataHub={onNavigateDataHub} 
      />
    );
  }

  // Find top demand SKU and top capacity SKU
  const topDemandSku = [...activeSkus].sort((a, b) => b.demand - a.demand)[0];
  const lowestSellThroughSku = [...activeSkus].sort((a, b) => a.sellThrough - b.sellThrough)[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <ArrowRight size={18} className="text-emerald-400" /> Decision &amp; Execution Handoff
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HandoffCard
          title="Production Recommendation" 
          badge="Capacity Rebalancing" 
          badgeColor="bg-blue-500/20 text-blue-300" 
          icon={Factory}
          text={
            demandSurge > 15 
              ? `Surge detected (+${demandSurge}%). Shift up to 1,500 units of ${lowestSellThroughSku?.name || 'slow-moving'} capacity to ${topDemandSku?.name || 'high-demand'} production lines.` 
              : `Maintain standard plant scheduling for ${activeSkus.length} active Puja collection SKUs.`
          }
        />
        <HandoffCard
          title="Procurement Recommendation" 
          badge="Supplier Re-allocation" 
          badgeColor="bg-purple-500/20 text-purple-300" 
          icon={Package}
          text={
            disruptedMillIds.length > 0 
              ? `Auto-trigger emergency POs to remaining operational mills to cover the ${disruptedMillIds.map((id) => activeSuppliers.find((s) => s.id === id)?.name || id).join(' and ')} outage(s).` 
              : `Release standard purchase orders across ${activeSuppliers.length} active regional clusters according to the risk-adjusted plan.`
          }
        />
        <HandoffCard
          title="Risk Alerts" 
          badge={scenario?.stockoutRisk > 10 ? 'Attention Needed' : 'Stable'} 
          badgeColor={scenario?.stockoutRisk > 10 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'} 
          icon={ShieldAlert}
          text={
            scenario?.stockoutRisk > 10 
              ? `Stockout risk at ${scenario.stockoutRisk}% across ${activeSkus.length} SKUs — expedite mill volume allocation immediately.` 
              : `Stockout risk low at ${scenario?.stockoutRisk || 0}%. No critical delay or stockout risks flagged.`
          }
        />
        <HandoffCard
          title="Financial Impact Summary" 
          badge="Net Season Impact" 
          badgeColor="bg-emerald-500/20 text-emerald-300" 
          icon={IndianRupee}
          text={`Projected total season cost: ${formatINR(scenario?.estimatedCost || 0)}. In-season markdown reserve: ${formatINR(scenario?.markdownLoss || 0)}.`}
        />
      </div>
    </div>
  );
}
