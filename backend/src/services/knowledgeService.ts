import prisma from "../lib/prisma";

/**
 * Build atau update Knowledge Graph untuk sebuah produk.
 * Relasi: Product → Audience → Channel → Conversion
 */
export async function buildProductGraph(productId: number): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      orders: { take: 500 },
      affiliateLinks: true,
      contentAssets: {
        include: { contentConversions: true },
      },
    },
  });

  if (!product) return;

  // Analisis audience dari target produk
  if (product.targetAudience) {
    try {
      const audienceData = JSON.parse(product.targetAudience as string);
      const segmentKey = `${audienceData.gender || "all"}_${audienceData.ageRange || "all"}_${product.categoryId}`;

      const audience = await prisma.audience.upsert({
        where: { segment: segmentKey },
        update: {},
        create: {
          segment:  segmentKey,
          gender:   audienceData.gender,
          ageMin:   audienceData.ageMin,
          ageMax:   audienceData.ageMax,
          interest: audienceData.interest,
        },
      });

      // Buat relasi Product → Audience
      await prisma.knowledgeRelation.upsert({
        where: {
          id: (
            await prisma.knowledgeRelation.findFirst({
              where: { productId, audienceId: audience.id, relationType: "product_to_audience" },
            })
          )?.id ?? -1,
        },
        update: { weight: calculateAudienceWeight(product) },
        create: {
          productId,
          audienceId:   audience.id,
          relationType: "product_to_audience",
          weight:       calculateAudienceWeight(product),
        },
      });
    } catch {}
  }
}

function calculateAudienceWeight(product: any): number {
  const totalOrders = product.orders?.length ?? 0;
  return Math.min(1.0, totalOrders / 100);
}

/**
 * Ambil graph relasi untuk sebuah produk.
 */
export async function getProductGraph(productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      graphRelations: {
        include: {
          audience:  true,
          creator:   true,
        },
      },
      insights: true,
    },
  });

  if (!product) return null;

  // Format sebagai nodes + edges untuk visualisasi
  const nodes: any[] = [
    { id: `product_${productId}`, label: product.name, type: "product" },
  ];
  const edges: any[] = [];

  if (product.category) {
    nodes.push({ id: `cat_${product.categoryId}`, label: product.category.name, type: "category" });
    edges.push({ from: `product_${productId}`, to: `cat_${product.categoryId}`, label: "kategori" });
  }

  for (const rel of product.graphRelations) {
    if (rel.audience) {
      const nodeId = `audience_${rel.audienceId}`;
      if (!nodes.find((n) => n.id === nodeId)) {
        nodes.push({ id: nodeId, label: rel.audience.segment, type: "audience" });
      }
      edges.push({ from: `product_${productId}`, to: nodeId, weight: rel.weight, label: "target" });
    }
    if (rel.creator) {
      const nodeId = `creator_${rel.creatorId}`;
      if (!nodes.find((n) => n.id === nodeId)) {
        nodes.push({ id: nodeId, label: rel.creator.name, type: "creator" });
      }
      edges.push({ from: nodeId, to: `product_${productId}`, weight: rel.weight, label: "promosi" });
    }
  }

  return { nodes, edges, insights: product.insights };
}

/**
 * Update insight produk (best audience, channel, timing).
 */
export async function updateProductInsight(
  productId: number,
  insightType: string,
  key: string,
  value: string,
  confidence: number,
  sampleSize: number
) {
  return prisma.productInsight.upsert({
    where: { productId_insightType_key: { productId, insightType, key } },
    update: { value, confidence, sampleSize },
    create: { productId, insightType, key, value, confidence, sampleSize },
  });
}
