import { Router } from "express";
import { createShortLink, resolveShortLink, getShortLinkStats } from "../services/shortlinkService";

const router = Router();

// POST /api/shortlink — buat shortlink baru
router.post("/", async (req, res) => {
  try {
    const { targetUrl, productId, userId, campaignId } = req.body;
    if (!targetUrl) return res.status(400).json({ success: false, error: "targetUrl diperlukan" });

    const result = await createShortLink({ targetUrl, productId, userId, campaignId });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/shortlink/stats/:userId
router.get("/stats/:userId", async (req, res) => {
  try {
    const stats = await getShortLinkStats(Number(req.params.userId));
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
