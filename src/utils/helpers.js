export function heatColor(risk) {
  if (risk <= 5) return 'bg-emerald-500/70 text-emerald-50';
  if (risk <= 15) return 'bg-emerald-500/30 text-emerald-200';
  if (risk <= 30) return 'bg-amber-500/50 text-amber-50';
  if (risk <= 50) return 'bg-orange-500/60 text-orange-50';
  return 'bg-red-500/75 text-red-50';
}
  
export function formatINR(value) {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}