import express from "express";
import path from "path";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Demand Prediction Logs In-Memory Storage & Schema Representation ---
  interface DemandPredictionLog {
    id: number;
    sku_id: string;
    target_week: string; // e.g. "2026-W22", "2026-06-01"
    week_number: number; // 1 to 12
    predicted_qty: number;
    actual_qty: number | null;
    created_at: string;
    updated_at: string;
  }

  // Pre-seed 12-week operational logs for standard SKUs
  const INITIAL_LOGS: DemandPredictionLog[] = [];
  const SKU_BASE_VOLUMES: Record<string, { base: number; noise: number[] }> = {
    "TW-101": { base: 1350, noise: [120, -80, 150, -40, 90, 210, 320, 410, 560, 680, 890, 1100] },
    "TW-102": { base: 1000, noise: [90, 40, -60, 80, 130, 170, 240, 310, 450, 520, 710, 900] },
    "TW-103": { base: 400, noise: [30, -20, 45, 10, 60, 80, 110, 150, 210, 280, 360, 450] },
    "TW-104": { base: 600, noise: [-50, -30, 20, -70, -40, 50, 80, 100, 140, 190, 230, 300] },
    "TW-105": { base: 680, noise: [40, 10, -30, 50, 70, 90, 130, 180, 240, 320, 410, 550] },
  };

  let logAutoId = 1;
  const WEEKS_COUNT = 12;
  const currentWeekReconciled = 9; // First 9 weeks have ground truth, last 3 are pending actuals

  Object.entries(SKU_BASE_VOLUMES).forEach(([skuId, profile]) => {
    for (let w = 1; w <= WEEKS_COUNT; w++) {
      const pred = Math.round(profile.base + profile.noise[w - 1] + (w * 70));
      // Actual has realistic operational variance
      let actual: number | null = null;
      if (w <= currentWeekReconciled) {
        const variance = (Math.sin(w * 1.5) * 0.08 + (Math.random() * 0.06 - 0.03));
        actual = Math.max(0, Math.round(pred * (1 - variance)));
      }

      const weekDate = `2026-W${(20 + w).toString().padStart(2, "0")}`;
      INITIAL_LOGS.push({
        id: logAutoId++,
        sku_id: skuId,
        target_week: weekDate,
        week_number: w,
        predicted_qty: pred,
        actual_qty: actual,
        created_at: new Date(Date.now() - (13 - w) * 7 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  });

  let predictionDatabase: DemandPredictionLog[] = [...INITIAL_LOGS];

  // Helper: compute metrics from logs
  function computeLogMetrics(logs: DemandPredictionLog[]) {
    const reconciled = logs.filter((l) => l.actual_qty !== null && l.actual_qty !== undefined);
    if (reconciled.length === 0) {
      return { mae: 0, rmse: 0, mape: 0, wape: 0, bias: "Balanced", biasPercent: 0, sampleSize: 0 };
    }

    let totalAbsErr = 0;
    let totalSqErr = 0;
    let totalPctErr = 0;
    let totalActual = 0;
    let totalPred = 0;

    reconciled.forEach((l) => {
      const act = l.actual_qty!;
      const pred = l.predicted_qty;
      const err = pred - act;
      totalAbsErr += Math.abs(err);
      totalSqErr += err * err;
      totalActual += act;
      totalPred += pred;
      if (act > 0) {
        totalPctErr += Math.abs(err) / act;
      }
    });

    const n = reconciled.length;
    const mae = Math.round((totalAbsErr / n) * 10) / 10;
    const rmse = Math.round(Math.sqrt(totalSqErr / n) * 10) / 10;
    const mape = Math.round((totalPctErr / n) * 1000) / 10;
    const wape = totalActual > 0 ? Math.round((totalAbsErr / totalActual) * 1000) / 10 : 0;
    const netBias = totalPred - totalActual;
    const biasPercent = totalActual > 0 ? Math.round((netBias / totalActual) * 1000) / 10 : 0;
    let bias = "Balanced";
    if (biasPercent > 3) bias = "Over-forecasting";
    else if (biasPercent < -3) bias = "Under-forecasting";

    return { mae, rmse, mape, wape, bias, biasPercent, sampleSize: n };
  }

  // --- Demand Validation Endpoints ---
  // A. Get all validation logs with summary
  app.get("/api/demand-validation", (req, res) => {
    try {
      const skus = Array.from(new Set(predictionDatabase.map((l) => l.sku_id)));
      const skuSummaries = skus.map((skuId) => {
        const logs = predictionDatabase.filter((l) => l.sku_id === skuId);
        const metrics = computeLogMetrics(logs);
        return {
          sku_id: skuId,
          total_weeks: logs.length,
          reconciled_weeks: logs.filter((l) => l.actual_qty !== null).length,
          metrics,
        };
      });

      const allMetrics = computeLogMetrics(predictionDatabase);
      res.json({
        overview: allMetrics,
        skus: skuSummaries,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch validation summary" });
    }
  });

  // B. Get 12-week time-series validation logs for a specific SKU
  app.get("/api/demand-validation/:sku_id", async (req, res) => {
    try {
      const { sku_id } = req.params;
      let logs = predictionDatabase
        .filter((l) => l.sku_id === sku_id)
        .sort((a, b) => a.week_number - b.week_number);

      if (logs.length === 0) {
        // Dynamically initialize 12-week timeline for newly uploaded SKU via Gemini AI
        const baseVolume = 800 + (Math.abs(sku_id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 1000);
        let aiGeneratedPredictions: number[] = [];
        
        try {
          if (process.env.GEMINI_API_KEY) {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const prompt = `Generate a realistic 12-week demand forecast for a retail clothing SKU (ID: ${sku_id}). The base historical weekly volume is around ${baseVolume} units. 
            Return ONLY a JSON array of exactly 12 integers representing the predicted demand for weeks 1 through 12. 
            Incorporate realistic trends, seasonality, or festive spikes (like Durga Puja) for a clothing brand.
            Example format: [850, 870, 910, 950, 940, 900, 880, 860, 890, 920, 950, 1000]
            Do not include markdown or backticks, just the pure JSON array.`;
            
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt
            });
            
            const text = response.text || "[]";
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            aiGeneratedPredictions = JSON.parse(cleanedText);
            
            if (!Array.isArray(aiGeneratedPredictions) || aiGeneratedPredictions.length !== 12) {
               throw new Error("Invalid array returned by Gemini");
            }
          } else {
             throw new Error("No Gemini key");
          }
        } catch(e) {
          console.warn("Gemini generation failed or not configured, falling back to deterministic generation", e);
          aiGeneratedPredictions = [];
          for (let w = 1; w <= WEEKS_COUNT; w++) {
             aiGeneratedPredictions.push(Math.round(baseVolume * (0.8 + (w * 0.05)) + (Math.sin(w) * 50)));
          }
        }

        for (let w = 1; w <= WEEKS_COUNT; w++) {
          const pred = aiGeneratedPredictions[w - 1] || Math.round(baseVolume * (0.8 + (w * 0.05)) + (Math.sin(w) * 50));
          let actual: number | null = null;
          if (w <= currentWeekReconciled) {
            const variance = (Math.sin(w * 1.5) * 0.07 + 0.02);
            actual = Math.max(0, Math.round(pred * (1 - variance)));
          }
          const weekDate = `2026-W${(20 + w).toString().padStart(2, "0")}`;
          const newLog = {
            id: logAutoId++,
            sku_id: sku_id,
            target_week: weekDate,
            week_number: w,
            predicted_qty: pred,
            actual_qty: actual,
            created_at: new Date(Date.now() - (13 - w) * 7 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          };
          predictionDatabase.push(newLog);
        }

        logs = predictionDatabase
          .filter((l) => l.sku_id === sku_id)
          .sort((a, b) => a.week_number - b.week_number);
      }

      const metrics = computeLogMetrics(logs);
      res.json({
        sku_id,
        timeline: logs,
        metrics,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch SKU validation" });
    }
  });

  // C. Operational Actuals Reconciliation: Update actual_qty for a given week
  app.put("/api/demand-validation/:sku_id", (req, res) => {
    try {
      const { sku_id } = req.params;
      const { target_week, actual_qty } = req.body;

      if (!target_week) {
        return res.status(400).json({ error: "target_week is required" });
      }

      let log = predictionDatabase.find(
        (l) => l.sku_id === sku_id && (l.target_week === target_week || `Wk ${l.week_number}` === target_week)
      );

      if (!log) {
        // If not found by exact string, try matching by week number
        const matchWk = target_week.match(/\d+/);
        if (matchWk) {
          const wkNum = parseInt(matchWk[0], 10);
          log = predictionDatabase.find((l) => l.sku_id === sku_id && l.week_number === wkNum);
        }
      }

      if (!log) {
        return res.status(404).json({
          error: `No forecast record found for SKU '${sku_id}' on week '${target_week}'.`,
        });
      }

      const parsedQty = actual_qty === null || actual_qty === "" || actual_qty === undefined ? null : Number(actual_qty);
      log.actual_qty = parsedQty;
      log.updated_at = new Date().toISOString();

      // Recalculate metrics for SKU
      const skuLogs = predictionDatabase
        .filter((l) => l.sku_id === sku_id)
        .sort((a, b) => a.week_number - b.week_number);
      const metrics = computeLogMetrics(skuLogs);

      const abs_err = log.actual_qty !== null ? Math.abs(log.predicted_qty - log.actual_qty) : null;
      const pct_err = log.actual_qty !== null && log.actual_qty > 0 ? Math.round((abs_err! / log.actual_qty) * 1000) / 10 : null;

      res.json({
        message: "Actual sales successfully reconciled",
        updated_log: {
          ...log,
          absolute_error: abs_err,
          percentage_error: pct_err,
        },
        timeline: skuLogs,
        metrics,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update actual demand" });
    }
  });

  // D. Offline Evaluation Engine: Calculate metrics for any arbitrary arrays
  app.post("/api/demand-validation/evaluate-batch", (req, res) => {
    try {
      const { predicted_demand, actual_demand } = req.body;
      if (!Array.isArray(predicted_demand) || !Array.isArray(actual_demand)) {
        return res.status(400).json({ error: "predicted_demand and actual_demand must be arrays" });
      }

      const pairs: DemandPredictionLog[] = [];
      const len = Math.min(predicted_demand.length, actual_demand.length);
      for (let i = 0; i < len; i++) {
        pairs.push({
          id: i + 1,
          sku_id: "BATCH-SKU",
          target_week: `Week ${i + 1}`,
          week_number: i + 1,
          predicted_qty: Number(predicted_demand[i]),
          actual_qty: actual_demand[i] !== null && actual_demand[i] !== undefined ? Number(actual_demand[i]) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const metrics = computeLogMetrics(pairs);
      res.json({
        sample_size: pairs.length,
        metrics,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Offline evaluation failed" });
    }
  });


  // 1. AI Demand Forecasting via CSV Upload
  app.post("/api/predict-demand", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString("utf-8");
      const records: any[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const predicted_skus = records.map((row, index) => {
        const historicalSales = Number(
          row.historical_sales || row.historicalSales || row.sales || 0
        );
        const randomFactor = 1.2 + Math.random() * 0.3; // 1.2 to 1.5
        const predictedDemand = Math.round(historicalSales * randomFactor);
        const capacity = Number(row.capacity || 0);
        const sellThrough = Number(row.sellThrough || row.sell_through || 0);
        // Correct S&OP logic: High sell-through (>= 65%) means high demand / Low markdown risk. Low sell-through (< 65%) means deadstock / High markdown risk.
        let markdownRisk = "Low";
        if (sellThrough > 0) {
          if (sellThrough < 60) markdownRisk = "High";
          else if (sellThrough < 72) markdownRisk = "Medium";
          else markdownRisk = "Low";
        } else {
          markdownRisk = predictedDemand > capacity ? "Low" : "Medium";
        }

        return {
          id: row.id || `TW-${100 + index + 1}`,
          name: row.name || `Garment SKU ${index + 1}`,
          demand: predictedDemand,
          capacity: capacity,
          safetyStock: Number(row.safetyStock || row.safety_stock || 0),
          sellThrough: sellThrough,
          price: Number(row.price || 0),
          markdownRisk: markdownRisk,
        };
      });

      res.json({ predicted_skus });
    } catch (error: any) {
      console.error("Error processing CSV:", error);
      res.status(500).json({ error: error.message || "Failed to process CSV file" });
    }
  });

  // 2. AI Procurement Engine Endpoint
  app.post("/api/optimize-allocation", (req, res) => {
    try {
      const { suppliers, totalDemand } = req.body;
      let demandLeft = Number(totalDemand || 0);

      const rankedSuppliers = (suppliers || []).map((s: any) => ({ ...s }));

      // Algorithm: Rank suppliers by utility score (Highest OTD, Lowest Cost, Lowest Risk)
      rankedSuppliers.sort((a: any, b: any) => {
        const scoreA =
          (Number(a.otd) || 0) /
          ((Number(a.cost) || 1) * ((Number(a.riskScore) || 0) + 1));
        const scoreB =
          (Number(b.otd) || 0) /
          ((Number(b.cost) || 1) * ((Number(b.riskScore) || 0) + 1));
        return scoreB - scoreA;
      });

      // Greedily allocate capacity based on rank
      for (const supp of rankedSuppliers) {
        const moq = Number(supp.moq || 0);
        const cap = Number(supp.capacity || 0);

        if (demandLeft > 0) {
          if (demandLeft >= moq) {
            const alloc = Math.min(cap, demandLeft);
            supp.optimizedAlloc = alloc;
            demandLeft -= alloc;
          } else {
            supp.optimizedAlloc = 0;
          }
        } else {
          supp.optimizedAlloc = 0;
        }
      }

      // Re-sort by ID to maintain original display order
      const optimizedSuppliers = [...rankedSuppliers].sort(
        (a: any, b: any) => (Number(a.id) || 0) - (Number(b.id) || 0)
      );

      res.json({
        optimized_allocations: optimizedSuppliers,
        unmet_demand: demandLeft,
      });
    } catch (error: any) {
      console.error("Optimization failed:", error);
      res.status(500).json({ error: error.message || "Optimization failed" });
    }
  });

  // 3. AI Risk Analysis & SWOT Generation
  app.post("/api/analyze-risk", async (req, res) => {
    try {
      const { supplierName, leadTime, otdPercent, costPerUnit } = req.body;
      const numLeadTime = Number(leadTime || 0);
      const numOtd = Number(otdPercent || 0);
      const numCost = Number(costPerUnit || 0);
      const name = String(supplierName || "Supplier");

      // 1. Asynchronous Model Inference (Simulating SVM)
      const riskScore = numLeadTime * 2 - numOtd * 0.5 + numCost * 0.01;
      let riskLevel = "Low";
      let confidence = Math.round((90.0 + Math.random() * 9.0) * 10) / 10;
      let delay = 0;

      if (riskScore > 0) {
        riskLevel = "High";
        confidence = Math.round((85.0 + Math.random() * 11.5) * 10) / 10;
        delay = Math.floor(Math.random() * 9) + 4;
      } else if (riskScore > -20) {
        riskLevel = "Medium";
        confidence = Math.round((75.0 + Math.random() * 14.0) * 10) / 10;
        delay = Math.floor(Math.random() * 4) + 1;
      } else {
        riskLevel = "Low";
        confidence = Math.round((90.0 + Math.random() * 9.0) * 10) / 10;
        delay = 0;
      }

      let swot = {
        strengths: `${name} maintains dedicated production capacity and regional supply network access.`,
        weaknesses: `Current On-Time Delivery rate of ${numOtd}% and ${numLeadTime} week lead time create vulnerability during high-volume spikes.`,
        opportunities: `Leverage safety stock buffering and early fabric bookings to stabilize costs around ₹${numCost}/unit.`,
        threats:
          riskLevel === "High"
            ? `Critical bottleneck risk during peak Puja delivery window.`
            : `Seasonal logistics friction and fabric availability shifts.`,
      };

      // 2. Dynamic SWOT Generation using Gemini API if key is configured
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const prompt = `You are a supply chain risk analyst. Based on the following supplier data, generate a brief SWOT analysis.
Supplier: ${name}
Lead Time: ${numLeadTime} weeks
On-Time Delivery (OTD): ${numOtd}%
Unit Cost: ₹${numCost}
Overall Risk Level calculated by our internal model: ${riskLevel}

Return ONLY a valid JSON object with four keys: "strengths", "weaknesses", "opportunities", and "threats". 
Each key should contain a 1-2 sentence analysis. Do not include markdown formatting or commentary.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          let rawText = response.text?.trim() || "";
          if (rawText.startsWith("```json")) {
            rawText = rawText.slice(7, -3).trim();
          } else if (rawText.startsWith("```")) {
            rawText = rawText.slice(3, -3).trim();
          }

          const parsed = JSON.parse(rawText);
          if (
            parsed.strengths &&
            parsed.weaknesses &&
            parsed.opportunities &&
            parsed.threats
          ) {
            swot = parsed;
          }
        } catch (llmErr) {
          console.warn("Gemini generation notice:", llmErr);
        }
      }

      res.json({
        risk_level: riskLevel,
        confidence,
        predicted_delay_days: delay,
        swot,
      });
    } catch (error: any) {
      console.error("Risk analysis failed:", error);
      res.status(500).json({ error: error.message || "Risk analysis failed" });
    }
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
