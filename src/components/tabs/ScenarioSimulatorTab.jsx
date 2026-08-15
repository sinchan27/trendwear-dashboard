import React from 'react';
import { Sliders, IndianRupee, AlertTriangle, ShieldAlert } from 'lucide-react';
import { MetricCard } from '../SharedComponents';
import { SUPPLIERS } from '../../data/constants';
import { formatINR } from '../../utils/helpers';

export default function ScenarioSimulatorTab({ demandSurge, setDemandSurge, capacityLoss, setCapacityLoss, disruptedMillIds, toggleMillDisruption, scenario }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
      <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
        <Sliders size={18} className="text-blue-400" /> Interactive What-If Simulator
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Pre-Puja Demand Surge: +{demandSurge}%</label>
          <input type="range" min="0" max="60" value={demandSurge} onChange={(e) => setDemandSurge(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
          <p className="text-[11px] text-slate-500 mt-1">Simulate the last-fortnight festive rush on ethnic wear</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Plant Capacity Loss: -{capacityLoss}%</label>
          <input type="range" min="0" max="40" value={capacityLoss} onChange={(e) => setCapacityLoss(Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer" />
          <p className="text-[11px] text-slate-500 mt-1">Simulate monsoon downtime or a production bottleneck</p>
        </div>
      </div>

      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
        <label className="text-xs font-semibold text-slate-300 block mb-3">Simulate Mill Disruption</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SUPPLIERS.map((s) => {
            const isOn = disruptedMillIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleMillDisruption(s.id)}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${isOn ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'}`}
              >
                <div>{s.name}</div>
                <div className="text-[10px] font-normal opacity-80">{s.region}</div>
                <div className="text-[10px] font-normal mt-1">{isOn ? 'OFFLINE' : 'Operating'}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Recalculated Cost" value={formatINR(scenario.estimatedCost)} subtext="Under current scenario" icon={IndianRupee} trend="Live" trendColor="text-blue-400" />
        <MetricCard title="Stockout Risk" value={`${scenario.stockoutRisk}%`} subtext="Under current scenario" icon={AlertTriangle} trend={scenario.stockoutRisk > 10 ? 'High' : 'Low'} trendColor={scenario.stockoutRisk > 10 ? 'text-red-400' : 'text-green-400'} />
        <MetricCard title="Avg. Supplier Risk" value={`${scenario.avgRiskScore}/100`} subtext="Under current scenario" icon={ShieldAlert} trend={scenario.avgRiskScore > 30 ? 'Elevated' : 'Normal'} trendColor={scenario.avgRiskScore > 30 ? 'text-orange-400' : 'text-green-400'} />
      </div>
    </div>
  );
}