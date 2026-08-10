import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/billing/plans
 * List all billing plans
 */
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.billingPlan.findMany({
      orderBy: { price: 'asc' },
    });

    res.json({
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        price: Number(p.price),
        features: JSON.parse(p.features),
      })),
    });
  } catch (error: any) {
    console.error('[Billing] Error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil paket' });
  }
});

/**
 * GET /api/billing/subscription
 * Get current user's subscription
 */
router.get('/subscription', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: {
        plan: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    if (!subscription) {
      return res.json({ subscription: null, message: 'Tidak ada langganan aktif' });
    }

    res.json({
      subscription: {
        id: subscription.id,
        plan: {
          name: subscription.plan.name,
          displayName: subscription.plan.displayName,
          price: Number(subscription.plan.price),
          features: JSON.parse(subscription.plan.features),
        },
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        user: subscription.user,
      },
    });
  } catch (error: any) {
    console.error('[Billing] Subscription error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil langganan' });
  }
});

/**
 * POST /api/billing/subscribe
 * Subscribe a user to a plan
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'userId dan planId wajib diisi' });
    }

    // Cancel existing active subscriptions
    await prisma.subscription.updateMany({
      where: { userId: parseInt(userId), status: 'active' },
      data: { status: 'cancelled', endDate: new Date() },
    });

    // Create new subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const subscription = await prisma.subscription.create({
      data: {
        userId: parseInt(userId),
        planId: parseInt(planId),
        endDate,
      },
      include: { plan: true },
    });

    // Update user plan
    const plan = await prisma.billingPlan.findUnique({ where: { id: parseInt(planId) } });
    if (plan) {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { plan: plan.name },
      });
    }

    res.status(201).json({
      message: 'Langganan berhasil dibuat',
      subscription: {
        id: subscription.id,
        plan: subscription.plan.displayName,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    console.error('[Billing] Subscribe error:', error.message);
    res.status(500).json({ error: 'Gagal membuat langganan' });
  }
});

/**
 * POST /api/billing/cancel
 * Cancel a subscription
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId wajib diisi' });
    }

    const subscription = await prisma.subscription.update({
      where: { id: parseInt(subscriptionId) },
      data: { status: 'cancelled', endDate: new Date() },
    });

    res.json({ message: 'Langganan dibatalkan', subscription });
  } catch (error: any) {
    console.error('[Billing] Cancel error:', error.message);
    res.status(500).json({ error: 'Gagal membatalkan langganan' });
  }
});

export default router;
