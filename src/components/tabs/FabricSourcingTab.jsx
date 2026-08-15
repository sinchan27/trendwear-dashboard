import React from 'react';
import { Truck, IndianRupee, ShieldAlert } from 'lucide-react';
import { MetricCard } from '../SharedComponents';
import { formatINR } from '../../utils/helpers';
import { OTD_FLOOR } from '../../data/constants';

export default function FabricSourcingTab({ fabricSourcing }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Blended Fabric OTD" value={`${fabricSourcing.blendedOtdOverall}%`} subtext="Demand-weighted across all fabrics" icon={Truck} trend={fabricSourcing.blendedOtdOverall >= 85 ? 'Stable' : 'Watch'} trendColor={fabricSourcing.blendedOtdOverall >= 85 ? 'text-green-400' : 'text-amber-400'} />
        <MetricCard title="Total Fabric Spend" value={formatINR(fabricSourcing.grandTotalCost)} subtext="Cotton, Linen, Tasar & Silk combined" icon={IndianRupee} trend="Recommended mix" trendColor="text-blue-400" />
        <MetricCard title="OTD Floor Applied" value={`${OTD_FLOOR}%`} subtext="Suppliers below this are excluded" icon={ShieldAlert} trend="Hard constraint" trendColor="text-slate-300" />
      </div>

      {fabricSourcing.results.map((r) => (
        <div key={r.fabric} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-200">{r.fabric}</h3>
              <p className="text-xs text-slate-500">{r.demand.toLocaleString('en-IN')} m required · Blended OTD {r.blendedOtd}% · {formatINR(r.totalCost)} total</p>
            </div>
            {!r.floorMet && <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 w-fit">No supplier cleared floor</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr><th className="p-3">Supplier</th><th className="p-3">Price / m</th><th className="p-3">OTD %</th><th className="p-3">Order Split</th><th className="p-3">Cost</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {r.allocation.map((s) => (
                  <tr key={s.name} className="hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-slate-200">{s.name}</td>
                    <td className="p-3">{formatINR(s.price)}</td>
                    <td className="p-3"><span className={s.otd < 85 ? 'text-amber-400' : 'text-emerald-400'}>{s.otd}%</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${s.pct * 100}%` }} />
                        </div>
                        <span className="text-slate-400">{Math.round(s.pct * 100)}%</span>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-blue-400">{formatINR(s.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}