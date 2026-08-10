import { Router } from "express";
import { analyzeContentDNA, getTopPatterns } from "../services/contentDNAEngine";

const router = Router();

// POST /api/content/dna — analisis DNA untuk kategori+platform
router.post("/dna", async (req, res) => {
  try {
    const { categoryId, platform } = req.body;
    if (!categoryId || !platform) {
      return res.status(400).json({ success: false, error: "categoryId dan platform diperlukan" });
    }
    analyzeContentDNA(Number(categoryId), platform).catch(console.error);
    res.json({ success: true, message: "DNA analysis dimulai di background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/content/dna/patterns — ambil top patterns
router.get("/dna/patterns", async (req, res) => {
  try {
    const { categoryId, platform } = req.query;
    if (!categoryId || !platform) {
      return res.status(400).json({ success: false, error: "categoryId dan platform diperlukan" });
    }
    const patterns = await getTopPatterns(Number(categoryId), String(platform));
    res.json({ success: true, data: patterns });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
