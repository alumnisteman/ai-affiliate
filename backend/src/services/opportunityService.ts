import prisma from "../lib/prisma";

/**
 * Hitung Opportunity Score untuk sebuah produk.
 * Formula:
 *   30% Sales Growth + 25% Commission Value + 20% Conversion Rate
 *   + 15% Review Velocity + 10% Competition Index
 */
export async function calculateOpportunityScore(productId: number): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      snapshots: { orderBy: { capturedAt: "desc" }, take: 2 },
      affiliateMetrics: { orderBy: { calculatedAt: "desc" }, take: 1 },
    },
  });

  if (!product) throw new Error(`Produk ${productId} tidak ditemukan`);

  const latest = product.snapshots[0];
  const prev   = product.snapshots[1];

  // 1. Sales Growth (30%)
  const salesGrowth = latest?.salesGrowth ?? 0;
  const salesGrowthScore = Math.min(100, Math.max(0, salesGrowth));

  // 2. Commission Value (25%) — normalisasi ke 0-100 dari rate 0-30%
  const commissionScore = Math.min(100, (product.commissionRate / 0.3) * 100);

  // 3. Conversion Rate (20%)
  const metric = product.affiliateMetrics[0];
  const conversionScore = Math.min(100, (metric?.conversionRate ?? 0) * 100 * 10);

  // 4. Review Velocity (15%) — selisih review antara 2 snapshot
  const reviewDiff = prev ? (latest?.reviews ?? 0) - (prev?.reviews ?? 0) : 0;
  const reviewVelocity = Math.min(100, reviewDiff / 50);

  // 5. Competition Index (10%) — inverse: semakin banyak kompetitor, makin rendah
  // Placeholder: akan diisi dari CompetitorProfile nanti
  const competitionIndex = 50;

  const score =
    salesGrowthScore  * 0.30 +
    commissionScore   * 0.25 +
    conversionScore   * 0.20 +
    reviewVelocity    * 0.15 +
    competitionIndex  * 0.10;

  // Simpan ke database
  await prisma.opportunityScore.create({
    data: {
      productId,
      score,
      salesGrowthScore,
      commissionScore,
      conversionScore,
      reviewVelocity,
      competitionIndex,
    },
  });

  return score;
}

/**
 * Ambil top opportunity hari ini (skor tertinggi per produk).
 */
export async function getTopOpportunities(limit = 10) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);

  return prisma.opportunityScore.findMany({
    where: { calculatedAt: { gte: cutoff } },
    orderBy: { score: "desc" },
    take: limit,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          commissionRate: true,
          imageUrl: true,
          platform: true,
          category: true,
        },
      },
    },
  });
}
