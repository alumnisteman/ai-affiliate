import prisma from "../lib/prisma";
import { nanoid } from "nanoid";

const SERVER_IP = process.env.SERVER_IP || "192.168.1.13";

/**
 * Buat shortlink baru.
 */
export async function createShortLink(params: {
  targetUrl: string;
  productId?: number;
  userId?: number;
  campaignId?: string;
}): Promise<{ shortId: string; shortUrl: string }> {
  const shortId = nanoid(8);

  await prisma.shortLink.create({
    data: {
      shortId,
      targetUrl:  params.targetUrl,
      productId:  params.productId,
      userId:     params.userId,
      campaignId: params.campaignId,
    },
  });

  return {
    shortId,
    shortUrl: `http://${SERVER_IP}/t/${shortId}`,
  };
}

/**
 * Resolve shortlink dan catat klik (dengan GDPR anonymization).
 */
export async function resolveShortLink(
  shortId: string,
  meta: { ip?: string; userAgent?: string; referer?: string; country?: string }
): Promise<string | null> {
  const link = await prisma.shortLink.findUnique({ where: { shortId } });
  if (!link) return null;

  // Anonymize IP (simpan hanya subnet) — GDPR compliance
  const anonymizedIp = meta.ip ? meta.ip.replace(/\.\d+$/, ".0") : undefined;

  // Catat klik
  await prisma.shortLinkClick.create({
    data: {
      shortLinkId: link.id,
      ip:          anonymizedIp,
      userAgent:   meta.userAgent,
      referer:     meta.referer,
      country:     meta.country,
    },
  });

  // Update total klik
  await prisma.shortLink.update({
    where: { id: link.id },
    data:  { totalClicks: { increment: 1 } },
  });

  // Catat event di Flywheel
  await prisma.event.create({
    data: {
      eventType:  "click",
      entityId:   link.id,
      entityType: "shortlink",
      userId:     link.userId ?? undefined,
      payload:    JSON.stringify({ shortId, productId: link.productId }),
    },
  });

  return link.targetUrl;
}

/**
 * Statistik klik shortlink per user.
 */
export async function getShortLinkStats(userId: number) {
  return prisma.shortLink.findMany({
    where: { userId },
    orderBy: { totalClicks: "desc" },
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
      _count: { select: { clicks: true } },
    },
  });
}
