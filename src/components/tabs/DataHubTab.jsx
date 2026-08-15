import React, { useState, useRef } from 'react';
import { Database, Plus, UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/helpers';

export default function DataHubTab({ suppliers, setSuppliers, skus, setSkus }) {
  // --- Existing Supplier State ---
  const [newSupplier, setNewSupplier] = useState({
    name: '', region: '', cost: 0, capacity: 0, leadTime: 0, moq: 0, otd: 0, quality: 0, riskScore: 0, fabricType: 'Cotton'
  });

  // --- New CSV Upload State ---
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // --- Existing Supplier Handler ---
  const handleAddSupplier = (e) => {
    e.preventDefault();
    const newId = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
    const supplierToAdd = {
      ...newSupplier,
      id: newId,
      baseAlloc: Math.round(newSupplier.capacity * 0.8), // Mock logic
      affectsSkuIds: ['TW-101'] // Mock mapping for simplicity
    };
    
    setSuppliers([...suppliers, supplierToAdd]);
    setNewSupplier({ name: '', region: '', cost: 0, capacity: 0, leadTime: 0, moq: 0, otd: 0, quality: 0, riskScore: 0, fabricType: 'Cotton' });
  };

  // --- New Drag & Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // --- New Upload & API Handler ---
  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/predict-demand", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process CSV data via FastAPI.");
      }

      const data = await response.json();
      
      // Update the global SKUs state with the AI predictions
      if (setSkus) {
        setSkus(data.predicted_skus);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* --- NEW: Demand Forecasting CSV Upload Zone --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <UploadCloud size={18} className="text-purple-400" />
          <h3 className="text-base font-semibold text-slate-200">Layer 1: AI Demand Forecast (CSV Ingestion)</h3>
        </div>

        <div 
          className="border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-950/50 rounded-lg p-8 text-center transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            {file ? (
              <FileText className="w-10 h-10 text-purple-400" />
            ) : (
              <UploadCloud className="w-10 h-10 text-slate-500" />
            )}
            <span className="text-sm font-medium text-slate-300">
              {file ? file.name : "Drag & Drop historical demand CSV here"}
            </span>
            <span className="text-xs text-slate-500">
              or click to browse from your computer
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-red-400 flex items-center gap-1">
            {error && <><AlertCircle size={14} /> {error}</>}
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className={`text-sm font-medium py-2 px-5 rounded-lg flex justify-center items-center gap-2 transition-all ${
              !file || isLoading 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-md"
            }`}
          >
            {isLoading ? "Running AI Engine..." : "Predict Demand"}
          </button>
        </div>

        {/* Display Forecast Results if SKUs exist */}
        {skus && skus.length > 0 && (
          <div className="mt-6 overflow-x-auto border border-slate-800 rounded-lg">
             <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">SKU ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3 text-purple-400">Predicted Demand</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">Markdown Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {skus.map((sku, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono">{sku.id}</td>
                    <td className="p-3 font-medium text-slate-200">{sku.name}</td>
                    <td className="p-3 font-bold text-purple-400">{sku.demand?.toLocaleString() || '-'}</td>
                    <td className="p-3">{sku.capacity?.toLocaleString() || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        sku.markdownRisk === 'High' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {sku.markdownRisk || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- EXISTING: Layer 1: Live Supplier Data Ingestion --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-blue-400" />
          <h3 className="text-base font-semibold text-slate-200">Layer 1: Live Supplier Data Ingestion</h3>
        </div>
        
        <form onSubmit={handleAddSupplier} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Supplier Name</label>
            <input type="text" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" 
              value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="e.g. Acme Textiles" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Region</label>
            <input type="text" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" 
              value={newSupplier.region} onChange={e => setNewSupplier({...newSupplier, region: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Capacity (Units)</label>
            <input type="number" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" 
              value={newSupplier.capacity || ''} onChange={e => setNewSupplier({...newSupplier, capacity: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Unit Cost (₹)</label>
            <input type="number" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" 
              value={newSupplier.cost || ''} onChange={e => setNewSupplier({...newSupplier, cost: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">OTD (%)</label>
            <input type="number" required max="100" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" 
              value={newSupplier.otd || ''} onChange={e => setNewSupplier({...newSupplier, otd: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Lead Time (Wks)</label>
            <input type="number" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" 
              value={newSupplier.leadTime || ''} onChange={e => setNewSupplier({...newSupplier, leadTime: Number(e.target.value)})} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex justify-center items-center gap-2 transition-all">
              <Plus size={16} /> Inject Data
            </button>
          </div>
        </form>

        {/* Current Active Data Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">ID</th><th className="p-3">Supplier Network</th><th className="p-3">Region</th>
                <th className="p-3">Cost</th><th className="p-3">Capacity</th><th className="p-3">OTD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="p-3">#{s.id}</td>
                  <td className="p-3 font-medium text-slate-200">{s.name}</td>
                  <td className="p-3">{s.region}</td>
                  <td className="p-3">{formatINR(s.cost)}</td>
                  <td className="p-3">{s.capacity.toLocaleString()}</td>
                  <td className="p-3 text-emerald-400">{s.otd}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}