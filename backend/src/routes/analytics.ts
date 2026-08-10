import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { discoverPatterns, storePatterns } from '../engines/content-patterns';

const router = Router();

/**
 * GET /api/analytics/overview
 * Platform-level analytics overview
 */
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    // Clicks by platform
    const clicksByPlatform = await prisma.click.groupBy({
      by: ['source'],
      _sum: { count: true },
    });

    // Orders by platform
    const ordersByPlatform = await prisma.order.groupBy({
      by: ['platform'],
      _sum: { amount: true, commission: true },
      _count: true,
    });

    // Content performance summary
    const contentPerf = await prisma.contentPerformance.aggregate({
      _avg: { ctr: true, conversionRate: true, views: true },
      _sum: { views: true, likes: true, shares: true },
    });

    // Top performing content
    const topContent = await prisma.contentAsset.findMany({
      include: {
        product: { select: { name: true, categoryId: true } },
        performance: { orderBy: { views: 'desc' }, take: 1 },
      },
      take: 10,
    });

    // Product trends
    const trends = await prisma.productTrend.findMany({
      where: { trendType: 'rising' },
      include: { product: { select: { name: true, categoryId: true } } },
      orderBy: { momentum: 'desc' },
      take: 10,
    });

    res.json({
      clicksByPlatform: clicksByPlatform.map((c) => ({
        platform: c.source || 'unknown',
        clicks: c._sum.count || 0,
      })),
      ordersByPlatform: ordersByPlatform.map((o) => ({
        platform: o.platform,
        orders: o._count,
        revenue: Number(o._sum.amount || 0),
        commission: Number(o._sum.commission || 0),
      })),
      contentSummary: {
        avgCtr: contentPerf._avg.ctr || 0,
        avgConversion: contentPerf._avg.conversionRate || 0,
        totalViews: contentPerf._sum.views || 0,
        totalLikes: contentPerf._sum.likes || 0,
        totalShares: contentPerf._sum.shares || 0,
      },
      topContent: topContent
        .filter((c) => c.performance.length > 0)
        .map((c) => ({
          id: c.id,
          hook: c.hook,
          product: c.product.name,
          category: c.product.categoryId,
          views: c.performance[0]?.views || 0,
          ctr: c.performance[0]?.ctr || 0,
        })),
      risingTrends: trends.map((t) => ({
        product: t.product.name,
        category: t.product.categoryId,
        momentum: t.momentum,
        period: t.period,
      })),
    });
  } catch (error: any) {
    console.error('[Analytics] Error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil analitik' });
  }
});

/**
 * GET /api/analytics/content-patterns
 * Get discovered content patterns (Layer 4)
 */
router.get('/content-patterns', async (req: Request, res: Response) => {
  try {
    const { category, platform } = req.query;

    const patterns = await prisma.contentPattern.findMany({
      where: {
        ...(category ? { categoryId: parseInt(category as string) } : {}),
        ...(platform ? { platform: platform as string } : {}),
      },
      orderBy: { avgCtr: 'desc' },
      take: 20,
    });

    res.json({ patterns, total: patterns.length });
  } catch (error: any) {
    console.error('[Analytics] Patterns error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil pola konten' });
  }
});

/**
 * POST /api/analytics/discover-patterns
 * Trigger pattern discovery from content performance data
 */
router.post('/discover-patterns', async (_req: Request, res: Response) => {
  try {
    const patterns = await discoverPatterns();
    const stored = await storePatterns(patterns);
    res.json({ discovered: patterns.length, stored, patterns });
  } catch (error: any) {
    console.error('[Analytics] Discover patterns error:', error.message);
    res.status(500).json({ error: 'Gagal menemukan pola' });
  }
});

/**
 * GET /api/analytics/events
 * Get recent events for the feedback loop (Layer 7)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { eventType, limit } = req.query;

    const events = await prisma.event.findMany({
      where: eventType ? { eventType: eventType as string } : {},
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
    });

    res.json({ events, total: events.length });
  } catch (error: any) {
    console.error('[Analytics] Events error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil event' });
  }
});

export default router;
