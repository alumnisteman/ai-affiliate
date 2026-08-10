import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/affiliate-links
 * List all affiliate links
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const links = await prisma.affiliateLink.findMany({
      where: userId ? { userId: parseInt(userId as string) } : {},
      include: {
        product: { select: { name: true, platform: true, imageUrl: true, price: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      links: links.map((l) => ({
        id: l.id,
        productId: l.productId,
        productName: l.product.name,
        platform: l.product.platform,
        imageUrl: l.product.imageUrl,
        price: Number(l.product.price),
        url: l.url,
        shortUrl: l.shortUrl,
        linkPlatform: l.platform,
        clicks: l.clicks,
        conversions: l.conversions,
        conversionRate: l.clicks > 0 ? Math.round((l.conversions / l.clicks) * 10000) / 100 : 0,
        createdAt: l.createdAt,
      })),
      total: links.length,
    });
  } catch (error: any) {
    console.error('[AffiliateLinks] Error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil link affiliate' });
  }
});

/**
 * POST /api/affiliate-links
 * Create a new affiliate link
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, userId, url, platform } = req.body;

    if (!productId || !userId || !url) {
      return res.status(400).json({ error: 'productId, userId, dan url wajib diisi' });
    }

    const link = await prisma.affiliateLink.create({
      data: {
        productId: parseInt(productId),
        userId: parseInt(userId),
        url,
        shortUrl: url.replace(/https?:\/\//, '').substring(0, 30) + '...',
        platform: platform || 'tiktok',
      },
      include: {
        product: { select: { name: true } },
      },
    });

    res.status(201).json(link);
  } catch (error: any) {
    console.error('[AffiliateLinks] Create error:', error.message);
    res.status(500).json({ error: 'Gagal membuat link affiliate' });
  }
});

/**
 * PUT /api/affiliate-links/:id/track
 * Increment click count for an affiliate link
 */
router.put('/:id/track', async (req: Request, res: Response) => {
  try {
    const link = await prisma.affiliateLink.update({
      where: { id: parseInt(req.params.id) },
      data: { clicks: { increment: 1 } },
    });

    // Also record a Click event
    await prisma.click.create({
      data: {
        productId: link.productId,
        source: 'affiliate_link',
      },
    });

    // Record event for feedback loop (Layer 7)
    await prisma.event.create({
      data: {
        eventType: 'click',
        entityId: link.id,
        entityType: 'link',
      },
    });

    res.json({ clicks: link.clicks });
  } catch (error: any) {
    console.error('[AffiliateLinks] Track error:', error.message);
    res.status(500).json({ error: 'Gagal melacak klik' });
  }
});

export default router;
