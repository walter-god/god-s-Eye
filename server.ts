import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI client:", err);
    }
  }
  return geminiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    system: "Aegis Oculus Neural Surveillance Grid",
    version: "4.8.1-TACTICAL",
    timestamp: new Date().toISOString(),
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
  });
});

// System telemetry and sensor metrics endpoint
app.get("/api/telemetry", (_req, res) => {
  const activeStreams = Math.floor(4890000 + Math.random() * 25000);
  const throughputGbps = (384.4 + (Math.random() * 12 - 6)).toFixed(1);
  const latencyMs = (1.1 + Math.random() * 0.4).toFixed(2);
  const activeWarrants = 4;
  const nodesOnline = 12480;

  res.json({
    activeStreams,
    throughputGbps,
    latencyMs,
    activeWarrants,
    nodesOnline,
    retrievalIntegrity: "99.98%",
    orbitalSatsOnline: 18,
    cctvNodesActive: "4.2M",
    transitScannersActive: "620K",
  });
});

// Helper for resilient Gemini API execution with fallback models
async function generateForensicReportWithGemini(ai: GoogleGenAI, prompt: string): Promise<any | null> {
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-flash-latest"];
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        return JSON.parse(responseText);
      }
    } catch {
      // Model unavailable or temporary spike, continue to candidate or fallback
      continue;
    }
  }
  return null;
}

// AI-powered forensic dossier & trajectory prediction endpoint
app.post("/api/forensic-analysis", async (req, res) => {
  const { targetName, targetCodename, lastKnownCity, detectedSensors, confidenceScore, contextNotes } = req.body;

  try {
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are the central AI core of the fictional 'Aegis Oculus' lawful intelligence platform (inspired by God's Eye from Fast & Furious). 
Generate a concise tactical intelligence and forensic behavioral prediction report in strict JSON format.

Target details:
- Target Name: ${targetName || "Unknown Subject"}
- Codename: ${targetCodename || "PHANTOM"}
- Last Known Location: ${lastKnownCity || "Tokyo Shibuya Grid"}
- Match Confidence: ${confidenceScore || 94.8}%
- Sensors Engaged: ${JSON.stringify(detectedSensors || ["Traffic-Cam-402", "Transit-Biometric-Gate-B", "Orbital-SAR-04"])}
- Context Notes: ${contextNotes || "Authorized Lawful Tracking - Intercept Order #889-Alpha"}

Generate a JSON response matching this schema:
{
  "summary": "Brief 2-sentence tactical summary of detection and lock status",
  "threatLevel": "LOW" | "ELEVATED" | "CRITICAL" | "HIGH",
  "biometricSignature": {
    "facialVectorConfidence": "number (e.g. 96.4%)",
    "gaitAnalysisMatch": "number (e.g. 91.2%)",
    "irisScanStatus": "VERIFIED" | "PARTIAL" | "NOT_ACQUIRED",
    "thermalVariance": "Normal (36.8°C)"
  },
  "predictedTrajectory": [
    {
      "etaMinutes": 5,
      "probableLocation": "Location name",
      "transitMethod": "High-Speed Transit | Foot | Black Sedan | Subway",
      "probability": "88%"
    },
    {
      "etaMinutes": 15,
      "probableLocation": "Next Location name",
      "transitMethod": "Transit method",
      "probability": "74%"
    }
  ],
  "tacticalRecommendations": [
    "Specific actionable tactical recommendation 1",
    "Specific actionable tactical recommendation 2",
    "Specific actionable tactical recommendation 3"
  ],
  "lawfulComplianceNote": "Strict judicial warrant #AEGIS-2026 verification passed. Chain-of-custody logged."
}

Return ONLY valid JSON. No markdown ticks, no commentary.`;

      const parsedData = await generateForensicReportWithGemini(ai, prompt);
      if (parsedData) {
        return res.json({ success: true, source: "gemini", data: parsedData });
      }
    }

    // High-fidelity synthetic fallback when Gemini is busy or key absent
    const syntheticData = {
      summary: `Subject ${targetName || "Target"} identified by Aegis Oculus optical triage at ${lastKnownCity || "Shibuya Crossing"}. Biometric confidence index verified at ${confidenceScore || 96.2}%.`,
      threatLevel: "CRITICAL",
      biometricSignature: {
        facialVectorConfidence: `${confidenceScore || 96.2}%`,
        gaitAnalysisMatch: "93.7%",
        irisScanStatus: "VERIFIED",
        thermalVariance: "36.8°C (Nominal)",
      },
      predictedTrajectory: [
        {
          etaMinutes: 4,
          probableLocation: `${lastKnownCity || "Central"} Northbound Rapid Transit Platform 3`,
          transitMethod: "High-Speed Transit / Rapid Transit",
          probability: "89%",
        },
        {
          etaMinutes: 14,
          probableLocation: `${lastKnownCity || "Financial"} Commercial Skyway Corridor`,
          transitMethod: "Armored High-Speed Sedan",
          probability: "76%",
        },
        {
          etaMinutes: 28,
          probableLocation: "Sub-level Cargo Depot Gate 7",
          transitMethod: "Vehicular Transfer",
          probability: "62%",
        },
      ],
      tacticalRecommendations: [
        "Deploy optical geofence over sector perimeter with 120m buffer radius.",
        "Cross-reference live automated license plate readers (ALPR) on outward arterial roads.",
        "Authorize local response team alert under Warrant Protocol #AEGIS-2026.",
      ],
      lawfulComplianceNote: "Authorized under Inter-Agency Warrant #882-C. Biometric hash cryptographically sealed with SHA-384.",
    };

    return res.json({ success: true, source: "synthetic", data: syntheticData });
  } catch (error) {
    console.error("Forensic analysis error:", error);
    return res.status(500).json({
      error: "Internal forensic calculation error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

async function startServer() {
  const distPath = path.resolve(process.cwd(), "dist");
  const isProduction =
    process.env.NODE_ENV === "production" ||
    (process.argv[1] && process.argv[1].includes("dist")) ||
    process.env.npm_lifecycle_event === "start";

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aegis Oculus] Command server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
