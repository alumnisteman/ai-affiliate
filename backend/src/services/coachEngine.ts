import { chatJSON } from "../lib/aiClient";
import prisma from "../lib/prisma";

interface CoachFeedback {
  hookScore:     number; // 0-100
  ctaScore:      number;
  paceScore:     number;
  emotionScore:  number;
  overallScore:  number;
  issues:        string[];
  suggestions:   string[];
  rewrittenHook?: string;
}

const SYSTEM_PROMPT = `Kamu adalah AI Campaign Coach untuk affiliator Indonesia. 
Tugasmu menganalisis konten (script TikTok, caption, hook) dan memberikan saran perbaikan yang konkrit.
Nilai setiap aspek dari 0-100. Berikan saran yang actionable dan spesifik.
Gunakan bahasa Indonesia yang informal dan energik.`;

/**
 * Evaluasi konten dan hasilkan coaching feedback dari Claude.
 */
export async function evaluateContent(params: {
  contentType: string;
  hook?: string;
  caption?: string;
  script?: string;
  ctaType?: string;
  durationSeconds?: number;
  productName?: string;
  targetAudience?: string;
}): Promise<CoachFeedback> {
  const prompt = `
Evaluasi konten affiliate berikut:

Produk: ${params.productName || "Tidak diketahui"}
Target Audiens: ${params.targetAudience || "Umum"}
Tipe Konten: ${params.contentType}
Hook: ${params.hook || "-"}
Caption: ${params.caption || "-"}
Script: ${params.script || "-"}
CTA: ${params.ctaType || "-"}
Durasi: ${params.durationSeconds ? params.durationSeconds + " detik" : "tidak diketahui"}

Kembalikan JSON dengan struktur:
{
  "hookScore": <0-100>,
  "ctaScore": <0-100>,
  "paceScore": <0-100>,
  "emotionScore": <0-100>,
  "overallScore": <0-100>,
  "issues": ["masalah 1", "masalah 2"],
  "suggestions": ["saran 1", "saran 2", "saran 3"],
  "rewrittenHook": "<hook yang sudah diperbaiki>"
}
`;

  return chatJSON<CoachFeedback>(SYSTEM_PROMPT, prompt);
}

/**
 * Evaluasi dan simpan hasil coaching ke database.
 */
export async function evaluateAndSave(contentAssetId: number): Promise<CoachFeedback> {
  const asset = await prisma.contentAsset.findUnique({
    where: { id: contentAssetId },
    include: { product: true },
  });
  if (!asset) throw new Error(`ContentAsset ${contentAssetId} tidak ditemukan`);

  const feedback = await evaluateContent({
    contentType:     asset.contentType,
    hook:            asset.hook    ?? undefined,
    caption:         asset.caption ?? undefined,
    script:          asset.script  ?? undefined,
    ctaType:         asset.ctaType ?? undefined,
    durationSeconds: asset.durationSeconds ?? undefined,
    productName:     asset.product.name,
    targetAudience:  asset.product.targetAudience ?? undefined,
  });

  // Simpan ke ContentDNAResult
  await prisma.contentDNAResult.create({
    data: {
      contentAssetId,
      hookScore:    feedback.hookScore,
      ctaScore:     feedback.ctaScore,
      paceScore:    feedback.paceScore,
      emotionScore: feedback.emotionScore,
      overallScore: feedback.overallScore,
      suggestions:  JSON.stringify(feedback.suggestions),
    },
  });

  // Update coachFeedback di ContentAsset
  await prisma.contentAsset.update({
    where: { id: contentAssetId },
    data: {
      coachFeedback: JSON.stringify(feedback),
      dnaScore: feedback.overallScore,
    },
  });

  return feedback;
}
