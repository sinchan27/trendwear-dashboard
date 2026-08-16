const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream('public/ATLAS_Technical_Formulas.pdf'));

// Helper for section headers
function addSection(title, ySpacing = 20) {
  doc.moveDown();
  doc.fontSize(16).fillColor('#1e40af').text(title);
  doc.moveDown(0.5);
}

// Helper for formulas
function addFormula(name, purpose, formula) {
  doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text(name);
  doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Purpose: ${purpose}`);
  doc.font('Courier-Bold').fontSize(11).fillColor('#0f172a').text(`Formula: ${formula}`);
  doc.moveDown(1);
}

doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('ATLAS: 1 Stop', { align: 'center' });
doc.fontSize(14).font('Helvetica').fillColor('#64748b').text('Technical Formulas & Mathematical Definitions', { align: 'center' });
doc.moveDown(2);

addSection('1. S&OP Forecast Tracking (ML Validation)');
addFormula('MAPE (Mean Absolute Percentage Error)', 'Measures the average magnitude of forecasting errors in percentage terms.', 'MAPE = (1/n) * Σ |(Actual - Forecast) / Actual| * 100');
addFormula('RMSE (Root Mean Square Error)', 'Penalizes larger errors more heavily; measures absolute fit of the model.', 'RMSE = √[ (1/n) * Σ (Actual - Forecast)² ]');
addFormula('Forecast Bias', 'Determines if the model systematically over-forecasts or under-forecasts.', 'Bias = [ Σ (Forecast - Actual) / Σ Actual ] * 100');

addSection('2. ML Metrics & Confusion Matrix (Classification)');
addFormula('Precision', 'Out of all predicted positive surges (e.g. Durga Puja spikes), how many were actual surges?', 'Precision = True Positives / (True Positives + False Positives)');
addFormula('Recall (Sensitivity)', 'Out of all actual surges, how many did the model successfully capture?', 'Recall = True Positives / (True Positives + False Negatives)');
addFormula('F1 Score', 'The harmonic mean of Precision and Recall; optimal for imbalanced datasets.', 'F1 = 2 * (Precision * Recall) / (Precision + Recall)');

addSection('3. Supplier Risk & Procurement Engine');
addFormula('Composite Risk Score (0-100)', 'Evaluates holistic supplier vulnerability based on weighted performance factors.', 'Risk = (w1 * GeoRisk) + (w2 * (100 - OTD)) + (w3 * (100 - Quality))');
addFormula('Cost Optimization Objective', 'Minimizes re-allocation costs subject to capacity and risk threshold constraints.', 'Min Σ (Cost_i * Quantity_i)  [subject to: Quantity_i ≤ Capacity_i]');

addSection('4. Scenario Simulator (Financial Projections)');
addFormula('Adjusted Demand', 'Calculates new demand under disrupted market conditions.', 'Adjusted Demand = Base Demand * (1 + Market_Impact_Factor)');
addFormula('Revenue Projection', 'Projects total gross revenue across all SKUs.', 'Revenue = Σ (Adjusted Demand_sku * Price_sku)');

addSection('5. Control Tower & Inventory Analytics');
addFormula('Sell-Through Rate (STR)', 'Measures how quickly inventory is converted into sales.', 'STR = (Units Sold / Total Units Received) * 100');
addFormula('Safety Stock Buffer', 'Calculates required buffer to prevent stockouts during lead time variance.', 'Safety Stock = (Max Daily Sales * Max Lead Time) - (Avg Daily Sales * Avg Lead Time)');

doc.end();
