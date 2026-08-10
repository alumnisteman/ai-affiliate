import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calculateOpportunityScore, recalculateAllScores } from '../engines/opportunity';
import { getProductRecommendation } from '../engines/recommendation';
import { calculatePrediction } from '../engines/commission-prediction';

const router = Router();

/**
 * GET /api/products
 * List all products with their latest opportunity score
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { platform, category, sort, limit } = req.query;

    const products = await prisma.product.findMany({
      where: {
        ...(platform ? { platform: platform as string } : {}),
        ...(category ? { categoryId: parseInt(category as string) } : {}),
      },
      include: {
        opportunityScores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        affiliateMetrics: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        category: { select: { name: true } }
      },
      take: limit ? parseInt(limit as string) : 50,
    });

    const result = products.map((p) => ({
      id: p.id,
      externalId: p.externalId,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      commissionRate: p.commissionRate,
      category: p.category?.name || '',
      platform: p.platform,
      imageUrl: p.imageUrl,
      rating: p.rating,
      reviews: p.reviews,
      opportunityScore: p.opportunityScores[0]?.score || 0,
      sales7d: p.snapshots[0]?.sales7d || 0,
      salesGrowth: p.snapshots[0]?.salesGrowth || 0,
      totalClicks: p.affiliateMetrics[0]?.totalClicks || 0,
      conversionRate: p.affiliateMetrics[0]?.conversionRate || 0,
    }));

    // Sort by opportunity score if requested
    if (sort === 'opportunity') {
      result.sort((a, b) => b.opportunityScore - a.opportunityScore);
    }

    res.json({ products: result, total: result.length });
  } catch (error: any) {
    console.error('[Products] Error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
});

/**
 * GET /api/products/:id
 * Get single product with full details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        opportunityScores: { orderBy: { calculatedAt: 'desc' }, take: 5 },
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 7 },
        affiliateMetrics: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        category: { select: { name: true } },
        affiliateLinks: true,
        contentAssets: {
          include: { performance: { orderBy: { recordedAt: 'desc' }, take: 1 } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    res.json(product);
  } catch (error: any) {
    console.error('[Products] Error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil detail produk' });
  }
});

/**
 * GET /api/products/:id/recommendation
 * Get AI recommendation for a product (Layer 5)
 */
router.get('/:id/recommendation', async (req: Request, res: Response) => {
  try {
    const recommendation = await getProductRecommendation(parseInt(req.params.id));
    res.json(recommendation);
  } catch (error: any) {
    console.error('[Products] Recommendation error:', error.message);
    res.status(500).json({ error: 'Gagal membuat rekomendasi' });
  }
});

/**
 * GET /api/products/:id/prediction
 * Get commission prediction for a product (Layer 6)
 */
router.get('/:id/prediction', async (req: Request, res: Response) => {
  try {
    const views = parseInt(req.query.views as string) || 10000;
    const prediction = await calculatePrediction(parseInt(req.params.id), views);
    res.json({
      productId: prediction.productId,
      inputViews: prediction.inputViews,
      inputCtr: prediction.inputCtr,
      minimum: Number(prediction.minimumComm),
      expected: Number(prediction.expectedComm),
      optimistic: Number(prediction.optimisticComm),
      period: prediction.period,
    });
  } catch (error: any) {
    console.error('[Products] Prediction error:', error.message);
    res.status(500).json({ error: 'Gagal menghitung prediksi' });
  }
});

/**
 * POST /api/products/recalculate-scores
 * Recalculate opportunity scores for all products (Layer 2)
 */
router.post('/recalculate-scores', async (_req: Request, res: Response) => {
  try {
    const count = await recalculateAllScores();
    res.json({ message: `Skor diperbarui untuk ${count} produk` });
  } catch (error: any) {
    console.error('[Products] Recalculate error:', error.message);
    res.status(500).json({ error: 'Gagal memperbarui skor' });
  }
});

export default router;
