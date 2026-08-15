import React from 'react';
import { ArrowRight, Factory, Package, ShieldAlert, IndianRupee } from 'lucide-react';
import { HandoffCard } from '../SharedComponents';
import { SUPPLIERS } from '../../data/constants';
import { formatINR } from '../../utils/helpers';

export default function ActionCenterTab({ demandSurge, disruptedMillIds, scenario }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <ArrowRight size={18} className="text-emerald-400" /> Decision &amp; Execution Handoff
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HandoffCard
          title="Production Recommendation" badge="Capacity Rebalancing" badgeColor="bg-blue-500/20 text-blue-300" icon={Factory}
          text={demandSurge > 20 ? 'Shift 1,500 units of Anarkali Gown capacity to Tant Saree production.' : 'Maintain standard plant scheduling for current Puja run-up.'}
        />
        <HandoffCard
          title="Procurement Recommendation" badge="Supplier Re-allocation" badgeColor="bg-purple-500/20 text-purple-300" icon={Package}
          text={disruptedMillIds.length > 0 ? `Auto-trigger emergency POs to remaining operational mills to cover the ${disruptedMillIds.map((id) => SUPPLIERS.find((s) => s.id === id)?.name).join(' and ')} outage(s).` : 'Release standard POs according to the risk-adjusted plan.'}
        />
        <HandoffCard
          title="Risk Alerts" badge={scenario.stockoutRisk > 10 ? 'Attention Needed' : 'Stable'} badgeColor={scenario.stockoutRisk > 10 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'} icon={ShieldAlert}
          text={scenario.stockoutRisk > 10 ? `Stockout risk at ${scenario.stockoutRisk}% — expedite volumes to close gap.` : 'No critical delay or stockout risks flagged.'}
        />
        <HandoffCard
          title="Financial Impact Summary" badge="Net Season Impact" badgeColor="bg-emerald-500/20 text-emerald-300" icon={IndianRupee}
          text={`Projected total cost: ${formatINR(scenario.estimatedCost)}. Risk mitigations prevent ${formatINR(320000)} in penalties.`}
        />
      </div>
    </div>
  );
}