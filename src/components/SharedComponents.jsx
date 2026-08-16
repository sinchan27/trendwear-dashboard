import React from 'react';
import { UploadCloud } from 'lucide-react';

export function MetricCard({ title, value, subtext, icon: Icon, trend, trendColor }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
      <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
        <span>{title}</span>
        {Icon && <Icon size={16} className="text-slate-500" />}
      </div>
      <div className="text-2xl font-extrabold text-slate-100">{value}</div>
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-slate-500">{subtext}</span>
        <span className={`font-semibold ${trendColor}`}>{trend}</span>
      </div>
    </div>
  );
}

export function SignalBox({ title, items, color, icon: Icon }) {
  return (
    <div className={`p-3 bg-slate-950/60 rounded-lg border-l-2 ${color} border-slate-800/80`}>
      <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-slate-500" />}
        {title}
      </h4>
      <ul className="space-y-1 text-slate-400 list-disc list-inside">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function HandoffCard({ title, badge, badgeColor, text, icon: Icon }) {
  return (
    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-1.5">
          {Icon && <Icon size={14} className="text-slate-500" />}
          {title}
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
    </div>
  );
}

export function NoDataEmptyState({ onNavigateDataHub, title = "No Forecast Dataset Ingested Yet" }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto my-6 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
        <UploadCloud size={32} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          This analytics tab requires an ingested Demand Forecast CSV. Upload a historical CSV or download the test template in <strong>Layer 1: Data Hub</strong> to run live predictions and populate all S&OP views.
        </p>
      </div>
      {onNavigateDataHub && (
        <div className="pt-2">
          <button
            onClick={onNavigateDataHub}
            type="button"
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-md"
          >
            <UploadCloud size={15} />
            <span>Go to Layer 1: Data Hub & Upload CSV</span>
          </button>
        </div>
      )}
    </div>
  );
}
