import { chat, chatJSON } from "../lib/aiClient";
import prisma from "../lib/prisma";
import { getTopOpportunities } from "./opportunityService";
import { nanoid } from "nanoid";

interface AgentScript {
  tiktokHook:    string;
  tiktokScript:  string;
  reelsOpening:  string;
  reelsDemonstration: string;
  reelsClosing:  string;
  waMessage1:    string;
  waMessage2:    string;
  waMessage3:    string;
  caption:       string;
}

const SYSTEM_PROMPT = `Kamu adalah AI Affiliate Agent Indonesia. 
Kamu membantu affiliator menemukan peluang terbaik, memahami produk secara mendalam, dan membuat konten yang menghasilkan penjualan.
Selalu berikan output yang actionable, konkrit, dan dalam bahasa Indonesia yang engaging.`;

/**
 * Jalankan AI Agent: cari peluang → pilih top produk → buat script.
 */
export async function runAgentPlan(userId: number, goal: string): Promise<{
  planId: number;
  products: any[];
  scripts: AgentScript[];
}> {
  // Buat plan record
  const plan = await prisma.agentPlan.create({
    data: { userId, goal, status: "running" },
  });

  try {
    // Step 1: Ambil top opportunities
    const opportunities = await getTopOpportunities(5);
    if (!opportunities.length) {
      await prisma.agentPlan.update({
        where: { id: plan.id },
        data: { status: "completed", result: JSON.stringify({ message: "Tidak ada peluang tersedia" }) },
      });
      return { planId: plan.id, products: [], scripts: [] };
    }

    const scripts: AgentScript[] = [];
    const planProducts: any[] = [];

    // Step 2: Generate script untuk setiap produk
    for (const opp of opportunities) {
      const product = opp.product;

      const scriptPrompt = `
Buat konten lengkap untuk produk affiliate berikut:

Nama: ${product.name}
Harga: Rp ${Number(product.price).toLocaleString("id")}
Komisi: ${(product.commissionRate * 100).toFixed(0)}%
Platform: ${product.platform}
Skor Peluang: ${opp.score.toFixed(0)}/100

Kembalikan JSON:
{
  "tiktokHook": "<hook 3 detik pertama>",
  "tiktokScript": "<full script TikTok 30-60 detik>",
  "reelsOpening": "<opening 5 detik>",
  "reelsDemonstration": "<demonstrasi produk>",
  "reelsClosing": "<penutup + CTA>",
  "waMessage1": "<pesan WA pertama - awareness>",
  "waMessage2": "<pesan WA kedua - follow up>",
  "waMessage3": "<pesan WA ketiga - closing>",
  "caption": "<caption marketplace SEO-friendly>"
}`;

      const script = await chatJSON<AgentScript>(SYSTEM_PROMPT, scriptPrompt);

      // Buat shortlink
      const shortId = nanoid(8);
      const shortLink = await prisma.shortLink.create({
        data: {
          shortId,
          targetUrl: `https://${product.platform}.com/product/${product.id}`,
          productId: product.id,
          userId,
          campaignId: `agent_plan_${plan.id}`,
        },
      });

      // Simpan sebagai AIContent
      await prisma.aIContent.create({
        data: {
          productId: product.id,
          userId,
          contentType: "tiktok_script",
          generatedText: JSON.stringify(script),
          platform: product.platform,
          promptVersion: "agent_v1",
        },
      });

      // Link ke plan
      await prisma.agentPlanProduct.create({
        data: {
          planId:     plan.id,
          productId:  product.id,
          scriptJson: JSON.stringify(script),
          shortLinkId: shortLink.id,
        },
      });

      scripts.push(script);
      planProducts.push({ ...product, script, shortId, score: opp.score });
    }

    // Update plan selesai
    await prisma.agentPlan.update({
      where: { id: plan.id },
      data: {
        status: "completed",
        result: JSON.stringify({ goal, products: planProducts.length }),
      },
    });

    return { planId: plan.id, products: planProducts, scripts };
  } catch (err) {
    await prisma.agentPlan.update({
      where: { id: plan.id },
      data: { status: "failed", result: String(err) },
    });
    throw err;
  }
}

/**
 * Ambil daftar plan milik user.
 */
export async function getUserPlans(userId: number) {
  return prisma.agentPlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      products: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });
}
