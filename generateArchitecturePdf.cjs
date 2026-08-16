const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream('public/ATLAS_Architecture_Overview.pdf'));

function addSection(title) {
  doc.moveDown();
  doc.fontSize(16).fillColor('#1e40af').text(title);
  doc.moveDown(0.5);
}

function addPoint(title, desc) {
  doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text(title);
  doc.font('Helvetica').fontSize(10).fillColor('#475569').text(desc);
  doc.moveDown(1);
}

doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('ATLAS: 1 Stop', { align: 'center' });
doc.fontSize(14).font('Helvetica').fillColor('#64748b').text('System Architecture & Data Flow', { align: 'center' });
doc.moveDown(2);

addSection('1. Frontend Layer (React + Vite + Tailwind)');
addPoint('Component Architecture', 'Modular React architecture with specialized tabs (Planning & Procurement). Uses Tailwind CSS for rapid styling and Recharts for dynamic data visualization.');
addPoint('State Management', 'React Hooks (useState, useEffect) manage local state, mock data injection, and real-time UI updates when simulating scenarios.');

addSection('2. Backend Layer (Express.js Node Server)');
addPoint('API Gateway', 'RESTful API endpoints serving prediction data, handling CSV ingestion, and orchestrating machine learning operations.');
addPoint('Dynamic Gemini Integration', 'Integrates with Google GenAI (@google/genai) to dynamically generate realistic, context-aware 12-week S&OP forecasts on the fly without relying on hardcoded math.');

addSection('3. Machine Learning & Analytics Engine');
addPoint('Forecasting Module', 'Utilizes LLM-driven generative logic (Gemini 2.5 Flash) to predict demand variance, factoring in seasonality and festive spikes.');
addPoint('Validation Engine', 'Computes real-time error metrics (MAPE, RMSE, Bias) by reconciling predicted data points against ground-truth actuals.');

addSection('4. Procurement & Risk Engine');
addPoint('Supplier Risk Scoring', 'Multi-variate algorithm aggregating Geopolitical risk, OTD (On Time Delivery), and Quality scores into a composite vulnerability index.');
addPoint('Cost Optimization', 'Simulates supply chain reallocation, ensuring capacity constraints are met while minimizing logistical overhead.');

doc.end();
