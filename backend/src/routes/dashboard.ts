import { Router } from 'express';
import prisma from '../lib/prisma';
import { getTopOpportunities } from '../engines/opportunity';

const router = Router();

/**
 * GET /api/dashboard
 * Returns aggregated performance summary for the dashboard overview
 */
router.get('/', async (_req, res) => {
  try {
    // Aggregate clicks
    const clicksAgg = await prisma.click.aggregate({ _sum: { count: true } });
    const totalClicks = clicksAgg._sum.count || 0;

    // Aggregate orders & commission
    const ordersAgg = await prisma.order.aggregate({
      _sum: { amount: true, commission: true },
      _count: true,
    });
    const totalOrders = ordersAgg._count || 0;
    const totalRevenue = Number(ordersAgg._sum.amount || 0);
    const totalCommission = Number(ordersAgg._sum.commission || 0);

    // Conversion rate
    const conversionRate = totalClicks > 0 ? ((totalOrders / totalClicks) * 100) : 0;

    // Active affiliate links
    const activeLinks = await prisma.affiliateLink.count();

    // Products count
    const productsCount = await prisma.product.count();

    // Top opportunities
    const topOpportunities = await getTopOpportunities(5);

    // Recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Daily commission for chart (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyOrders = await prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { commission: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyCommission: Record<string, number> = {};
    for (const order of dailyOrders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      dailyCommission[dateKey] = (dailyCommission[dateKey] || 0) + Number(order.commission);
    }

    res.json({
      summary: {
        totalClicks,
        totalOrders,
        totalRevenue,
        totalCommission,
        conversionRate: Math.round(conversionRate * 100) / 100,
        activeLinks,
        productsCount,
      },
      topOpportunities: topOpportunities.map((o) => ({
        productId: o.productId,
        productName: o.product.name,
        score: o.score,
        platform: o.product.platform,
        category: o.product.categoryId,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        product: o.product.name,
        amount: Number(o.amount),
        commission: Number(o.commission),
        date: o.createdAt,
      })),
      dailyCommission: Object.entries(dailyCommission).map(([date, amount]) => ({
        date,
        amount,
      })),
    });
  } catch (error: any) {
    console.error('[Dashboard] Error:', error.message);
    res.status(500).json({ error: 'Gagal memuat data dashboard' });
  }
});

export default router;
