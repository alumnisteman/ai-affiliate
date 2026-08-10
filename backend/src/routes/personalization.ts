import { Router } from "express";
import { getPersonalizedDashboard } from "../services/personalizationService";

const router = Router();

// GET /api/personalize/dashboard/:userId
router.get("/dashboard/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const dashboard = await getPersonalizedDashboard(userId);
    res.json({ success: true, data: dashboard });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
