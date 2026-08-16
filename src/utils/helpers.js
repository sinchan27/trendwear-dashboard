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

export function calculateForecastMetrics(actuals, predictions) {
  const pairs = [];
  for (let i = 0; i < actuals.length; i++) {
    const act = actuals[i];
    const pred = predictions[i];
    if (act !== null && act !== undefined && pred !== null && pred !== undefined) {
      pairs.push({ actual: Number(act), predicted: Number(pred) });
    }
  }

  if (pairs.length === 0) {
    return { mae: 0, rmse: 0, mape: 0, wape: 0, bias: 'Balanced', biasPercent: 0, sampleSize: 0 };
  }

  let totalAbsErr = 0;
  let totalSqErr = 0;
  let totalPctErr = 0;
  let nonZeroActuals = 0;
  let totalActual = 0;
  let totalPredicted = 0;

  pairs.forEach(({ actual, predicted }) => {
    const err = predicted - actual;
    totalAbsErr += Math.abs(err);
    totalSqErr += err * err;
    totalActual += actual;
    totalPredicted += predicted;

    if (actual > 0) {
      totalPctErr += Math.abs(err) / actual;
      nonZeroActuals++;
    }
  });

  const n = pairs.length;
  const mae = Math.round((totalAbsErr / n) * 10) / 10;
  const rmse = Math.round(Math.sqrt(totalSqErr / n) * 10) / 10;
  const mape = nonZeroActuals > 0 ? Math.round((totalPctErr / nonZeroActuals) * 1000) / 10 : 0;
  const wape = totalActual > 0 ? Math.round((totalAbsErr / totalActual) * 1000) / 10 : 0;
  
  const netBias = totalPredicted - totalActual;
  const biasPercent = totalActual > 0 ? Math.round((netBias / totalActual) * 1000) / 10 : 0;
  let bias = 'Balanced';
  if (biasPercent > 3) bias = 'Over-forecasting';
  else if (biasPercent < -3) bias = 'Under-forecasting';

  return { mae, rmse, mape, wape, bias, biasPercent, sampleSize: n };
}
