import { Router } from "express";
import { evaluateContent, evaluateAndSave } from "../services/coachEngine";

const router = Router();

// POST /api/coach/evaluate — evaluasi konten via AI (tanpa simpan)
router.post("/evaluate", async (req, res) => {
  try {
    const params = req.body;
    const feedback = await evaluateContent(params);
    res.json({ success: true, data: feedback });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/coach/evaluate/:contentAssetId — evaluasi & simpan ke DB
router.post("/evaluate/:contentAssetId", async (req, res) => {
  try {
    const contentAssetId = Number(req.params.contentAssetId);
    const feedback = await evaluateAndSave(contentAssetId);
    res.json({ success: true, data: feedback });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
