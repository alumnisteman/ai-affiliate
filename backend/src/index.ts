import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import { resolveShortLink } from './services/shortlinkService';

// ── Existing Routes ──────────────────────────────────────────────────────────
import dashboardRoutes      from './routes/dashboard';
import productsRoutes       from './routes/products';
import affiliateLinksRoutes from './routes/affiliate-links';
import aiContentRoutes      from './routes/ai-content';
import analyticsRoutes      from './routes/analytics';
import whatsappRoutes       from './routes/whatsapp';
import billingRoutes        from './routes/billing';

// ── New Intelligence Routes ───────────────────────────────────────────────────
import viralRoutes          from './routes/viral';
import knowledgeRoutes      from './routes/knowledge';
import coachRoutes          from './routes/coach';
import contentDNARoutes     from './routes/contentDNA';
import agentRoutes          from './routes/agent';
import revenueRoutes        from './routes/revenue';
import personalizationRoutes from './routes/personalization';
import shortlinkRoutes      from './routes/shortlink';
import marketplaceRoutes    from './routes/marketplace';
import competitorRoutes     from './routes/competitor';

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ── Shortlink Redirect (public, no /api prefix) ───────────────────────────────
app.get('/t/:shortId', async (req, res) => {
  try {
    const targetUrl = await resolveShortLink(req.params.shortId, {
      ip:        req.ip,
      userAgent: req.headers['user-agent'],
      referer:   req.headers['referer'],
    });
    if (!targetUrl) return res.status(404).send('Link tidak ditemukan');
    res.redirect(302, targetUrl);
  } catch (err) {
    res.status(500).send('Terjadi kesalahan');
  }
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status:    'sehat',
      timestamp: new Date().toISOString(),
      database:  'terhubung',
      versi:     '1.0.0',
      engines: [
        'opportunity', 'viral', 'knowledge', 'coach',
        'contentDNA', 'agent', 'revenue', 'personalization',
        'shortlink', 'marketplace', 'competitor',
      ],
    });
  } catch {
    res.status(503).json({ status: 'tidak_sehat', database: 'terputus' });
  }
});

// ── Existing API Routes ───────────────────────────────────────────────────────
app.use('/api/dashboard',       dashboardRoutes);
app.use('/api/products',        productsRoutes);
app.use('/api/affiliate-links', affiliateLinksRoutes);
app.use('/api/ai-content',      aiContentRoutes);
app.use('/api/analytics',       analyticsRoutes);
app.use('/api/whatsapp',        whatsappRoutes);
app.use('/api/billing',         billingRoutes);

// ── Intelligence Platform Routes ─────────────────────────────────────────────
app.use('/api/viral',           viralRoutes);
app.use('/api/knowledge',       knowledgeRoutes);
app.use('/api/coach',           coachRoutes);
app.use('/api/content',         contentDNARoutes);
app.use('/api/agent',           agentRoutes);
app.use('/api/revenue',         revenueRoutes);
app.use('/api/personalize',     personalizationRoutes);
app.use('/api/shortlink',       shortlinkRoutes);
app.use('/api/marketplace',     marketplaceRoutes);
app.use('/api/competitor',      competitorRoutes);

// ── 404 & Error Handler ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Halaman tidak ditemukan' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan internal' : err.message,
  });
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
async function shutdown() {
  console.log('\n🛑 Mematikan server...');
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   🚀 AI Affiliate Intelligence OS — API v1.0.0       ║
║══════════════════════════════════════════════════════║
║  Port:       ${String(PORT).padEnd(37)}║
║  Lingkungan: ${String(process.env.NODE_ENV || 'development').padEnd(37)}║
║  Kesehatan:  http://localhost:${PORT}/api/health        ║
║  Engines:    11 intelligence engines aktif            ║
║  Status:     ✅ Platform berjalan                      ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
