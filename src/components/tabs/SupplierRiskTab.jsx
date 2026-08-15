import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, BrainCircuit } from 'lucide-react';
import { SKUS } from '../../data/constants';
import { formatINR } from '../../utils/helpers';

// UPDATED: Receive suppliers and skus state from props
export default function SupplierRiskTab({ riskAdjusted, setRiskAdjusted, disruptedMillIds, suppliers, setSuppliers, skus }) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const atRiskMills = suppliers.filter((s) => disruptedMillIds.includes(s.id) || s.riskScore > 35);
  const atRiskSkuIds = [...new Set(atRiskMills.flatMap((s) => s.affectsSkuIds))];
  const atRiskSkuNames = atRiskSkuIds.map((id) => SKUS.find((sku) => sku.id === id)?.name).filter(Boolean);

  // NEW: Function to trigger the FastAPI Procurement Engine
  const runAIOptimization = async () => {
    setIsOptimizing(true);
    try {
      const totalDemand = skus.reduce((a, s) => a + s.demand, 0);
      const response = await fetch('http://localhost:8000/api/optimize-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suppliers, totalDemand })
      });
      
      const data = await response.json();
      setSuppliers(data.optimized_allocations);
      setRiskAdjusted(true); // Force switch to optimized mode
    } catch (error) {
      console.error("Optimization Engine Failed", error);
    }
    setIsOptimizing(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-200">Layer 2B: Procurement Engine</h3>
          <p className="text-xs text-slate-400">Balancing cost, capacity, lead time, quality and delay risk</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setRiskAdjusted(!riskAdjusted)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${riskAdjusted ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
          >
            <RefreshCw size={14} />
            {riskAdjusted ? 'Showing Optimized View' : 'Showing Standard View'}
          </button>
          
          {/* NEW: The Execution Button */}
          <button
            onClick={runAIOptimization}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
          >
            <BrainCircuit size={14} className={isOptimizing ? "animate-pulse" : ""} />
            {isOptimizing ? 'Running Heuristics...' : 'AI Auto-Allocate'}
          </button>
        </div>
      </div>

      {atRiskSkuNames.length > 0 && (
        <div className="mb-5 p-3 rounded-lg bg-red-950/30 border border-red-500/30 flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div className="text-xs text-red-200">
            <span className="font-semibold">Garments at risk: </span>
            {atRiskSkuNames.join(', ')} — exposed via {atRiskMills.map((m) => m.name).join(', ')}
            {atRiskMills.some((m) => disruptedMillIds.includes(m.id)) ? ' (disrupted)' : ' (elevated delay risk)'}.
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Supplier</th><th className="p-3">Unit Cost</th>
              <th className="p-3">Weekly Cap</th><th className="p-3">OTD %</th>
              <th className="p-3">Risk</th><th className="p-3">Allocated Vol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {suppliers.map((s) => {
              const isDisrupted = disruptedMillIds.includes(s.id);
              // In standard mode, we show what you typed. In optimized mode, we show the backend's calculation.
              const allocated = isDisrupted ? 0 : riskAdjusted ? s.baseAlloc : 0; 
              
              return (
                <tr key={s.id} className={isDisrupted ? 'bg-red-950/20' : 'hover:bg-slate-800/40'}>
                  <td className="p-3 font-medium text-slate-200">
                    {s.name}
                    <div className="text-[10px] text-slate-500 font-normal">{s.region}</div>
                    {isDisrupted && <span className="text-red-400 text-[10px] font-bold block">(DISRUPTED)</span>}
                  </td>
                  <td className="p-3">{formatINR(s.cost)}</td>
                  <td className="p-3">{s.capacity.toLocaleString('en-IN')} units</td>
                  <td className="p-3"><span className={s.otd < 90 ? 'text-amber-400' : 'text-emerald-400'}>{s.otd}%</span></td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.riskScore > 35 ? 'bg-red-500/20 text-red-400' : s.riskScore > 20 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {s.riskScore > 35 ? 'HIGH' : s.riskScore > 20 ? 'MEDIUM' : 'LOW'} ({s.riskScore})
                    </span>
                  </td>
                  <td className="p-3 font-bold text-indigo-400">{allocated.toLocaleString('en-IN')} units</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}