import { Router } from "express";
import { runAgentPlan, getUserPlans } from "../services/agentOrchestrator";

const router = Router();

// POST /api/agent/plan — jalankan AI agent untuk user
router.post("/plan", async (req, res) => {
  try {
    const { userId, goal } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: "userId diperlukan" });

    const result = await runAgentPlan(
      Number(userId),
      goal || "Cari peluang affiliate terbaik minggu ini"
    );
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agent/plans/:userId — riwayat plan user
router.get("/plans/:userId", async (req, res) => {
  try {
    const plans = await getUserPlans(Number(req.params.userId));
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
