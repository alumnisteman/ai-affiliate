import { Router } from "express";
import { getViralPredictions, runViralEngine } from "../services/viralEngine";

const router = Router();

// GET /api/viral/predictions — top viral predictions 72 jam ke depan
router.get("/predictions", async (_req, res) => {
  try {
    const predictions = await getViralPredictions(20);
    res.json({ success: true, data: predictions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/viral/run — trigger viral engine manual (admin)
router.post("/run", async (_req, res) => {
  try {
    // Jalankan di background agar request tidak timeout
    runViralEngine().catch(console.error);
    res.json({ success: true, message: "Viral engine dijalankan di background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
