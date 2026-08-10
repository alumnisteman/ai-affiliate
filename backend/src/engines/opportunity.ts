import prisma from '../lib/prisma';

/**
 * Opportunity Score Engine
 * 
 * Score = 30% Sales Growth + 25% Commission Value + 20% Conversion Rate
 *       + 15% Review Velocity + 10% Competition Index
 * 
 * Each component is normalized to 0-100 before weighting.
 */

interface OpportunityInput {
  salesGrowth: number;     // percentage growth
  commissionValue: number; // absolute commission potential (price * rate)
  conversionRate: number;  // percentage
  reviewVelocity: number;  // new reviews per day
  competitionIndex: number; // lower = better (inverse scored)
}

const WEIGHTS = {
  salesGrowth: 0.30,
  commissionValue: 0.25,
  conversionRate: 0.20,
  reviewVelocity: 0.15,
  competitionIndex: 0.10,
};

// Normalisation ceilings
const MAX_SALES_GROWTH = 100;     // 100% growth = max score
const MAX_COMMISSION = 50000;     // Rp 50k commission = max
const MAX_CONVERSION = 10;        // 10% conversion = max
const MAX_REVIEW_VELOCITY = 100;  // 100 reviews/day = max
const MAX_COMPETITION = 100;      // lower is better

function normalize(value: number, max: number, inverse = false): number {
  const clamped = Math.min(Math.max(value, 0), max);
  const score = (clamped / max) * 100;
  return inverse ? 100 - score : score;
}

export function calculateOpportunityScore(input: OpportunityInput): {
  score: number;
  salesGrowthScore: number;
  commissionScore: number;
  conversionScore: number;
  reviewVelocity: number;
  competitionIndex: number;
} {
  const salesGrowthScore = normalize(input.salesGrowth, MAX_SALES_GROWTH);
  const commissionScore = normalize(input.commissionValue, MAX_COMMISSION);
  const conversionScore = normalize(input.conversionRate, MAX_CONVERSION);
  const reviewVelocityScore = normalize(input.reviewVelocity, MAX_REVIEW_VELOCITY);
  const competitionScore = normalize(input.competitionIndex, MAX_COMPETITION, true);

  const score = Math.round(
    salesGrowthScore * WEIGHTS.salesGrowth +
    commissionScore * WEIGHTS.commissionValue +
    conversionScore * WEIGHTS.conversionRate +
    reviewVelocityScore * WEIGHTS.reviewVelocity +
    competitionScore * WEIGHTS.competitionIndex
  );

  return {
    score: Math.min(score, 100),
    salesGrowthScore: Math.round(salesGrowthScore),
    commissionScore: Math.round(commissionScore),
    conversionScore: Math.round(conversionScore),
    reviewVelocity: Math.round(reviewVelocityScore),
    competitionIndex: Math.round(competitionScore),
  };
}

/**
 * Calculate and store opportunity scores for all products
 */
export async function recalculateAllScores(): Promise<number> {
  const products = await prisma.product.findMany({
    include: {
      snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
      affiliateMetrics: { orderBy: { calculatedAt: 'desc' }, take: 1 },
    },
  });

  let count = 0;
  for (const product of products) {
    const snapshot = product.snapshots[0];
    const metric = product.affiliateMetrics[0];

    const input: OpportunityInput = {
      salesGrowth: snapshot?.salesGrowth || 0,
      commissionValue: Number(product.price) * product.commissionRate,
      conversionRate: metric?.conversionRate || 0,
      reviewVelocity: snapshot ? snapshot.reviews / 7 : 0,
      competitionIndex: 50, // default mid-range; would come from market analysis
    };

    const result = calculateOpportunityScore(input);

    await prisma.opportunityScore.create({
      data: {
        productId: product.id,
        score: result.score,
        salesGrowthScore: result.salesGrowthScore,
        commissionScore: result.commissionScore,
        conversionScore: result.conversionScore,
        reviewVelocity: result.reviewVelocity,
        competitionIndex: result.competitionIndex,
      },
    });

    count++;
  }

  return count;
}

/**
 * Get top products by opportunity score
 */
export async function getTopOpportunities(limit = 10) {
  return prisma.opportunityScore.findMany({
    orderBy: { score: 'desc' },
    take: limit,
    distinct: ['productId'],
    include: {
      product: true,
    },
  });
}
