import prisma from '../lib/prisma';

/**
 * Content Pattern Engine (Layer 4)
 * 
 * Analyzes content performance data to discover winning patterns.
 * Identifies which hooks, content types, and strategies perform best
 * for specific categories and platforms.
 */

interface PatternDiscovery {
  categoryId: number;
  platform: string;
  hookTemplate: string;
  avgCtr: number;
  avgConversion: number;
  sampleSize: number;
  confidence: number;
}

/**
 * Analyze content assets to discover winning patterns
 */
export async function discoverPatterns(): Promise<PatternDiscovery[]> {
  // Get all content assets with performance data
  const assets = await prisma.contentAsset.findMany({
    include: {
      product: true,
      performance: { orderBy: { recordedAt: 'desc' }, take: 1 },
      contentConversions: { orderBy: { recordedAt: 'desc' }, take: 1 },
    },
  });

  // Group by category + platform + hook
  const groups = new Map<string, {
    ctrs: number[];
    conversions: number[];
    hook: string;
    categoryId: number;
    platform: string;
  }>();

  for (const asset of assets) {
    if (!asset.hook || !asset.product.categoryId) continue;

    const perf = asset.performance[0];
    if (!perf) continue;

    const key = `${asset.product.categoryId}|${asset.contentType}|${asset.hook}`;

    if (!groups.has(key)) {
      groups.set(key, {
        ctrs: [],
        conversions: [],
        hook: asset.hook,
        categoryId: asset.product.categoryId,
        platform: asset.contentType,
      });
    }

    const group = groups.get(key)!;
    group.ctrs.push(perf.ctr);
    group.conversions.push(perf.conversionRate);
  }

  // Calculate averages and confidence
  const patterns: PatternDiscovery[] = [];

  for (const [, group] of groups) {
    const sampleSize = group.ctrs.length;
    const avgCtr = group.ctrs.reduce((a, b) => a + b, 0) / sampleSize;
    const avgConversion = group.conversions.reduce((a, b) => a + b, 0) / sampleSize;

    // Confidence increases with sample size (log scale)
    const confidence = Math.min(Math.log10(sampleSize + 1) / 2, 1);

    patterns.push({
      categoryId: group.categoryId,
      platform: group.platform,
      hookTemplate: group.hook,
      avgCtr: Math.round(avgCtr * 100) / 100,
      avgConversion: Math.round(avgConversion * 100) / 100,
      sampleSize,
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  // Sort by CTR descending
  patterns.sort((a, b) => b.avgCtr - a.avgCtr);

  return patterns;
}

/**
 * Store discovered patterns in the database
 */
export async function storePatterns(patterns: PatternDiscovery[]): Promise<number> {
  let stored = 0;

  for (const pattern of patterns) {
    await prisma.contentPattern.upsert({
      where: {
        categoryId_platform_hookTemplate: {
          categoryId: pattern.categoryId,
          platform: pattern.platform,
          hookTemplate: pattern.hookTemplate,
        },
      },
      update: {
        avgCtr: pattern.avgCtr,
        avgConversion: pattern.avgConversion,
        sampleSize: pattern.sampleSize,
        confidence: pattern.confidence,
      },
      create: {
        categoryId: pattern.categoryId,
        platform: pattern.platform,
        hookTemplate: pattern.hookTemplate,
        avgCtr: pattern.avgCtr,
        avgConversion: pattern.avgConversion,
        sampleSize: pattern.sampleSize,
        confidence: pattern.confidence,
      },
    });
    stored++;
  }

  return stored;
}

/**
 * Get best hooks for a category and platform
 */
export async function getBestHooks(categoryId: number, platform?: string, limit = 5) {
  return prisma.contentPattern.findMany({
    where: {
      categoryId,
      ...(platform ? { platform } : {}),
    },
    orderBy: { avgCtr: 'desc' },
    take: limit,
  });
}
