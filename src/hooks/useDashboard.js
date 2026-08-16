import { useState, useMemo } from 'react';
import {
  SKUS as INITIAL_SKUS, SUPPLIERS as INITIAL_SUPPLIERS, WEEK_WEIGHTS, WEEK_LABELS,
  FABRIC_SUPPLIERS, OTD_FLOOR, SCORE_WEIGHTS, TIER_SPLITS
} from '../data/constants';

export default function useDashboard() {
  const [activeTab, setActiveTab] = useState('datahub');
  
  // LAYER 1: Dynamic Master Data State
  // Initialized to empty array so no hardcoded data is displayed before ingestion
  const [skus, setSkus] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isForecastIngested, setIsForecastIngested] = useState(false);
  const [ingestedFileName, setIngestedFileName] = useState('');

  const resetForecast = () => {
    setSkus([]);
    setIsForecastIngested(false);
    setIngestedFileName('');
  };

  const loadSampleDataset = () => {
    setSkus(INITIAL_SKUS);
    setIsForecastIngested(true);
    setIngestedFileName('sample_trendwear_sop_data.csv');
  };

  const [riskAdjusted, setRiskAdjusted] = useState(true);
  const [demandSurge, setDemandSurge] = useState(0);
  const [disruptedMillIds, setDisruptedMillIds] = useState([]);
  const [capacityLoss, setCapacityLoss] = useState(0);

  const toggleMillDisruption = (id) =>
    setDisruptedMillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const scenario = useMemo(() => {
    if (!skus || skus.length === 0) {
      const activeSuppliers = suppliers.filter((s) => !disruptedMillIds.includes(s.id));
      const avgRiskScore = Math.round(
        activeSuppliers.length > 0
          ? activeSuppliers.reduce((a, s) => a + s.riskScore, 0) / activeSuppliers.length
          : 0
      );
      const avgOtd = Math.round(
        activeSuppliers.length > 0
          ? activeSuppliers.reduce((a, s) => a + s.otd, 0) / activeSuppliers.length
          : 0
      );
      return {
        totalDemand: 0,
        totalCapacity: 0,
        totalUnits: 0,
        totalCapacityUnits: 0,
        totalRevenue: 0,
        totalSupplierCap: 0,
        stockoutRisk: 0,
        avgRiskScore,
        avgOtd,
        estimatedCost: 0,
        markdownLoss: 0,
        lostCapShare: 0,
      };
    }

    const totalDemand = skus.reduce((a, s) => a + (Number(s.demand) || 0), 0) * (1 + demandSurge / 100);
    const totalCapacity = skus.reduce((a, s) => a + (Number(s.capacity) || 0), 0) * (1 - capacityLoss / 100);

    const totalUnits = skus.reduce((a, s) => a + (Number(s.demand) || 0), 0);
    const totalCapacityUnits = skus.reduce((a, s) => a + (Number(s.capacity) || 0), 0);
    const totalRevenue = skus.reduce((a, s) => a + (Number(s.demand) || 0) * (Number(s.price) || 2000), 0) * (1 + demandSurge / 100);

    const activeSuppliers = suppliers.filter((s) => !disruptedMillIds.includes(s.id));
    const totalSupplierCap = activeSuppliers.reduce((a, s) => a + s.capacity, 0);
    const allSupplierCap = suppliers.reduce((a, s) => a + s.capacity, 0);
    const lostCapShare = allSupplierCap > 0 ? 1 - totalSupplierCap / allSupplierCap : 0;

    const stockoutRisk = totalDemand > 0 ? Math.max(0, Math.round(((totalDemand - totalCapacity) / totalDemand) * 100)) : 0;
    const avgRiskScore = Math.round(
      (activeSuppliers.length > 0
        ? activeSuppliers.reduce((a, s) => a + s.riskScore, 0) / activeSuppliers.length
        : 100) + lostCapShare * 45
    );
    const avgOtd = Math.round(
      (activeSuppliers.length > 0
        ? activeSuppliers.reduce((a, s) => a + s.otd, 0) / activeSuppliers.length
        : 0) - lostCapShare * 20
    );

    // Dynamic S&OP manufacturing cost based on SKU prices and supplier allocation
    const estimatedCost = Math.round(
      skus.reduce((a, s) => a + (Number(s.demand) || 0) * ((Number(s.price) || 2000) * 0.42), 0) * 
      (1 + demandSurge / 100) * 
      (1 + lostCapShare * 0.3)
    );

    // Dynamic markdown risk value: 25% discount exposure on low sell-through inventory
    const markdownLoss = Math.round(
      skus
        .filter((s) => Number(s.sellThrough || 0) < 60)
        .reduce((a, s) => a + (Number(s.demand) || 0) * (Number(s.price) || 2000) * 0.25, 0)
    );

    return { 
      totalDemand, 
      totalCapacity, 
      totalUnits, 
      totalCapacityUnits, 
      totalRevenue, 
      totalSupplierCap, 
      stockoutRisk, 
      avgRiskScore, 
      avgOtd, 
      estimatedCost, 
      markdownLoss, 
      lostCapShare 
    };
  }, [demandSurge, disruptedMillIds, capacityLoss, skus, suppliers]);

  const weeklySim = useMemo(() => {
    if (!skus || skus.length === 0) {
      return { heatmap: [], totals: WEEK_LABELS.map(label => ({ week: label, demand: 0, capacity: 0 })), peakRisk: 0, weeksInDeficit: 0 };
    }

    const allSupplierCap = suppliers.reduce((a, s) => a + s.capacity, 0);
    const activeCap = suppliers.filter((s) => !disruptedMillIds.includes(s.id)).reduce((a, s) => a + s.capacity, 0);
    const lostCapShare = allSupplierCap > 0 ? 1 - activeCap / allSupplierCap : 0;

    const heatmap = skus.map((sku) => {
      const weeks = WEEK_WEIGHTS.map((weight, i) => {
        const weeklyDemand = Math.round((Number(sku.demand) || 0) * (1 + demandSurge / 100) * weight);
        let weeklyCapacity = ((Number(sku.capacity) || 0) * (1 - capacityLoss / 100)) / 6;
        if (lostCapShare > 0 && i >= 2) weeklyCapacity *= 1 - lostCapShare * 0.8;
        weeklyCapacity = Math.round(weeklyCapacity);
        const risk = weeklyDemand > 0 ? Math.max(0, Math.round(((weeklyDemand - weeklyCapacity) / weeklyDemand) * 100)) : 0;
        return { label: WEEK_LABELS[i], demand: weeklyDemand, capacity: weeklyCapacity, risk };
      });
      return { id: sku.id, name: sku.name, weeks };
    });

    const totals = WEEK_LABELS.map((label, i) => {
      const demand = heatmap.reduce((a, row) => a + row.weeks[i].demand, 0);
      const capacity = heatmap.reduce((a, row) => a + row.weeks[i].capacity, 0);
      return { week: label, demand, capacity };
    });

    const peakRisk = heatmap.length > 0 ? Math.max(...heatmap.flatMap((row) => row.weeks.map((w) => w.risk))) : 0;
    const weeksInDeficit = totals.filter((t) => t.demand > t.capacity).length;

    return { heatmap, totals, peakRisk, weeksInDeficit };
  }, [demandSurge, disruptedMillIds, capacityLoss, skus, suppliers]);

  const millSim = useMemo(() => {
    const heatmap = suppliers.map((s) => {
      const isDisrupted = disruptedMillIds.includes(s.id);
      const totalAlloc = isDisrupted
        ? 0
        : riskAdjusted 
            ? (s.optimizedAlloc !== undefined ? s.optimizedAlloc : (s.riskScore < 30 ? s.baseAlloc + 1000 : s.baseAlloc - 500)) 
            : (s.baseAlloc || 0);

      const weeks = WEEK_WEIGHTS.map((weight, i) => {
        const weeklyAllocated = Math.round(totalAlloc * (1 + demandSurge / 100) * weight);
        const weeklyCapacity = isDisrupted ? 0 : s.capacity;
        const capacityGapRisk = weeklyAllocated > 0 ? Math.max(0, Math.round(((weeklyAllocated - weeklyCapacity) / weeklyAllocated) * 100)) : 0;
        const risk = isDisrupted ? 100 : Math.min(100, Math.round(0.6 * capacityGapRisk + 0.4 * s.riskScore));
        return { label: WEEK_LABELS[i], allocated: weeklyAllocated, capacity: weeklyCapacity, risk, offline: isDisrupted };
      });
      return { id: s.id, name: s.name, region: s.region, weeks };
    });

    const totals = WEEK_LABELS.map((label, i) => {
      const allocated = heatmap.reduce((a, row) => a + row.weeks[i].allocated, 0);
      const capacity = heatmap.reduce((a, row) => a + row.weeks[i].capacity, 0);
      return { week: label, allocated, capacity };
    });

    return { heatmap, totals };
  }, [demandSurge, disruptedMillIds, riskAdjusted, suppliers]);

  const fabricSourcing = useMemo(() => {
    const totalSeasonDemand = skus.reduce((a, s) => a + (Number(s.demand) || 0), 0);
    const fabricMultipliers = {
      'Handloom Cotton': 0.38 * 2.2, // ~38% of collection in handloom cotton, 2.2m per garment
      'Linen Blend': 0.22 * 1.8,     // ~22% in linen blends, 1.8m per garment
      'Tasar & Matka Silk': 0.20 * 2.0, // ~20% in tasar silk, 2.0m per garment
      'Murshidabad Pure Silk': 0.20 * 2.5, // ~20% in pure silk sarees, 2.5m per garment
    };

    const results = Object.entries(FABRIC_SUPPLIERS).map(([fabric, suppliersList]) => {
      const qualifying = suppliersList.filter((s) => s.otd >= OTD_FLOOR);
      const pool = qualifying.length > 0 ? qualifying : suppliersList;
      const floorMet = qualifying.length > 0;

      const minPrice = Math.min(...pool.map((s) => s.price));
      const scored = pool.map((s) => ({
        ...s,
        score: (minPrice / s.price) * SCORE_WEIGHTS.price + (s.reputation / 100) * SCORE_WEIGHTS.reputation + (s.otd / 100) * SCORE_WEIGHTS.otd,
      })).sort((a, b) => b.score - a.score);

      const splits = TIER_SPLITS[scored.length] || TIER_SPLITS[1];
      const demandMultiplier = fabricMultipliers[fabric] || 0.8;
      const demand = Math.round(totalSeasonDemand * demandMultiplier);

      const allocation = scored.map((s, i) => {
        const pct = splits[i];
        const meters = Math.round(demand * pct);
        return { ...s, pct, meters, cost: Math.round(meters * s.price) };
      });

      const blendedOtd = Math.round(allocation.reduce((a, s) => a + s.pct * s.otd, 0));
      const totalCost = allocation.reduce((a, s) => a + s.cost, 0);
      const excluded = suppliersList.filter((s) => !pool.includes(s));

      return { fabric, allocation, blendedOtd, totalCost, demand, floorMet, excluded };
    });

    const grandTotalCost = results.reduce((a, r) => a + r.totalCost, 0);
    const grandTotalDemand = results.reduce((a, r) => a + r.demand, 0);
    const blendedOtdOverall = grandTotalDemand > 0 ? Math.round(results.reduce((a, r) => a + r.blendedOtd * (r.demand / grandTotalDemand), 0)) : 0;

    return { results, grandTotalCost, grandTotalDemand, blendedOtdOverall };
  }, [skus]);

  return {
    activeTab, setActiveTab,
    skus, setSkus,
    suppliers, setSuppliers,
    isForecastIngested, setIsForecastIngested,
    ingestedFileName, setIngestedFileName,
    resetForecast,
    loadSampleDataset,
    riskAdjusted, setRiskAdjusted,
    demandSurge, setDemandSurge,
    disruptedMillIds, toggleMillDisruption,
    capacityLoss, setCapacityLoss,
    scenario, weeklySim, millSim, fabricSourcing
  };
}
