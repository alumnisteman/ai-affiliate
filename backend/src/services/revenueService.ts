import prisma from "../lib/prisma";

/**
 * Ambil revenue summary harian/mingguan untuk seorang user.
 */
export async function getRevenueSummary(userId: number, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const snapshots = await prisma.revenueSnapshot.findMany({
    where: { userId, date: { gte: cutoff } },
    orderBy: { date: "asc" },
  });

  const totalCommission = snapshots.reduce(
    (s, x) => s + Number(x.totalCommission), 0
  );
  const totalClicks     = snapshots.reduce((s, x) => s + x.totalClicks, 0);
  const totalConversions = snapshots.reduce((s, x) => s + x.totalConversions, 0);
  const totalOrders     = snapshots.reduce((s, x) => s + x.totalOrders, 0);

  const avgCvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  // Tren harian
  const daily = snapshots.map((s) => ({
    date:        s.date,
    commission:  Number(s.totalCommission),
    clicks:      s.totalClicks,
    conversions: s.totalConversions,
    orders:      s.totalOrders,
  }));

  return {
    period:     `${days} hari terakhir`,
    summary: {
      totalCommission,
      totalClicks,
      totalConversions,
      totalOrders,
      avgCvr: Number(avgCvr.toFixed(2)),
    },
    daily,
  };
}

/**
 * Rekam snapshot revenue harian untuk user.
 */
export async function recordDailyRevenue(userId: number): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const orders = await prisma.order.findMany({
    where: {
      userId,
      createdAt: { gte: yesterday, lt: today },
    },
  });

  const clicks = await prisma.click.findMany({
    where: { timestamp: { gte: yesterday, lt: today } },
    include: { product: { include: { affiliateLinks: { where: { userId } } } } },
  });

  const totalCommission = orders.reduce((s, o) => s + Number(o.commission), 0);
  const totalClicks     = clicks.reduce((s, c) => s + c.count, 0);
  const totalOrders     = orders.length;
  const totalConversions = orders.length;

  await prisma.revenueSnapshot.upsert({
    where: { userId_date: { userId, date: yesterday } },
    update: { totalCommission, totalClicks, totalOrders, totalConversions },
    create: {
      userId, date: yesterday,
      totalCommission, totalClicks, totalOrders, totalConversions,
    },
  });
}

/**
 * Prediksi komisi 7 hari ke depan berdasarkan tren historis.
 */
export async function predictCommission(userId: number): Promise<{
  predicted7d: number;
  predicted30d: number;
  trend: "naik" | "stabil" | "turun";
}> {
  const recent = await prisma.revenueSnapshot.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 14,
  });

  if (recent.length < 7) {
    return { predicted7d: 0, predicted30d: 0, trend: "stabil" };
  }

  const last7  = recent.slice(0, 7).reduce((s, x) => s + Number(x.totalCommission), 0);
  const prev7  = recent.slice(7, 14).reduce((s, x) => s + Number(x.totalCommission), 0);

  const growthRate = prev7 > 0 ? (last7 - prev7) / prev7 : 0;
  const predicted7d  = last7 * (1 + growthRate);
  const predicted30d = last7 * 4 * (1 + growthRate);

  const trend = growthRate > 0.05 ? "naik" : growthRate < -0.05 ? "turun" : "stabil";

  return {
    predicted7d:  Math.round(predicted7d),
    predicted30d: Math.round(predicted30d),
    trend,
  };
}
