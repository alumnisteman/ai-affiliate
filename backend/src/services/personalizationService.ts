import prisma from "../lib/prisma";
import { getTopOpportunities } from "./opportunityService";
import { getViralPredictions } from "./viralEngine";

/**
 * Hasilkan dashboard yang dipersonalisasi per user.
 * Berdasarkan: riwayat klik, kategori favorit, platform terbaik, skor user.
 */
export async function getPersonalizedDashboard(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      insights: true,
      orders: { orderBy: { createdAt: "desc" }, take: 50 },
      affiliateLinks: { orderBy: { clicks: "desc" }, take: 10, include: { product: true } },
    },
  });

  if (!user) throw new Error(`User ${userId} tidak ditemukan`);

  // Tentukan kategori & platform favorit dari orders
  const categoryMap: Record<number, number> = {};
  const platformMap: Record<string, number> = {};

  for (const order of user.orders) {
    platformMap[order.platform] = (platformMap[order.platform] ?? 0) + 1;
  }

  for (const link of user.affiliateLinks) {
    const cat = link.product.categoryId;
    if (cat) categoryMap[cat] = (categoryMap[cat] ?? 0) + link.clicks;
    platformMap[link.product.platform] = (platformMap[link.product.platform] ?? 0) + link.clicks;
  }

  const topCategoryId =
    Object.entries(categoryMap).sort(([, a], [, b]) => b - a)[0]?.[0];
  const topPlatform =
    Object.entries(platformMap).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "tiktok";

  // Top opportunities disesuaikan kategori user
  const allOpportunities = await getTopOpportunities(20);
  const personalizedOpps = allOpportunities.filter(
    (o) => !topCategoryId || String(o.product.category?.id) === topCategoryId
  ).slice(0, 5);

  // Viral predictions
  const viralSignals = await getViralPredictions(5);

  // Top performing links user
  const topLinks = user.affiliateLinks.slice(0, 5).map((l) => ({
    productName: l.product.name,
    clicks:      l.clicks,
    conversions: l.conversions,
    platform:    l.product.platform,
  }));

  // Update user insights
  if (topCategoryId) {
    await prisma.userInsight.upsert({
      where: { userId_insightType: { userId, insightType: "best_category" } },
      update: { value: topCategoryId, score: categoryMap[Number(topCategoryId)] ?? 0 },
      create: { userId, insightType: "best_category", value: topCategoryId, score: categoryMap[Number(topCategoryId)] ?? 0 },
    });
  }

  await prisma.userInsight.upsert({
    where: { userId_insightType: { userId, insightType: "best_platform" } },
    update: { value: topPlatform, score: platformMap[topPlatform] ?? 0 },
    create: { userId, insightType: "best_platform", value: topPlatform, score: platformMap[topPlatform] ?? 0 },
  });

  return {
    user: { id: user.id, name: user.name, plan: user.plan },
    personalization: {
      topPlatform,
      topCategoryId: topCategoryId ? Number(topCategoryId) : null,
    },
    topOpportunities:  personalizedOpps,
    viralWarnings:     viralSignals,
    topPerformingLinks: topLinks,
    insights:          user.insights,
  };
}
