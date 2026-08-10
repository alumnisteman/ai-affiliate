import prisma from '../lib/prisma';

/**
 * Commission Prediction Engine
 * 
 * Uses historical data to predict commission for a given product
 * over a time period based on views, CTR, and commission rate.
 * 
 * Output: minimum, expected, and optimistic commission estimates.
 */

interface PredictionInput {
  productId: number;
  views: number;        // expected views
  ctr: number;          // click-through rate as decimal (e.g. 0.05 = 5%)
  commissionRate: number; // product commission rate
  price: number;        // product price
  conversionRate: number; // historical conversion rate
}

interface PredictionOutput {
  minimum: number;
  expected: number;
  optimistic: number;
  period: string;
}

// Confidence multipliers based on data availability
const MINIMUM_FACTOR = 0.45;    // pessimistic scenario
const EXPECTED_FACTOR = 1.0;    // baseline
const OPTIMISTIC_FACTOR = 1.85; // best-case scenario

export function predictCommission(input: PredictionInput): PredictionOutput {
  const { views, ctr, commissionRate, price, conversionRate } = input;

  // Base calculation: views * CTR * conversion * price * commission
  const expectedClicks = views * ctr;
  const expectedOrders = expectedClicks * conversionRate;
  const expectedCommission = expectedOrders * Number(price) * commissionRate;

  return {
    minimum: Math.round(expectedCommission * MINIMUM_FACTOR),
    expected: Math.round(expectedCommission * EXPECTED_FACTOR),
    optimistic: Math.round(expectedCommission * OPTIMISTIC_FACTOR),
    period: '7d',
  };
}

/**
 * Calculate and store commission prediction for a product
 */
export async function calculatePrediction(productId: number, inputViews = 10000) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      affiliateMetrics: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
    },
  });

  if (!product) throw new Error(`Product ${productId} not found`);

  const metric = product.affiliateMetrics[0];
  const ctr = metric ? (metric.totalClicks > 0 ? metric.conversionRate * 0.5 : 0.03) : 0.03;
  const conversionRate = metric?.conversionRate || 0.025;

  const prediction = predictCommission({
    productId: product.id,
    views: inputViews,
    ctr,
    commissionRate: product.commissionRate,
    price: Number(product.price),
    conversionRate,
  });

  return prisma.commissionPrediction.create({
    data: {
      productId: product.id,
      inputViews,
      inputCtr: ctr,
      minimumComm: prediction.minimum,
      expectedComm: prediction.expected,
      optimisticComm: prediction.optimistic,
      period: prediction.period,
    },
  });
}

/**
 * Get latest prediction for a product
 */
export async function getLatestPrediction(productId: number) {
  return prisma.commissionPrediction.findFirst({
    where: { productId },
    orderBy: { calculatedAt: 'desc' },
    include: { product: true },
  });
}
