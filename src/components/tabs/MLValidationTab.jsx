import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Save,
  Code2,
  FileSpreadsheet,
  HelpCircle,
  Sliders,
  Check,
  Copy,
} from 'lucide-react';
import { MetricCard } from '../SharedComponents';
import { calculateForecastMetrics } from '../../utils/helpers';
import ClassificationMetricsView from '../ClassificationMetricsView';

export default function MLValidationTab({ skus = [] }) {
  const [selectedSkuId, setSelectedSkuId] = useState(skus[0]?.id || 'TW-101');
  const [timelineData, setTimelineData] = useState([]);
  const [skuMetrics, setSkuMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingActuals, setEditingActuals] = useState({});
  const [savingWeek, setSavingWeek] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeSubView, setActiveSubView] = useState('classification'); // 'classification' | 'operational' | 'offline_sandbox' | 'python_code'

  // Offline Sandbox State
  const [sandboxPred, setSandboxPred] = useState('1450, 1520, 1600, 1750, 1920, 2100');
  const [sandboxAct, setSandboxAct] = useState('1410, 1590, 1540, 1720, 2050, 2200');
  const [sandboxResult, setSandboxResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Fetch SKU validation data from API
  const fetchSkuValidation = async (skuId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/demand-validation/${skuId}`);
      if (res.ok) {
        const data = await res.json();
        setTimelineData(data.timeline || []);
        setSkuMetrics(data.metrics);
        // Initialize editing inputs
        const initialInputs = {};
        (data.timeline || []).forEach((row) => {
          initialInputs[row.target_week] = row.actual_qty !== null ? row.actual_qty : '';
        });
        setEditingActuals(initialInputs);
      }
    } catch (err) {
      console.error('Failed to load validation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSkuId) {
      fetchSkuValidation(selectedSkuId);
    }
  }, [selectedSkuId]);

  // Handle actual sales reconciliation via PUT endpoint
  const handleReconcileActual = async (targetWeek) => {
    setSavingWeek(targetWeek);
    const rawVal = editingActuals[targetWeek];
    const qtyVal = rawVal === '' || rawVal === undefined ? null : Number(rawVal);

    try {
      const res = await fetch(`/api/demand-validation/${selectedSkuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_week: targetWeek,
          actual_qty: qtyVal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTimelineData(data.timeline);
        setSkuMetrics(data.metrics);
        setNotification({
          type: 'success',
          msg: `Reconciled ${targetWeek}: Actual sales updated to ${qtyVal !== null ? `${qtyVal.toLocaleString('en-IN')} units` : 'pending'}`,
        });
        setTimeout(() => setNotification(null), 4000);
      } else {
        const err = await res.json();
        setNotification({ type: 'error', msg: err.error || 'Update failed' });
      }
    } catch (error) {
      setNotification({ type: 'error', msg: 'Network error updating actuals' });
    } finally {
      setSavingWeek(null);
    }
  };

  // Run Offline Sandbox Calculation
  const handleRunSandbox = () => {
    const preds = sandboxPred
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));
    const acts = sandboxAct
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));

    const metrics = calculateForecastMetrics(acts, preds);
    setSandboxResult({
      metrics,
      pairs: preds.map((p, i) => ({
        week: `Wk ${i + 1}`,
        predicted: p,
        actual: acts[i] !== undefined ? acts[i] : null,
      })),
    });
  };

  const handleCopyCode = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const selectedSkuObj = skus.find((s) => s.id === selectedSkuId) || {
    id: selectedSkuId,
    name: 'Selected Garment SKU',
  };

  // Chart data formatting
  const chartData = useMemo(() => {
    return timelineData.map((item) => {
      const err =
        item.actual_qty !== null ? item.predicted_qty - item.actual_qty : null;
      const pctErr =
        item.actual_qty !== null && item.actual_qty > 0
          ? Math.round((Math.abs(err) / item.actual_qty) * 1000) / 10
          : null;

      return {
        week: `Wk ${item.week_number}`,
        targetWeek: item.target_week,
        predicted: item.predicted_qty,
        actual: item.actual_qty,
        error: err,
        pctError: pctErr,
        status: item.actual_qty !== null ? 'Reconciled' : 'Pending',
      };
    });
  }, [timelineData]);

  // Code snippets for Python / SQLAlchemy reference
  const pythonValidationCode = `import numpy as np
from typing import Dict, Sequence, Union

def calculate_offline_forecast_metrics(
    actual_demand: Sequence[Union[int, float]],
    predicted_demand: Sequence[Union[int, float]],
    epsilon: float = 1e-6
) -> Dict[str, float]:
    """
    Calculates offline regression validation metrics for weekly demand forecasts.
    Returns MAE, RMSE, MAPE (%), and WAPE (%).
    """
    y_true = np.asarray(actual_demand, dtype=np.float64)
    y_pred = np.asarray(predicted_demand, dtype=np.float64)

    if y_true.shape != y_pred.shape:
        raise ValueError(f"Shape mismatch: actual {y_true.shape} vs predicted {y_pred.shape}")
    
    if len(y_true) == 0:
        return {"mae": 0.0, "rmse": 0.0, "mape_percent": 0.0, "wape_percent": 0.0}

    errors = y_pred - y_true
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(np.square(errors))))

    # Mask zero actuals to prevent division by zero
    non_zero = y_true != 0
    if np.any(non_zero):
        mape = float(np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100.0)
    else:
        mape = float(np.mean(np.abs((y_true - y_pred) / (y_true + epsilon))) * 100.0)

    total_actual = np.sum(np.abs(y_true))
    wape = float((np.sum(np.abs(errors)) / (total_actual + epsilon)) * 100.0)

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape_percent": round(mape, 2),
        "wape_percent": round(wape, 2)
    }`;

  const sqlalchemyModelCode = `from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class DemandPredictionLog(Base):
    __tablename__ = "demand_prediction_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku_id = Column(String(64), nullable=False, index=True)
    target_week = Column(Date, nullable=False, doc="Start date of target forecast week")
    predicted_qty = Column(Integer, nullable=False, doc="Predicted demand units by ML model")
    actual_qty = Column(Integer, nullable=True, default=None, doc="Actual observed units sold")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("sku_id", "target_week", name="uq_sku_target_week"),
        Index("ix_sku_target_week", "sku_id", "target_week"),
    )`;

  const fastapiEndpointCode = `from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from datetime import date
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/demand-validation", tags=["Demand Validation"])

class ActualSalesUpdateRequest(BaseModel):
    target_week: date = Field(..., description="Target week date (YYYY-MM-DD)")
    actual_qty: int = Field(..., ge=0, description="Observed actual sales quantity")

@router.put("/{sku_id}", status_code=status.HTTP_200_OK)
def update_actual_demand(sku_id: str, payload: ActualSalesUpdateRequest, db: Session = Depends(get_db)):
    record = db.query(DemandPredictionLog).filter(
        DemandPredictionLog.sku_id == sku_id,
        DemandPredictionLog.target_week == payload.target_week
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail=f"No forecast found for SKU {sku_id}")

    record.actual_qty = payload.actual_qty
    db.commit()
    db.refresh(record)
    return {"status": "success", "sku_id": sku_id, "actual_qty": record.actual_qty}`;

  return (
    <div className="space-y-6">
      {/* Sub-view Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-400" size={20} />
            <h2 className="text-lg font-semibold text-slate-100">
              Demand Forecasting ML Model Validation
            </h2>
            <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-medium">
              S&amp;OP Operational Tracking
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile predictions with ground truth actual sales, monitor rolling MAPE/RMSE, and test offline models.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start md:self-auto gap-1">
          <button
            onClick={() => setActiveSubView('classification')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubView === 'classification'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            F1, Precision &amp; Confusion Matrix
          </button>
          <button
            onClick={() => setActiveSubView('operational')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubView === 'operational'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            12-Week Rolling (MAPE &amp; RMSE)
          </button>
          <button
            onClick={() => setActiveSubView('offline_sandbox')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubView === 'offline_sandbox'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Offline Sandbox
          </button>
          <button
            onClick={() => setActiveSubView('python_code')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubView === 'python_code'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Python / FastAPI Specs
          </button>
        </div>
      </div>

      {/* ================= VIEW 0: CLASSIFICATION PERFORMANCE & CONFUSION MATRIX ================= */}
      {activeSubView === 'classification' && <ClassificationMetricsView />}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/70 border-red-800/80 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="text-red-400" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* ================= VIEW 1: OPERATIONAL 12-WEEK TRACKING ================= */}
      {activeSubView === 'operational' && (
        <>
          {/* SKU Selector Ribbon */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-xs font-medium text-slate-400 mr-2 flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-blue-400" /> Target SKU:
            </span>
            {skus.map((sku) => {
              const isSelected = selectedSkuId === sku.id;
              return (
                <button
                  key={sku.id}
                  onClick={() => setSelectedSkuId(sku.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className="font-semibold">{sku.id}</span>
                  <span className="text-slate-300 ml-1.5 hidden sm:inline">({sku.name})</span>
                </button>
              );
            })}
            <button
              onClick={() => fetchSkuValidation(selectedSkuId)}
              disabled={loading}
              title="Refresh validation logs"
              className="ml-auto p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Metric Cards Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <MetricCard
              title="Sample Size"
              value={`${skuMetrics?.sampleSize || 0} / 12`}
              subtext="Reconciled Ground-Truth Weeks"
              icon={CheckCircle2}
              trend={skuMetrics?.sampleSize >= 8 ? 'High Confidence' : 'Building'}
              trendColor="text-blue-400"
            />
            <MetricCard
              title="Rolling MAPE"
              value={skuMetrics ? `${skuMetrics.mape}%` : '--'}
              subtext="Mean Absolute % Error"
              icon={Activity}
              trend={skuMetrics?.mape <= 10 ? 'High Accuracy' : skuMetrics?.mape <= 20 ? 'Acceptable' : 'Underperforming'}
              trendColor={skuMetrics?.mape <= 10 ? 'text-emerald-400' : skuMetrics?.mape <= 20 ? 'text-amber-400' : 'text-red-400'}
            />
            <MetricCard
              title="Rolling RMSE"
              value={skuMetrics ? `${skuMetrics.rmse.toLocaleString('en-IN')}` : '--'}
              subtext="Root Mean Squared Error (Units)"
              icon={TrendingUp}
              trend="Vol. Variance"
              trendColor="text-slate-400"
            />
            <MetricCard
              title="Rolling MAE"
              value={skuMetrics ? `${skuMetrics.mae.toLocaleString('en-IN')}` : '--'}
              subtext="Mean Absolute Error (Units)"
              icon={TrendingDown}
              trend="Avg Gap"
              trendColor="text-slate-400"
            />
            <MetricCard
              title="Forecast Bias"
              value={skuMetrics ? skuMetrics.bias : '--'}
              subtext={`Net Gap: ${skuMetrics?.biasPercent || 0}%`}
              icon={Sliders}
              trend={skuMetrics?.bias === 'Balanced' ? 'Calibrated' : skuMetrics?.bias || 'N/A'}
              trendColor={
                skuMetrics?.bias === 'Balanced'
                  ? 'text-emerald-400'
                  : skuMetrics?.bias === 'Over-forecasting'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }
            />
          </div>

          {/* Dual-Line Visual Chart (Predicted vs Actual Demand) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Activity size={18} className="text-cyan-400" />
                  12-Week Time-Series: Predicted Demand vs. Actual Ground Truth
                </h3>
                <p className="text-xs text-slate-500">
                  Visualizing SKU <span className="text-slate-300 font-semibold">{selectedSkuId}</span> ({selectedSkuObj.name}). Dashed line indicates ML regression forecast, solid line represents reconciled actual sales.
                </p>
              </div>

              {/* Chart Legend Indicators */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400 inline-block"></span>
                  <span className="text-cyan-300 font-medium">Predicted Demand</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-400 rounded inline-block"></span>
                  <span className="text-emerald-300 font-medium">Actual Demand (Reconciled)</span>
                </div>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="week"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                    formatter={(value, name, props) => {
                      if (value === null || value === undefined) return ['Pending Reconcile', name];
                      const units = `${Number(value).toLocaleString('en-IN')} units`;
                      return [units, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  {/* Predicted Demand Line (Dashed Cyan) */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    name="Predicted Demand"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ fill: '#0284c7', r: 4, stroke: '#38bdf8', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#38bdf8' }}
                  />
                  {/* Actual Demand Line (Solid Emerald) */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Demand"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ fill: '#059669', r: 5, stroke: '#34d399', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#34d399' }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Operational Reconciliation Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-indigo-400" />
                  Operational Ground-Truth Reconciliation Table
                </h3>
                <p className="text-xs text-slate-500">
                  Update or input actual observed weekly sales to reconcile forecast performance via FastAPI / Express PUT endpoint.
                </p>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <HelpCircle size={13} className="text-blue-400" />
                <span>Changes immediately update rolling MAPE &amp; RMSE</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-medium">Timeline</th>
                    <th className="p-3 font-medium">Target Week</th>
                    <th className="p-3 font-medium">Predicted Qty</th>
                    <th className="p-3 font-medium">Actual Qty (Input)</th>
                    <th className="p-3 font-medium">Abs Variance</th>
                    <th className="p-3 font-medium">% Error (MAPE)</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {timelineData.map((row) => {
                    const isReconciled = row.actual_qty !== null && row.actual_qty !== undefined;
                    const err = isReconciled ? row.predicted_qty - row.actual_qty : null;
                    const pctErr =
                      isReconciled && row.actual_qty > 0
                        ? Math.round((Math.abs(err) / row.actual_qty) * 1000) / 10
                        : null;
                    const isSaving = savingWeek === row.target_week;

                    return (
                      <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">
                          Week {row.week_number}
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {row.target_week}
                        </td>
                        <td className="p-3 font-medium text-cyan-300">
                          {row.predicted_qty.toLocaleString('en-IN')} units
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            placeholder="Enter actuals..."
                            value={editingActuals[row.target_week] !== undefined ? editingActuals[row.target_week] : ''}
                            onChange={(e) =>
                              setEditingActuals((prev) => ({
                                ...prev,
                                [row.target_week]: e.target.value,
                              }))
                            }
                            className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                          />
                        </td>
                        <td className="p-3 font-medium">
                          {isReconciled ? (
                            <span className={err > 0 ? 'text-amber-400' : err < 0 ? 'text-blue-400' : 'text-emerald-400'}>
                              {err > 0 ? `+${err.toLocaleString('en-IN')}` : err.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-500">--</span>
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          {pctErr !== null ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                pctErr <= 10
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : pctErr <= 20
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {pctErr}%
                            </span>
                          ) : (
                            <span className="text-slate-500">--</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isReconciled ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
                              <CheckCircle2 size={11} /> Reconciled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                              Pending Actuals
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleReconcileActual(row.target_week)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 bg-blue-600/90 hover:bg-blue-600 text-white px-2.5 py-1 rounded text-xs transition-all disabled:opacity-50"
                          >
                            {isSaving ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Save size={12} />
                            )}
                            <span>Save</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= VIEW 2: OFFLINE SANDBOX TESTER ================= */}
      {activeSubView === 'offline_sandbox' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-base font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Sliders size={18} className="text-blue-400" />
              Offline Model Evaluation Sandbox
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Test any time-series regression array offline to evaluate regression errors (MAE, RMSE, MAPE, WAPE, and Directional Bias) before pushing to production.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Predicted Demand Array (y_pred, comma-separated):
                </label>
                <textarea
                  rows={3}
                  value={sandboxPred}
                  onChange={(e) => setSandboxPred(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-cyan-300 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 1200, 1350, 1400, 1580, 1800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Actual Demand Ground Truth Array (y_true, comma-separated):
                </label>
                <textarea
                  rows={3}
                  value={sandboxAct}
                  onChange={(e) => setSandboxAct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 1180, 1400, 1370, 1620, 1750"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-xs text-slate-400">Quick Test Scenarios:</span>
              <button
                onClick={() => {
                  setSandboxPred('1200, 1400, 1600, 1800, 2100, 2400');
                  setSandboxAct('1180, 1390, 1620, 1790, 2080, 2430');
                }}
                className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded text-slate-300"
              >
                High Precision S&amp;OP (MAPE &lt; 2%)
              </button>
              <button
                onClick={() => {
                  setSandboxPred('1000, 1200, 1500, 1800, 2200, 2800');
                  setSandboxAct('850, 1000, 1200, 1400, 1700, 2100');
                }}
                className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded text-slate-300"
              >
                Over-Forecasting Surge (+25% Bias)
              </button>
              <button
                onClick={() => {
                  setSandboxPred('800, 950, 1100, 1300, 1600, 2000');
                  setSandboxAct('950, 1150, 1350, 1600, 2000, 2500');
                }}
                className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded text-slate-300"
              >
                Under-Forecasting Stockout Risk
              </button>
            </div>

            <button
              onClick={handleRunSandbox}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all"
            >
              <Activity size={14} /> Calculate Offline Validation Metrics
            </button>
          </div>

          {/* Sandbox Evaluation Output */}
          {sandboxResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  title="Mean Absolute % Error"
                  value={`${sandboxResult.metrics.mape}%`}
                  subtext="MAPE across all valid pairs"
                  icon={Activity}
                  trend={sandboxResult.metrics.mape <= 10 ? 'High Accuracy' : 'Review Needed'}
                  trendColor={sandboxResult.metrics.mape <= 10 ? 'text-emerald-400' : 'text-amber-400'}
                />
                <MetricCard
                  title="Root Mean Sq Error"
                  value={`${sandboxResult.metrics.rmse}`}
                  subtext="RMSE (Units)"
                  icon={TrendingUp}
                  trend="L2 Penalty"
                  trendColor="text-slate-400"
                />
                <MetricCard
                  title="Mean Absolute Error"
                  value={`${sandboxResult.metrics.mae}`}
                  subtext="MAE (Units)"
                  icon={TrendingDown}
                  trend="L1 Penalty"
                  trendColor="text-slate-400"
                />
                <MetricCard
                  title="Forecast Bias"
                  value={sandboxResult.metrics.bias}
                  subtext={`Net Variance: ${sandboxResult.metrics.biasPercent}%`}
                  icon={Sliders}
                  trend={sandboxResult.metrics.bias}
                  trendColor={sandboxResult.metrics.bias === 'Balanced' ? 'text-emerald-400' : 'text-amber-400'}
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-slate-200 mb-3">
                  Sandbox Regression Curve
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sandboxResult.pairs}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        name="Predicted"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual"
                        stroke="#34d399"
                        strokeWidth={2.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 3: PYTHON & FASTAPI CODE INSPECTOR ================= */}
      {activeSubView === 'python_code' && (
        <div className="space-y-5">
          {/* Section 1: Python Offline Validation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  1. Offline Validation Metric Function (Python / NumPy)
                </h3>
              </div>
              <button
                onClick={() => handleCopyCode('python', pythonValidationCode)}
                className="flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedCode === 'python' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedCode === 'python' ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 text-xs font-mono text-slate-300 overflow-x-auto">
              <code>{pythonValidationCode}</code>
            </pre>
          </div>

          {/* Section 2: SQLAlchemy Database Model */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  2. Operational Tracking Model (SQLAlchemy ORM)
                </h3>
              </div>
              <button
                onClick={() => handleCopyCode('sqlalchemy', sqlalchemyModelCode)}
                className="flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedCode === 'sqlalchemy' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedCode === 'sqlalchemy' ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 text-xs font-mono text-slate-300 overflow-x-auto">
              <code>{sqlalchemyModelCode}</code>
            </pre>
          </div>

          {/* Section 3: FastAPI Update Endpoint */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  3. Reconciliation PUT Endpoint (FastAPI)
                </h3>
              </div>
              <button
                onClick={() => handleCopyCode('fastapi', fastapiEndpointCode)}
                className="flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedCode === 'fastapi' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedCode === 'fastapi' ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 text-xs font-mono text-slate-300 overflow-x-auto">
              <code>{fastapiEndpointCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
