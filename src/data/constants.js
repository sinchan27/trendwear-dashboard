import {
  BarChart3, Factory, Activity, ShieldAlert, Package, Sliders, CheckCircle2, BrainCircuit, Database, LineChart, Award
} from 'lucide-react';
export const SUPPLIERS = [];

export const SKUS = [
  { id: 'TW-101', name: 'Cotton Panjabi (Men\'s Kurta)', demand: 8200, capacity: 8800, safetyStock: 1200, sellThrough: 82, price: 899, markdownRisk: 'Low' },
  { id: 'TW-102', name: 'Tant Cotton Saree', demand: 6100, capacity: 5200, safetyStock: 900, sellThrough: 88, price: 1499, markdownRisk: 'Low' },
  { id: 'TW-103', name: 'Banarasi Silk Saree', demand: 2400, capacity: 1900, safetyStock: 400, sellThrough: 91, price: 4999, markdownRisk: 'Low' },
  { id: 'TW-104', name: 'Anarkali Festive Gown', demand: 3600, capacity: 4200, safetyStock: 600, sellThrough: 38, price: 2299, markdownRisk: 'High' },
  { id: 'TW-105', name: 'Kids Ethnic Set', demand: 4100, capacity: 3800, safetyStock: 700, sellThrough: 55, price: 1199, markdownRisk: 'Medium' },
];

export const PLANNING_TABS = [
  { id: 'datahub', label: 'Layer 1: Data Hub', icon: Database },
  { id: 'tower', label: 'Control Tower', icon: BarChart3 },
  { id: 'planning', label: 'Demand & Supply Planning', icon: Factory },
  { id: 'predict', label: 'Prediction & Simulation', icon: Activity },
  { id: 'ml-metrics', label: 'ML Metrics & Confusion Matrix', icon: Award },
  { id: 'ml-validation', label: 'S&OP Forecast Tracking', icon: LineChart },
];

export const PROCUREMENT_TABS = [
  { id: 'suppliers', label: 'Supplier & Risk', icon: ShieldAlert },
  { id: 'fabric', label: 'Fabric Sourcing Mix', icon: Package },
  { id: 'scenario', label: 'Scenario Simulator', icon: Sliders },
  { id: 'action', label: 'Action Center', icon: CheckCircle2 },
  { id: 'ai-strategy', label: 'AI Risk & Strategy', icon: BrainCircuit },
];

export const WEEK_WEIGHTS = [0.10, 0.13, 0.15, 0.18, 0.20, 0.24];
export const WEEK_LABELS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6 (Puja)'];

export const FABRIC_SUPPLIERS = {
  Cotton: [
    { name: 'Tiruppur Cotton Mills', price: 92, otd: 85, reputation: 78, capacity: 15000 },
    { name: 'Coimbatore Textile Co-op', price: 78, otd: 71, reputation: 65, capacity: 20000 },
    { name: 'Erode Weaving Works', price: 105, otd: 93, reputation: 88, capacity: 9000 },
  ],
  Linen: [
    { name: 'Kolkata Linen House', price: 340, otd: 88, reputation: 82, capacity: 4000 },
    { name: 'Chennai Flax Traders', price: 295, otd: 69, reputation: 60, capacity: 6000 },
    { name: 'Pune Linen Exports', price: 365, otd: 95, reputation: 90, capacity: 3000 },
  ],
  Tasar: [
    { name: 'Bhagalpur Tasar Weavers', price: 780, otd: 90, reputation: 92, capacity: 2200 },
    { name: 'Malda Silk Cluster', price: 690, otd: 74, reputation: 68, capacity: 3000 },
    { name: 'Purulia Tasar Collective', price: 820, otd: 96, reputation: 95, capacity: 1400 },
  ],
  Silk: [
    { name: 'Varanasi Banarasi Weaves', price: 1450, otd: 96, reputation: 97, capacity: 1800 },
    { name: 'Kanchipuram Silk Guild', price: 1680, otd: 91, reputation: 94, capacity: 1200 },
    { name: 'Murshidabad Silk Mills', price: 1250, otd: 68, reputation: 60, capacity: 2500 },
  ],
};

export const FABRIC_DEMAND = { Cotton: 42000, Linen: 9000, Tasar: 4000, Silk: 3200 };
export const OTD_FLOOR = 75;
export const SCORE_WEIGHTS = { price: 0.4, reputation: 0.25, otd: 0.35 };
export const TIER_SPLITS = { 3: [0.55, 0.30, 0.15], 2: [0.65, 0.35], 1: [1] };