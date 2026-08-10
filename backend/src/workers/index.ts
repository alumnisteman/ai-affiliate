/**
 * Worker entrypoint — menjalankan semua consumer queue RabbitMQ
 * dan cron job harian untuk intelligence engines.
 *
 * Dijalankan sebagai service terpisah di Docker Compose.
 */
import dotenv from 'dotenv';
dotenv.config();

import { consume, QUEUES } from '../lib/queue';
import { runViralEngine }       from '../services/viralEngine';
import { evaluateAndSave }      from '../services/coachEngine';
import { analyzeContentDNA }    from '../services/contentDNAEngine';
import { buildProductGraph }    from '../services/knowledgeService';
import { runAgentPlan }         from '../services/agentOrchestrator';
import { recordDailyRevenue }   from '../services/revenueService';
import { calculateOpportunityScore } from '../services/opportunityService';
import prisma from '../lib/prisma';

// ── Cron-like daily job (02:00 UTC) ──────────────────────────────────────────
function scheduleDailyAt(hour: number, minute: number, job: () => Promise<void>) {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(hour, minute, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

  const delay = next.getTime() - now.getTime();
  console.log(`[Cron] Job dijadwalkan pukul ${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')} UTC (${Math.round(delay/60000)} menit lagi)`);

  setTimeout(async () => {
    while (true) {
      try {
        console.log(`[Cron] Menjalankan daily job...`);
        await job();
      } catch (err) {
        console.error('[Cron] Job gagal:', err);
      }
      // Tunggu 24 jam
      await new Promise(r => setTimeout(r, 24 * 60 * 60 * 1000));
    }
  }, delay);
}

// ── Daily Intelligence Job ────────────────────────────────────────────────────
async function runDailyIntelligence() {
  console.log('[Daily] === Memulai daily intelligence run ===');

  // 1. Jalankan Viral Engine untuk semua produk
  await runViralEngine();

  // 2. Hitung Opportunity Score untuk semua produk
  const products = await prisma.product.findMany({ select: { id: true } });
  for (const p of products) {
    try { await calculateOpportunityScore(p.id); } catch {}
  }
  console.log(`[Daily] Opportunity scores dihitung untuk ${products.length} produk`);

  // 3. Rekam daily revenue untuk semua user
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    try { await recordDailyRevenue(u.id); } catch {}
  }
  console.log(`[Daily] Revenue snapshots dicatat untuk ${users.length} user`);

  // 4. Rebuild knowledge graph untuk produk dengan skor tinggi
  const topProducts = await prisma.opportunityScore.findMany({
    where: { score: { gte: 70 } },
    orderBy: { score: 'desc' },
    take: 20,
    select: { productId: true },
  });
  for (const { productId } of topProducts) {
    try { await buildProductGraph(productId); } catch {}
  }
  console.log(`[Daily] Knowledge graph diperbarui untuk ${topProducts.length} produk top`);

  console.log('[Daily] === Daily intelligence selesai ===');
}

// ── Queue Consumers ───────────────────────────────────────────────────────────
async function startWorkers() {
  console.log('🔧 Memulai worker consumers...');

  // Viral engine worker
  await consume(QUEUES.VIRAL, async (_payload) => {
    await runViralEngine();
  });

  // Coach worker — evaluasi ContentAsset dari queue
  await consume(QUEUES.COACH, async (payload: { contentAssetId: number }) => {
    await evaluateAndSave(payload.contentAssetId);
  });

  // Content DNA worker
  await consume(QUEUES.CONTENT_DNA, async (payload: { categoryId: number; platform: string }) => {
    await analyzeContentDNA(payload.categoryId, payload.platform);
  });

  // Competitor worker — placeholder (Sprint 5)
  await consume(QUEUES.COMPETITOR, async (payload: { platform: string; handle: string }) => {
    console.log(`[Competitor Worker] Analisis ${payload.handle} di ${payload.platform}`);
  });

  // Agent worker
  await consume(QUEUES.AGENT, async (payload: { userId: number; goal: string }) => {
    await runAgentPlan(payload.userId, payload.goal);
  });

  // Learning / Flywheel worker
  await consume(QUEUES.LEARNING, async (payload) => {
    console.log('[Learning Worker] Event diterima:', payload.eventType);
    // Sprint 9: implementasi flywheel learning loop
  });

  // Score worker
  await consume(QUEUES.SCORE, async (payload: { productId: number }) => {
    await calculateOpportunityScore(payload.productId);
  });

  console.log('✅ Semua worker consumers aktif');

  // Schedule daily job pukul 02:00 UTC
  scheduleDailyAt(2, 0, runDailyIntelligence);
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
async function shutdown() {
  console.log('\n🛑 Mematikan worker...');
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

// ── Start ─────────────────────────────────────────────────────────────────────
startWorkers().catch((err) => {
  console.error('❌ Gagal memulai workers:', err);
  process.exit(1);
});
