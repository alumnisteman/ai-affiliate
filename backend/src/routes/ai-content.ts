import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateContent, buildProductPrompt } from '../utils/gemini';

const router = Router();

/**
 * GET /api/ai-content
 * List generated AI content
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { productId, contentType, limit } = req.query;

    const content = await prisma.aIContent.findMany({
      where: {
        ...(productId ? { productId: parseInt(productId as string) } : {}),
        ...(contentType ? { contentType: contentType as string } : {}),
      },
      include: {
        product: { select: { name: true, platform: true, imageUrl: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 20,
    });

    res.json({ content, total: content.length });
  } catch (error: any) {
    console.error('[AIContent] Error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil konten AI' });
  }
});

/**
 * POST /api/ai-content/generate
 * Generate new content using Gemini AI
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { productId, userId, contentType, platform, customPrompt } = req.body;

    if (!productId || !userId) {
      return res.status(400).json({ error: 'productId dan userId wajib diisi' });
    }

    // Fetch product details
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    // Build prompt
    const prompt = customPrompt || buildProductPrompt({
      name: product.name,
      price: Number(product.price),
      platform: platform || product.platform,
    });

    // Generate content via Gemini
    const generatedText = await generateContent(prompt);

    // Store in database
    const aiContent = await prisma.aIContent.create({
      data: {
        productId: parseInt(productId),
        userId: parseInt(userId),
        contentType: contentType || 'caption',
        generatedText,
        platform: platform || product.platform,
      },
      include: {
        product: { select: { name: true } },
      },
    });

    // Record event (Layer 7 feedback loop)
    await prisma.event.create({
      data: {
        eventType: 'content_generated',
        entityId: aiContent.id,
        entityType: 'content',
        payload: JSON.stringify({ contentType, platform }),
      },
    });

    res.status(201).json(aiContent);
  } catch (error: any) {
    console.error('[AIContent] Generate error:', error.message);
    res.status(500).json({ error: 'Gagal membuat konten' });
  }
});

/**
 * POST /api/ai-content/generate-bulk
 * Generate content for multiple products at once
 */
router.post('/generate-bulk', async (req: Request, res: Response) => {
  try {
    const { productIds, userId, contentType, platform } = req.body;

    if (!productIds || !Array.isArray(productIds) || !userId) {
      return res.status(400).json({ error: 'productIds (array) dan userId wajib diisi' });
    }

    const results = [];

    for (const productId of productIds.slice(0, 10)) { // Max 10 at a time
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
      });

      if (!product) continue;

      const prompt = buildProductPrompt({
        name: product.name,
        price: Number(product.price),
        platform: platform || product.platform,
      });

      const generatedText = await generateContent(prompt);

      const aiContent = await prisma.aIContent.create({
        data: {
          productId: product.id,
          userId: parseInt(userId),
          contentType: contentType || 'caption',
          generatedText,
          platform: platform || product.platform,
        },
      });

      results.push(aiContent);
    }

    res.status(201).json({ generated: results.length, content: results });
  } catch (error: any) {
    console.error('[AIContent] Bulk generate error:', error.message);
    res.status(500).json({ error: 'Gagal membuat konten massal' });
  }
});

export default router;
