import { Router } from "express";
import { getRevenueSummary, predictCommission, recordDailyRevenue } from "../services/revenueService";

const router = Router();

// GET /api/revenue/summary/:userId
router.get("/summary/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const days = Number(req.query.days) || 30;
    const summary = await getRevenueSummary(userId, days);
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/revenue/predict/:userId — prediksi komisi 7/30 hari ke depan
router.get("/predict/:userId", async (req, res) => {
  try {
    const prediction = await predictCommission(Number(req.params.userId));
    res.json({ success: true, data: prediction });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/revenue/snapshot/:userId — rekam snapshot harian manual
router.post("/snapshot/:userId", async (req, res) => {
  try {
    await recordDailyRevenue(Number(req.params.userId));
    res.json({ success: true, message: "Snapshot revenue hari ini dicatat" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
