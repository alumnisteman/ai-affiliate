import { Router } from "express";
import prisma from "../lib/prisma";
import { chatJSON } from "../lib/aiClient";

const router = Router();

const SYSTEM_PROMPT = `Kamu adalah analis kompetitor affiliate Indonesia. 
Analisis data profil kreator/kompetitor dan berikan insight actionable tentang strategi konten mereka.`;

// GET /api/competitor/:platform/:handle — ambil/analisis profil kompetitor
router.get("/:platform/:handle", async (req, res) => {
  try {
    const { platform, handle } = req.params;

    // Cek cache di DB (max 24 jam)
    const cached = await prisma.competitorProfile.findUnique({
      where: { platform_handle: { platform, handle } },
    });

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    if (cached && cached.updatedAt > cutoff) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Placeholder: akan diisi dengan scraper Puppeteer di Sprint 5
    // Untuk sekarang, gunakan data mock + AI analysis
    const mockData = {
      handle,
      platform,
      followers: Math.floor(Math.random() * 500000) + 10000,
      avgViews:  Math.floor(Math.random() * 100000) + 5000,
      postFreq:  Math.random() * 7 + 1,
      niche:     "skincare",
    };

    const analysisPrompt = `
Analisis profil kompetitor affiliate berikut dan berikan insight strategis:
${JSON.stringify(mockData)}

Kembalikan JSON:
{
  "strengths": ["kekuatan 1", "kekuatan 2"],
  "weaknesses": ["kelemahan 1"],
  "contentStrategy": "ringkasan strategi konten",
  "bestPostTime": "jam posting terbaik",
  "topProducts": ["produk kategori 1", "produk kategori 2"],
  "recommendations": ["rekomendasi 1", "rekomendasi 2"]
}`;

    const analysis = await chatJSON(SYSTEM_PROMPT, analysisPrompt);

    // Simpan/update ke DB
    const profile = await prisma.competitorProfile.upsert({
      where: { platform_handle: { platform, handle } },
      update: {
        followers:    mockData.followers,
        avgViews:     mockData.avgViews,
        postFreq:     mockData.postFreq,
        topProducts:  JSON.stringify(analysis.topProducts),
        bestPostTime: analysis.bestPostTime,
        analyzedAt:   new Date(),
      },
      create: {
        platform,
        handle,
        followers:    mockData.followers,
        avgViews:     mockData.avgViews,
        postFreq:     mockData.postFreq,
        topProducts:  JSON.stringify(analysis.topProducts),
        bestPostTime: analysis.bestPostTime,
      },
    });

    res.json({ success: true, data: { ...profile, analysis }, cached: false });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/competitor — daftar semua kompetitor yang sudah dianalisis
router.get("/", async (_req, res) => {
  try {
    const profiles = await prisma.competitorProfile.findMany({
      orderBy: { followers: "desc" },
      take: 50,
    });
    res.json({ success: true, data: profiles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
