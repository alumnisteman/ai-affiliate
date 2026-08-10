import { chatJSON } from "../lib/aiClient";
import prisma from "../lib/prisma";

interface DNAPattern {
  hookTemplate:  string;
  avgCtr:        number;
  avgConversion: number;
  avgDuration:   number;
  ctaType:       string;
  confidence:    number;
  sampleSize:    number;
}

const SYSTEM_PROMPT = `Kamu adalah analis konten affiliate Indonesia. 
Kamu menganalisis pola dari banyak konten dan mengidentifikasi DNA kemenangan (winning patterns).
Fokus pada: hook, durasi optimal, jenis CTA, dan elemen emosional yang menghasilkan konversi.
Berikan output berupa JSON.`;

/**
 * Analisis DNA dari sekumpulan ContentAsset dalam satu kategori+platform.
 */
export async function analyzeContentDNA(
  categoryId: number,
  platform: string
): Promise<DNAPattern[]> {
  // Ambil 100 content asset terbaik (berdasarkan CTR)
  const assets = await prisma.contentAsset.findMany({
    where: { product: { categoryId }, contentType: platform },
    include: {
      performance: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
    take: 100,
  });

  if (assets.length < 5) return [];

  const contentData = assets.map((a) => ({
    hook: a.hook,
    duration: a.durationSeconds,
    ctaType: a.ctaType,
    ctr: a.performance[0]?.ctr ?? 0,
    conversionRate: a.performance[0]?.conversionRate ?? 0,
  }));

  const prompt = `
Analisis pola DNA dari ${assets.length} konten affiliate kategori platform ${platform}:

${JSON.stringify(contentData.slice(0, 30), null, 2)}

Identifikasi pattern yang paling sukses. Kembalikan JSON array:
[
  {
    "hookTemplate": "<template hook>",
    "avgCtr": <angka>,
    "avgConversion": <angka>,
    "avgDuration": <detik>,
    "ctaType": "soft|hard|story|discount",
    "confidence": <0-1>,
    "sampleSize": <jumlah>
  }
]
`;

  const patterns = await chatJSON<DNAPattern[]>(SYSTEM_PROMPT, prompt);

  // Simpan patterns ke database
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (category) {
    for (const p of patterns) {
      await prisma.contentPattern.upsert({
        where: {
          categoryId_platform_hookTemplate: {
            categoryId,
            platform,
            hookTemplate: p.hookTemplate,
          },
        },
        update: {
          avgCtr:       p.avgCtr,
          avgConversion: p.avgConversion,
          avgDuration:  p.avgDuration,
          ctaType:      p.ctaType,
          confidence:   p.confidence,
          sampleSize:   p.sampleSize,
        },
        create: {
          categoryId,
          platform,
          hookTemplate:  p.hookTemplate,
          avgCtr:        p.avgCtr,
          avgConversion: p.avgConversion,
          avgDuration:   p.avgDuration,
          ctaType:       p.ctaType,
          confidence:    p.confidence,
          sampleSize:    p.sampleSize,
        },
      });
    }
  }

  return patterns;
}

/**
 * Ambil top patterns untuk kategori dan platform tertentu.
 */
export async function getTopPatterns(categoryId: number, platform: string) {
  return prisma.contentPattern.findMany({
    where: { categoryId, platform },
    orderBy: { avgConversion: "desc" },
    take: 10,
    include: { category: true },
  });
}
