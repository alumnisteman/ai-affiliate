import prisma from '../lib/prisma';
import { generateContent, buildRecommendationPrompt } from '../utils/gemini';
import { getBestHooks } from './content-patterns';
import { getLatestPrediction } from './commission-prediction';

/**
 * AI Recommendation Engine (Layer 5)
 * 
 * When a user selects a product, the system provides:
 * - Opportunity Score
 * - Target Audience
 * - Best Platform
 * - Best Hook (from winning patterns)
 * - Expected CTR & Conversion
 * - Estimated Commission
 */

export interface ProductRecommendation {
  productId: number;
  productName: string;
  opportunityScore: number;
  audience: string;
  platform: string;
  bestHook: string;
  expectedCtr: number;
  expectedConversion: number;
  estimatedCommission: {
    minimum: number;
    expected: number;
    optimistic: number;
    period: string;
  };
  aiInsights: string;
}

/**
 * Generate a full AI recommendation for a product
 */
export async function getProductRecommendation(productId: number): Promise<ProductRecommendation> {
  // Fetch product with all related data
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      opportunityScores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      affiliateMetrics: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      category: { select: { name: true } }
    },
  });

  if (!product) throw new Error(`Product ${productId} not found`);

  // Get opportunity score
  const oppScore = product.opportunityScores[0]?.score || 0;

  // Get best hooks for this category
  const hooks = await getBestHooks(product.categoryId || 1, product.platform);
  const bestHook = hooks[0]?.hookTemplate || 'Jangan beli sebelum lihat ini';
  const expectedCtr = hooks[0]?.avgCtr || 5.0;
  const expectedConversion = hooks[0]?.avgConversion || 3.0;

  // Get commission prediction
  const prediction = await getLatestPrediction(productId);
  const estimatedCommission = prediction
    ? {
        minimum: Number(prediction.minimumComm),
        expected: Number(prediction.expectedComm),
        optimistic: Number(prediction.optimisticComm),
        period: prediction.period,
      }
    : { minimum: 0, expected: 0, optimistic: 0, period: '7d' };

  // Determine audience from category
  const audience = getAudienceForCategory(product.category?.name || 'umum');
  const platform = product.platform || 'tiktok';

  // Generate AI insights
  const aiPrompt = buildRecommendationPrompt({
    name: product.name,
    category: product.category?.name || undefined,
    opportunityScore: oppScore,
    bestHook,
    expectedCtr,
  });

  const aiInsights = await generateContent(aiPrompt);

  return {
    productId: product.id,
    productName: product.name,
    opportunityScore: oppScore,
    audience,
    platform,
    bestHook,
    expectedCtr,
    expectedConversion,
    estimatedCommission,
    aiInsights,
  };
}

function getAudienceForCategory(category: string): string {
  const audienceMap: Record<string, string> = {
    skincare: 'Wanita 18-35 tahun, minat kecantikan & self-care',
    fashion: 'Wanita & Pria 18-30 tahun, fashion-conscious',
    electronics: 'Pria 20-40 tahun, tech enthusiast',
    food: 'Semua gender 20-45 tahun, pecinta kuliner',
    health: 'Wanita & Pria 25-50 tahun, health-conscious',
    baby: 'Wanita 25-40 tahun, ibu muda',
    home: 'Wanita & Pria 25-45 tahun, homeowner',
    sports: 'Pria 18-35 tahun, fitness enthusiast',
  };

  return audienceMap[category.toLowerCase()] || 'Semua gender 18-45 tahun';
}
