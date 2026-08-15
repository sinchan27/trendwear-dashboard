import React from 'react';
import { Flame, AlertTriangle, Package, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from '../SharedComponents';
import { heatColor } from '../../utils/helpers';
import { WEEK_LABELS } from '../../data/constants';

export default function PredictionSimulationTab({ weeklySim, millSim, demandSurge, capacityLoss, disruptedMillIds }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Peak Weekly Risk" value={`${weeklySim.peakRisk}%`} subtext="Highest single SKU/week gap" icon={Flame} trend={weeklySim.peakRisk > 30 ? 'Critical' : 'Manageable'} trendColor={weeklySim.peakRisk > 30 ? 'text-red-400' : 'text-green-400'} />
        <MetricCard title="Weeks in Deficit" value={`${weeklySim.weeksInDeficit} / 6`} subtext="Weeks demand exceeds supply" icon={AlertTriangle} trend={weeklySim.weeksInDeficit > 2 ? 'High' : 'Low'} trendColor={weeklySim.weeksInDeficit > 2 ? 'text-red-400' : 'text-green-400'} />
        <MetricCard title="Projected Season Units" value={weeklySim.totals.reduce((a, t) => a + t.demand, 0).toLocaleString('en-IN')} subtext="Total demand, 6-week run-up" icon={Package} trend="Forecast" trendColor="text-blue-400" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-1 flex items-center gap-2">
          <Activity size={18} className="text-blue-400" /> Demand vs. Supply Simulation
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Live projection across the 6-week run-up — reacts to controls (surge +{demandSurge}%, capacity -{capacityLoss}%{disruptedMillIds.length > 0 ? `, ${disruptedMillIds.length} mill(s) disrupted` : ''}).
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklySim.totals} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="capacityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#e2e8f0' }} formatter={(value) => `${value.toLocaleString('en-IN')} units`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="capacity" name="Supply / Capacity" stroke="#34d399" fill="url(#capacityFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="demand" name="Predicted Demand" stroke="#60a5fa" fill="url(#demandFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-1 flex items-center gap-2">
          <Flame size={18} className="text-orange-400" /> Stockout Risk Heat Map
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 border-separate" style={{ borderSpacing: '4px' }}>
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-400 font-medium">Style</th>
                {WEEK_LABELS.map((w) => <th key={w} className="p-2 text-center text-slate-400 font-medium whitespace-nowrap">{w}</th>)}
              </tr>
            </thead>
            <tbody>
              {weeklySim.heatmap.map((row) => (
                <tr key={row.id}>
                  <td className="p-2 text-slate-300 font-medium whitespace-nowrap">{row.name}</td>
                  {row.weeks.map((w, i) => (
                    <td key={i} className="p-0">
                      <div className={`rounded-md py-2.5 text-center font-bold ${heatColor(w.risk)}`}>{w.risk}%</div>
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