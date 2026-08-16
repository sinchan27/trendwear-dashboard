import React from 'react';
import { Sparkles } from 'lucide-react';
import { NoDataEmptyState } from '../SharedComponents';

export default function PredictionSimulationTab({ 
  weeklySim, 
  millSim, 
  demandSurge, 
  capacityLoss, 
  disruptedMillIds,
  isForecastIngested = false,
  onNavigateDataHub
}) {
  if (!isForecastIngested || !weeklySim || weeklySim.heatmap.length === 0) {
    return (
      <NoDataEmptyState 
        title="No Forecast Prediction Simulation Available" 
        onNavigateDataHub={onNavigateDataHub} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 6-Week Heatmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center justify-between">
          <span>6-Week Demand vs. Production Ramp-Up (Durga Puja Campaign)</span>
          <span className="text-xs text-slate-400 font-normal">Peak surge week: W4–W5 (Panchami / Sasthi)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 text-left">SKU Name</th>
                {weeklySim.totals.map((t) => (
                  <th key={t.week} className="p-3 text-center">{t.week}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {weeklySim.heatmap.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-medium text-slate-200">{row.name}</td>
                  {row.weeks.map((w, idx) => (
                    <td key={idx} className="p-3 text-center">
                      <div className={`p-2 rounded font-semibold text-[11px] ${
                        w.risk > 40
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : w.risk > 15
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        <div>{w.demand.toLocaleString('en-IN')} d</div>
                        <div className="text-[10px] opacity-75">{w.capacity.toLocaleString('en-IN')} c</div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
