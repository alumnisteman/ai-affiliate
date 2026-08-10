import prisma from "../lib/prisma";
import { sendTelegram, formatViralAlert } from "../lib/telegram";

/**
 * Hitung Viral Signal Score untuk sebuah produk.
 * Composite:
 *   40% Sales Trend + 25% Review Trend + 20% Commission Score + 15% Search Trend (placeholder)
 */
export async function calculateViralScore(productId: number): Promise<{
  viralScore: number;
  confidence: number;
}> {
  const snapshots = await prisma.productSnapshot.findMany({
    where: { productId },
    orderBy: { capturedAt: "desc" },
    take: 7,
  });

  if (snapshots.length < 2) return { viralScore: 0, confidence: 0 };

  // Sales Trend: rata-rata salesGrowth 7 hari
  const avgSalesGrowth =
    snapshots.reduce((s, x) => s + x.salesGrowth, 0) / snapshots.length;
  const salesTrend = Math.min(1, Math.max(0, avgSalesGrowth / 100));

  // Review Trend: laju tambahan review
  const oldest = snapshots[snapshots.length - 1];
  const newest = snapshots[0];
  const reviewDiff = (newest.reviews - oldest.reviews) / Math.max(1, snapshots.length);
  const reviewTrend = Math.min(1, reviewDiff / 100);

  // Commission Score
  const product = await prisma.product.findUnique({ where: { id: productId } });
  const commissionScore = Math.min(1, (product?.commissionRate ?? 0) / 0.3);

  // Search Trend: placeholder 0.5 (akan diisi dari API eksternal)
  const searchTrend = 0.5;

  const viralScore =
    salesTrend    * 40 +
    reviewTrend   * 25 +
    commissionScore * 20 +
    searchTrend   * 15;

  // Confidence berdasarkan jumlah data poin
  const confidence = Math.min(1, snapshots.length / 7);

  const predictedFor = new Date();
  predictedFor.setHours(predictedFor.getHours() + 72);

  await prisma.viralSignal.create({
    data: {
      productId,
      salesTrend,
      reviewTrend,
      searchTrend,
      commissionScore,
      viralScore,
      confidence,
      predictedFor,
    },
  });

  return { viralScore, confidence };
}

/**
 * Jalankan viral engine untuk semua produk aktif dan kirim alert Telegram
 * bila ada produk dengan confidence > 0.8 dan belum di-alert hari ini.
 */
export async function runViralEngine(): Promise<void> {
  console.log("[ViralEngine] Mulai kalkulasi...");

  const products = await prisma.product.findMany({ select: { id: true, name: true } });

  for (const p of products) {
    const { viralScore, confidence } = await calculateViralScore(p.id);

    if (viralScore >= 70 && confidence >= 0.8) {
      // Cek apakah sudah di-alert hari ini
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alreadyAlerted = await prisma.viralSignal.findFirst({
        where: { productId: p.id, alerted: true, predictedAt: { gte: today } },
      });

      if (!alreadyAlerted) {
        const snapshot = await prisma.productSnapshot.findFirst({
          where: { productId: p.id },
          orderBy: { capturedAt: "desc" },
        });

        const msg = formatViralAlert({
          name: p.name,
          viralScore,
          confidence,
          salesTrend: snapshot?.salesGrowth ?? 0,
        });

        await sendTelegram(msg);

        // Tandai sudah di-alert
        await prisma.viralSignal.updateMany({
          where: { productId: p.id, alerted: false },
          data: { alerted: true },
        });

        console.log(`[ViralEngine] Alert dikirim untuk produk: ${p.name}`);
      }
    }
  }

  console.log(`[ViralEngine] Selesai. ${products.length} produk diperiksa.`);
}

/**
 * Ambil prediksi viral 72 jam ke depan.
 */
export async function getViralPredictions(limit = 20) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);

  return prisma.viralSignal.findMany({
    where: {
      predictedAt: { gte: cutoff },
      viralScore:   { gte: 50 },
    },
    orderBy: { viralScore: "desc" },
    take: limit,
    include: {
      product: {
        select: {
          id: true, name: true, price: true,
          commissionRate: true, imageUrl: true, platform: true,
          category: { select: { name: true } },
        },
      },
    },
  });
}
