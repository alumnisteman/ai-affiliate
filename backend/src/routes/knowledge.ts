import { Router } from "express";
import { getProductGraph, buildProductGraph, updateProductInsight } from "../services/knowledgeService";

const router = Router();

// GET /api/knowledge/graph/:productId
router.get("/graph/:productId", async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const graph = await getProductGraph(productId);
    if (!graph) return res.status(404).json({ success: false, error: "Produk tidak ditemukan" });
    res.json({ success: true, data: graph });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/knowledge/build/:productId — rebuild graph untuk produk
router.post("/build/:productId", async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    buildProductGraph(productId).catch(console.error); // async background
    res.json({ success: true, message: `Graph building untuk produk ${productId} dimulai` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/knowledge/insight
router.post("/insight", async (req, res) => {
  try {
    const { productId, insightType, key, value, confidence, sampleSize } = req.body;
    const insight = await updateProductInsight(productId, insightType, key, value, confidence, sampleSize);
    res.json({ success: true, data: insight });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
