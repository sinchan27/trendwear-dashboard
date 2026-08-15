import React, { useState } from 'react';
import { BrainCircuit, AlertTriangle, Layers, Send } from 'lucide-react';
import { MetricCard } from '../SharedComponents';

export default function AIRiskStrategyTab() {
  const [formData, setFormData] = useState({ supplierName: '', leadTime: 5, otdPercent: 85, costPerUnit: 450 });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Point this to your local FastAPI server
      const response = await fetch('http://localhost:8000/api/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch AI analysis", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Manual Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-indigo-400" /> Manual Data Input
        </h3>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Supplier/Vendor Name</label>
            <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" 
              value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Lead Time (Weeks)</label>
            <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" 
              value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: Number(e.target.value)})} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">On-Time Delivery (OTD %)</label>
            <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" 
              value={formData.otdPercent} onChange={e => setFormData({...formData, otdPercent: Number(e.target.value)})} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Unit Cost (₹)</label>
            <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" 
              value={formData.costPerUnit} onChange={e => setFormData({...formData, costPerUnit: Number(e.target.value)})} required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50">
            {isLoading ? <BrainCircuit className="animate-pulse" size={16} /> : <Send size={16} />}
            {isLoading ? 'Running SVM Pipeline...' : 'Run Strategic Analysis'}
          </button>
        </form>
      </div>

      {/* AI Output Section */}
      <div className="lg:col-span-2 space-y-6">
        {results ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard title="SVM Risk Classification" value={results.risk_level} subtext={`Confidence: ${results.confidence}%`} icon={AlertTriangle} trend="Predicted" trendColor={results.risk_level === 'High' ? 'text-red-400' : 'text-emerald-400'} />
              <MetricCard title="Predicted Delay" value={`${results.predicted_delay_days} Days`} subtext="Based on current OTD & Lead Time" icon={Layers} trend="Estimated" trendColor="text-blue-400" />
            </div>
            
            {/* Generative AI SWOT Analysis */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <BrainCircuit size={18} className="text-amber-400" /> Strategic SWOT Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg">
                  <h4 className="text-emerald-400 font-bold text-sm mb-2">Strengths</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{results.swot.strengths}</p>
                </div>
                <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-lg">
                  <h4 className="text-red-400 font-bold text-sm mb-2">Weaknesses</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{results.swot.weaknesses}</p>
                </div>
                <div className="bg-blue-950/20 border border-blue-900/50 p-4 rounded-lg">
                  <h4 className="text-blue-400 font-bold text-sm mb-2">Opportunities</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{results.swot.opportunities}</p>
                </div>
                <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-lg">
                  <h4 className="text-amber-400 font-bold text-sm mb-2">Threats</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{results.swot.threats}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-slate-500 h-full">
            <BrainCircuit size={48} className="mb-4 opacity-50" />
            <p className="text-sm">Input supplier data to generate an SVM risk classification and automated SWOT analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}