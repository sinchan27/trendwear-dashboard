import React from 'react';
import { IndianRupee, Truck, AlertTriangle, TrendingUp, ShieldAlert, Layers, ShoppingBag, Factory } from 'lucide-react';
import { MetricCard, SignalBox } from '../SharedComponents';
import { formatINR } from '../../utils/helpers';

export default function ControlTowerTab({ scenario }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total Season Cost" value={formatINR(scenario.estimatedCost)} subtext="Dynamic scenario estimate" icon={IndianRupee} trend="+4.2%" trendColor="text-yellow-400" />
        <MetricCard title="On-Time Delivery Rate" value={`${scenario.avgOtd}%`} subtext="Weighted across active suppliers" icon={Truck} trend={scenario.avgOtd > 85 ? 'Healthy' : 'Watch'} trendColor={scenario.avgOtd > 85 ? 'text-green-400' : 'text-amber-400'} />
        <MetricCard title="Stockout Risk" value={`${scenario.stockoutRisk}%`} subtext={scenario.stockoutRisk > 10 ? 'Action required' : 'Within tolerance'} icon={AlertTriangle} trend={scenario.stockoutRisk > 10 ? 'High' : 'Low'} trendColor={scenario.stockoutRisk > 10 ? 'text-red-400' : 'text-green-400'} />
        <MetricCard title="Markdown Loss" value={formatINR(scenario.markdownLoss)} subtext="Slow-moving styles this season" icon={TrendingUp} trend="In-season" trendColor="text-blue-400" />
        <MetricCard title="Avg. Supplier Risk" value={`${scenario.avgRiskScore}/100`} subtext="Blended delay & quality risk" icon={ShieldAlert} trend={scenario.avgRiskScore > 30 ? 'Elevated' : 'Normal'} trendColor={scenario.avgRiskScore > 30 ? 'text-orange-400' : 'text-green-400'} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-indigo-400" /> Cross-Functional Signals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <SignalBox title="Merchandising" icon={ShoppingBag} items={['POS sell-through velocity', 'Puja demand curve', 'Markdown history']} color="border-l-blue-500" />
          <SignalBox title="Production" icon={Factory} items={['Plant capacity limits', '4–6 wk fabric lead time', 'Fabric MOQ constraints']} color="border-l-emerald-500" />
          <SignalBox title="Procurement" icon={ShieldAlert} items={['Supplier capacity ratings', 'Quality & OTD history', 'Contract min/max commitment']} color="border-l-purple-500" />
          <SignalBox title="Logistics" icon={Truck} items={['DC → store lead time', 'Peak-season freight rates', 'Regional dispatch load']} color="border-l-cyan-500" />
          <SignalBox title="Market" icon={TrendingUp} items={['Raw cotton & silk price index', 'Competitor festive discounts', 'Regional festive calendar']} color="border-l-amber-500" />
        </div>
      </div>
    </div>
  );
}