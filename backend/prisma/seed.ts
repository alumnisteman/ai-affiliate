import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AI Affiliate OS database...\n');

  // ─────────────────────────────────────────
  // 1. Users
  // ─────────────────────────────────────────
  console.log('👤 Creating users...');
  const user = await prisma.user.upsert({
    where: { email: 'demo@aiaffiliateos.com' },
    update: {},
    create: {
      email: 'demo@aiaffiliateos.com',
      name: 'Demo User',
      role: 'admin',
      plan: 'growth',
    },
  });

  // ─────────────────────────────────────────
  // 2. Billing Plans
  // ─────────────────────────────────────────
  console.log('💳 Creating billing plans...');
  const plans = [
    {
      name: 'basic',
      displayName: 'Basic',
      price: new Prisma.Decimal(0),
      features: JSON.stringify([
        'Produk trending',
        'AI caption generator',
        '10 link affiliate/bulan',
        'Dashboard dasar',
      ]),
    },
    {
      name: 'pro',
      displayName: 'Pro',
      price: new Prisma.Decimal(149000),
      features: JSON.stringify([
        'Semua fitur Basic',
        'Opportunity Score',
        'Product Intelligence',
        'Conversion Analytics',
        '100 link affiliate/bulan',
        'AI content generator tanpa batas',
      ]),
    },
    {
      name: 'growth',
      displayName: 'Growth',
      price: new Prisma.Decimal(349000),
      features: JSON.stringify([
        'Semua fitur Pro',
        'Commission Prediction',
        'Content Intelligence',
        'WhatsApp Automation',
        'Link affiliate tanpa batas',
        'Priority support',
      ]),
    },
    {
      name: 'elite',
      displayName: 'Elite',
      price: new Prisma.Decimal(799000),
      features: JSON.stringify([
        'Semua fitur Growth',
        'AI Recommendation Engine',
        'Viral Opportunity Alerts',
        'Team Workspace (5 anggota)',
        'API Access',
        'Dedicated account manager',
        'Custom integrations',
      ]),
    },
  ];

  for (const plan of plans) {
    await prisma.billingPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  // Subscribe demo user to Growth plan
  const growthPlan = await prisma.billingPlan.findUnique({ where: { name: 'growth' } });
  if (growthPlan) {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: growthPlan.id,
        endDate,
        status: 'active',
      },
    });
  }

  // ─────────────────────────────────────────
  // 3. Products (Layer 1)
  // ─────────────────────────────────────────
  console.log('📦 Creating products...');
  const productsData = [
    {
      externalId: 'SKU-SERUM-001',
      name: 'Serum Vitamin C Brightening 30ml',
      description: 'Serum wajah dengan vitamin C konsentrasi tinggi untuk mencerahkan kulit',
      price: new Prisma.Decimal(79000),
      commissionRate: 0.12,
      category: 'skincare',
      platform: 'tiktok',
      imageUrl: 'https://placehold.co/400x400/ff6b6b/white?text=Serum+C',
      rating: 4.8,
      reviews: 15420,
    },
    {
      externalId: 'SKU-BLENDER-002',
      name: 'Smart Blender Portable USB-C',
      description: 'Blender portable dengan baterai rechargeable, cocok untuk smoothie on-the-go',
      price: new Prisma.Decimal(189000),
      commissionRate: 0.10,
      category: 'electronics',
      platform: 'shopee',
      imageUrl: 'https://placehold.co/400x400/4ecdc4/white?text=Blender',
      rating: 4.6,
      reviews: 8750,
    },
    {
      externalId: 'SKU-HIJAB-003',
      name: 'Hijab Voal Premium Motif Batik',
      description: 'Hijab voal premium dengan motif batik modern, bahan lembut dan tidak mudah kusut',
      price: new Prisma.Decimal(45000),
      commissionRate: 0.15,
      category: 'fashion',
      platform: 'tiktok',
      imageUrl: 'https://placehold.co/400x400/a55eea/white?text=Hijab',
      rating: 4.9,
      reviews: 22100,
    },
    {
      externalId: 'SKU-SUPLEMEN-004',
      name: 'Whey Protein Isolate 1kg',
      description: 'Whey protein isolate rasa cokelat, 30g protein per serving',
      price: new Prisma.Decimal(425000),
      commissionRate: 0.08,
      category: 'health',
      platform: 'tokopedia',
      imageUrl: 'https://placehold.co/400x400/f7b731/white?text=Whey',
      rating: 4.7,
      reviews: 5230,
    },
    {
      externalId: 'SKU-EARBUDS-005',
      name: 'TWS Earbuds ANC Bluetooth 5.3',
      description: 'True wireless earbuds dengan Active Noise Cancellation dan bass boost',
      price: new Prisma.Decimal(159000),
      commissionRate: 0.11,
      category: 'electronics',
      platform: 'lazada',
      imageUrl: 'https://placehold.co/400x400/45aaf2/white?text=Earbuds',
      rating: 4.5,
      reviews: 11800,
    },
    {
      externalId: 'SKU-SKINCARE-006',
      name: 'Sunscreen SPF50+ Matte Finish',
      description: 'Sunscreen ringan dengan SPF50+ PA++++, tidak lengket dan matte finish',
      price: new Prisma.Decimal(65000),
      commissionRate: 0.13,
      category: 'skincare',
      platform: 'tiktok',
      imageUrl: 'https://placehold.co/400x400/fc5c65/white?text=SPF50',
      rating: 4.9,
      reviews: 31200,
    },
    {
      externalId: 'SKU-BABY-007',
      name: 'Stroller Lipat Ultra Compact',
      description: 'Stroller bayi lipat satu tangan, ringan dan compact untuk travelling',
      price: new Prisma.Decimal(750000),
      commissionRate: 0.07,
      category: 'baby',
      platform: 'shopee',
      imageUrl: 'https://placehold.co/400x400/26de81/white?text=Stroller',
      rating: 4.8,
      reviews: 3450,
    },
    {
      externalId: 'SKU-HOME-008',
      name: 'Air Purifier HEPA Filter',
      description: 'Air purifier dengan HEPA filter untuk ruangan 30m², hemat listrik',
      price: new Prisma.Decimal(550000),
      commissionRate: 0.09,
      category: 'home',
      platform: 'tokopedia',
      imageUrl: 'https://placehold.co/400x400/2bcbba/white?text=Air+Purifier',
      rating: 4.6,
      reviews: 6780,
    },
    {
      externalId: 'SKU-FASHION-009',
      name: 'Kaos Oversized Streetwear Premium',
      description: 'Kaos oversized bahan cotton combed 30s, desain streetwear eksklusif',
      price: new Prisma.Decimal(89000),
      commissionRate: 0.14,
      category: 'fashion',
      platform: 'tiktok',
      imageUrl: 'https://placehold.co/400x400/fd9644/white?text=Kaos',
      rating: 4.7,
      reviews: 18900,
    },
    {
      externalId: 'SKU-FOOD-010',
      name: 'Sambal Matah Premium Jar 250g',
      description: 'Sambal matah asli Bali, kemasan jar premium, tanpa pengawet',
      price: new Prisma.Decimal(35000),
      commissionRate: 0.18,
      category: 'food',
      platform: 'shopee',
      imageUrl: 'https://placehold.co/400x400/eb3b5a/white?text=Sambal',
      rating: 4.9,
      reviews: 42500,
    },
  ];

  const products = [];
  for (const p of productsData) {
    const { category, ...productData } = p;
    const product = await prisma.product.upsert({
      where: { externalId: p.externalId },
      update: {
        ...productData,
        category: { connectOrCreate: { where: { slug: category }, create: { name: category, slug: category } } }
      },
      create: {
        ...productData,
        category: { connectOrCreate: { where: { slug: category }, create: { name: category, slug: category } } }
      },
    });
    products.push(product);
  }

  // ─────────────────────────────────────────
  // 4. Product Snapshots (Layer 1)
  // ─────────────────────────────────────────
  console.log('📸 Creating product snapshots...');
  const snapshotData = [
    { idx: 0, sales7d: 2400, salesGrowth: 32, rating: 4.8, reviews: 15420 },
    { idx: 1, sales7d: 1800, salesGrowth: 18, rating: 4.6, reviews: 8750 },
    { idx: 2, sales7d: 5200, salesGrowth: 45, rating: 4.9, reviews: 22100 },
    { idx: 3, sales7d: 890, salesGrowth: 12, rating: 4.7, reviews: 5230 },
    { idx: 4, sales7d: 3100, salesGrowth: 28, rating: 4.5, reviews: 11800 },
    { idx: 5, sales7d: 6700, salesGrowth: 52, rating: 4.9, reviews: 31200 },
    { idx: 6, sales7d: 420, salesGrowth: 8, rating: 4.8, reviews: 3450 },
    { idx: 7, sales7d: 650, salesGrowth: 15, rating: 4.6, reviews: 6780 },
    { idx: 8, sales7d: 4100, salesGrowth: 38, rating: 4.7, reviews: 18900 },
    { idx: 9, sales7d: 8200, salesGrowth: 65, rating: 4.9, reviews: 42500 },
  ];

  for (const s of snapshotData) {
    await prisma.productSnapshot.create({
      data: {
        productId: products[s.idx].id,
        price: products[s.idx].price,
        sales7d: s.sales7d,
        salesGrowth: s.salesGrowth,
        rating: s.rating,
        reviews: s.reviews,
      },
    });
  }

  // ─────────────────────────────────────────
  // 5. Product Trends (Layer 1)
  // ─────────────────────────────────────────
  console.log('📈 Creating product trends...');
  const trendTypes = ['rising', 'viral', 'stable', 'rising', 'rising', 'viral', 'stable', 'rising', 'rising', 'viral'];
  const momenta = [72, 45, 15, 38, 55, 88, 12, 30, 65, 95];

  for (let i = 0; i < products.length; i++) {
    await prisma.productTrend.create({
      data: {
        productId: products[i].id,
        trendType: trendTypes[i],
        momentum: momenta[i],
        period: '7d',
      },
    });
  }

  // ─────────────────────────────────────────
  // 6. Product Affiliate Metrics (Layer 1)
  // ─────────────────────────────────────────
  console.log('📊 Creating affiliate metrics...');
  const metricsData = [
    { clicks: 4300, conv: 125, commission: 2100000, convRate: 2.9, avgOv: 79000 },
    { clicks: 2800, conv: 95, commission: 1800000, convRate: 3.4, avgOv: 189000 },
    { clicks: 8500, conv: 340, commission: 2300000, convRate: 4.0, avgOv: 45000 },
    { clicks: 1200, conv: 42, commission: 1420000, convRate: 3.5, avgOv: 425000 },
    { clicks: 5400, conv: 180, commission: 3140000, convRate: 3.3, avgOv: 159000 },
    { clicks: 9200, conv: 410, commission: 3470000, convRate: 4.5, avgOv: 65000 },
    { clicks: 650, conv: 18, commission: 945000, convRate: 2.8, avgOv: 750000 },
    { clicks: 980, conv: 35, commission: 1730000, convRate: 3.6, avgOv: 550000 },
    { clicks: 6100, conv: 250, commission: 3120000, convRate: 4.1, avgOv: 89000 },
    { clicks: 12000, conv: 520, commission: 3280000, convRate: 4.3, avgOv: 35000 },
  ];

  for (let i = 0; i < products.length; i++) {
    await prisma.productAffiliateMetric.create({
      data: {
        productId: products[i].id,
        totalClicks: metricsData[i].clicks,
        totalConversions: metricsData[i].conv,
        totalCommission: new Prisma.Decimal(metricsData[i].commission),
        conversionRate: metricsData[i].convRate,
        avgOrderValue: new Prisma.Decimal(metricsData[i].avgOv),
        period: '7d',
      },
    });
  }

  // ─────────────────────────────────────────
  // 7. Opportunity Scores (Layer 2)
  // ─────────────────────────────────────────
  console.log('🎯 Calculating opportunity scores...');
  const scores = [
    { score: 94, sg: 96, cs: 76, cv: 58, rv: 66, ci: 50 },
    { score: 72, sg: 54, cs: 76, cv: 68, rv: 50, ci: 50 },
    { score: 89, sg: 100, cs: 54, cv: 80, rv: 95, ci: 50 },
    { score: 58, sg: 36, cs: 100, cv: 70, rv: 22, ci: 50 },
    { score: 78, sg: 84, cs: 70, cv: 66, rv: 51, ci: 50 },
    { score: 96, sg: 100, cs: 68, cv: 90, rv: 100, ci: 50 },
    { score: 48, sg: 24, cs: 100, cv: 56, rv: 15, ci: 50 },
    { score: 62, sg: 45, cs: 100, cv: 72, rv: 29, ci: 50 },
    { score: 82, sg: 100, cs: 50, cv: 82, rv: 81, ci: 50 },
    { score: 98, sg: 100, cs: 50, cv: 86, rv: 100, ci: 50 },
  ];

  for (let i = 0; i < products.length; i++) {
    await prisma.opportunityScore.create({
      data: {
        productId: products[i].id,
        score: scores[i].score,
        salesGrowthScore: scores[i].sg,
        commissionScore: scores[i].cs,
        conversionScore: scores[i].cv,
        reviewVelocity: scores[i].rv,
        competitionIndex: scores[i].ci,
      },
    });
  }

  // ─────────────────────────────────────────
  // 8. Content Assets & Performance (Layer 3)
  // ─────────────────────────────────────────
  console.log('🎬 Creating content assets...');
  const contentData = [
    {
      productIdx: 0, contentType: 'tiktok',
      hook: 'Jangan beli sebelum lihat ini',
      caption: '🔥 Serum Vitamin C yang lagi viral! Kulit cerah dalam 7 hari...',
      views: 52000, likes: 4200, shares: 890, comments: 320, ctr: 7.8, convRate: 4.3,
      clicks: 4300, orders: 125, revenue: 9875000, commission: 2100000,
    },
    {
      productIdx: 2, contentType: 'tiktok',
      hook: 'Hijab Rp45rb tapi kualitas Rp200rb',
      caption: '✨ Hijab voal premium motif batik! Bahannya lembut banget...',
      views: 89000, likes: 7800, shares: 2100, comments: 650, ctr: 9.2, convRate: 4.0,
      clicks: 8500, orders: 340, revenue: 15300000, commission: 2300000,
    },
    {
      productIdx: 5, contentType: 'tiktok',
      hook: 'Sunscreen viral yang dokter kulit pakai sendiri',
      caption: '☀️ SPF50+ tapi ringan kayak pakai moisturizer! Matte finish...',
      views: 120000, likes: 11500, shares: 3400, comments: 980, ctr: 8.5, convRate: 4.5,
      clicks: 9200, orders: 410, revenue: 26650000, commission: 3470000,
    },
    {
      productIdx: 9, contentType: 'tiktok',
      hook: 'Sambal ini bikin nasi 3 piring habis',
      caption: '🌶️ Sambal Matah asli Bali! Pedasnya nendang tapi nagih...',
      views: 200000, likes: 18000, shares: 5200, comments: 1500, ctr: 6.5, convRate: 4.3,
      clicks: 12000, orders: 520, revenue: 18200000, commission: 3280000,
    },
    {
      productIdx: 1, contentType: 'instagram',
      hook: 'Blender portable yang bisa bikin smoothie di mana aja',
      caption: '🥤 Ngga perlu colokan listrik! Cas lewat USB-C, 1x cas bisa 15 gelas...',
      views: 35000, likes: 2800, shares: 450, comments: 180, ctr: 5.2, convRate: 3.4,
      clicks: 2800, orders: 95, revenue: 17955000, commission: 1800000,
    },
    {
      productIdx: 0, contentType: 'whatsapp',
      hook: 'Hai kak, udah coba serum ini belum?',
      caption: 'Serum Vitamin C yang lagi hits banget! Banyak yang repeat order...',
      views: 0, likes: 0, shares: 0, comments: 0, ctr: 12.5, convRate: 6.2,
      clicks: 1200, orders: 75, revenue: 5925000, commission: 711000,
    },
  ];

  for (const c of contentData) {
    const asset = await prisma.contentAsset.create({
      data: {
        productId: products[c.productIdx].id,
        contentType: c.contentType,
        hook: c.hook,
        caption: c.caption,
      },
    });

    await prisma.contentPerformance.create({
      data: {
        contentAssetId: asset.id,
        views: c.views,
        likes: c.likes,
        shares: c.shares,
        comments: c.comments,
        ctr: c.ctr,
        conversionRate: c.convRate,
      },
    });

    if (c.clicks > 0) {
      await prisma.contentClick.create({
        data: {
          contentAssetId: asset.id,
          clickCount: c.clicks,
          source: c.contentType,
        },
      });
    }

    if (c.orders > 0) {
      await prisma.contentConversion.create({
        data: {
          contentAssetId: asset.id,
          orders: c.orders,
          revenue: new Prisma.Decimal(c.revenue),
          commission: new Prisma.Decimal(c.commission),
        },
      });
    }
  }

  // ─────────────────────────────────────────
  // 9. Content Patterns (Layer 4)
  // ─────────────────────────────────────────
  console.log('🧠 Creating winning patterns...');
  const patterns = [
    { category: 'skincare', platform: 'tiktok', hook: 'Jangan beli sebelum lihat ini', ctr: 7.8, conv: 4.3, samples: 45, confidence: 0.85 },
    { category: 'skincare', platform: 'tiktok', hook: 'Produk viral banget', ctr: 1.9, conv: 0.8, samples: 30, confidence: 0.75 },
    { category: 'skincare', platform: 'tiktok', hook: 'Dokter kulit rekomendasikan ini', ctr: 6.5, conv: 3.8, samples: 22, confidence: 0.68 },
    { category: 'fashion', platform: 'tiktok', hook: 'Rp45rb tapi kualitas Rp200rb', ctr: 9.2, conv: 4.0, samples: 38, confidence: 0.82 },
    { category: 'fashion', platform: 'tiktok', hook: 'OOTD under 100rb', ctr: 5.5, conv: 2.8, samples: 25, confidence: 0.72 },
    { category: 'food', platform: 'tiktok', hook: 'Sambal ini bikin nasi 3 piring habis', ctr: 6.5, conv: 4.3, samples: 18, confidence: 0.63 },
    { category: 'food', platform: 'shopee', hook: 'Makanan viral yang wajib dicoba', ctr: 4.2, conv: 3.1, samples: 15, confidence: 0.59 },
    { category: 'electronics', platform: 'tiktok', hook: 'Gadget under 200rb yang bikin hidup lebih mudah', ctr: 5.8, conv: 3.2, samples: 28, confidence: 0.74 },
    { category: 'health', platform: 'tiktok', hook: 'Suplemen yang gym-goers wajib punya', ctr: 4.5, conv: 2.5, samples: 12, confidence: 0.54 },
    { category: 'skincare', platform: 'whatsapp', hook: 'Hai kak, udah coba ini belum?', ctr: 12.5, conv: 6.2, samples: 50, confidence: 0.87 },
  ];

  for (const p of patterns) {
    const cat = await prisma.category.upsert({
      where: { slug: p.category },
      update: {},
      create: { name: p.category, slug: p.category }
    });

    await prisma.contentPattern.upsert({
      where: {
        categoryId_platform_hookTemplate: {
          categoryId: cat.id,
          platform: p.platform,
          hookTemplate: p.hook,
        },
      },
      update: {
        avgCtr: p.ctr,
        avgConversion: p.conv,
        sampleSize: p.samples,
        confidence: p.confidence,
      },
      create: {
        categoryId: cat.id,
        platform: p.platform,
        hookTemplate: p.hook,
        avgCtr: p.ctr,
        avgConversion: p.conv,
        sampleSize: p.samples,
        confidence: p.confidence,
      },
    });
  }

  // ─────────────────────────────────────────
  // 10. Commission Predictions (Layer 6)
  // ─────────────────────────────────────────
  console.log('💰 Creating commission predictions...');
  const predictions = [
    { idx: 0, views: 10000, ctr: 0.078, min: 850000, exp: 1900000, opt: 3500000 },
    { idx: 2, views: 10000, ctr: 0.092, min: 620000, exp: 1380000, opt: 2550000 },
    { idx: 5, views: 10000, ctr: 0.085, min: 720000, exp: 1600000, opt: 2960000 },
    { idx: 9, views: 10000, ctr: 0.065, min: 450000, exp: 1000000, opt: 1850000 },
    { idx: 8, views: 10000, ctr: 0.058, min: 580000, exp: 1290000, opt: 2380000 },
  ];

  for (const p of predictions) {
    await prisma.commissionPrediction.create({
      data: {
        productId: products[p.idx].id,
        inputViews: p.views,
        inputCtr: p.ctr,
        minimumComm: new Prisma.Decimal(p.min),
        expectedComm: new Prisma.Decimal(p.exp),
        optimisticComm: new Prisma.Decimal(p.opt),
        period: '7d',
      },
    });
  }

  // ─────────────────────────────────────────
  // 11. Clicks & Orders
  // ─────────────────────────────────────────
  console.log('🖱️ Creating clicks and orders...');
  const now = new Date();

  // Generate 30 days of clicks/orders for top products
  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    for (let i = 0; i < Math.min(5, products.length); i++) {
      const dailyClicks = Math.floor(Math.random() * 300) + 50;
      const dailyOrders = Math.floor(dailyClicks * (0.02 + Math.random() * 0.03));

      await prisma.click.create({
        data: {
          productId: products[i].id,
          source: ['tiktok', 'shopee', 'whatsapp', 'direct'][Math.floor(Math.random() * 4)],
          timestamp: date,
          count: dailyClicks,
        },
      });

      if (dailyOrders > 0) {
        const orderAmount = Number(products[i].price) * dailyOrders;
        const commission = orderAmount * products[i].commissionRate;

        await prisma.order.create({
          data: {
            productId: products[i].id,
            userId: user.id,
            amount: new Prisma.Decimal(orderAmount),
            commission: new Prisma.Decimal(commission),
            platform: products[i].platform,
            createdAt: date,
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────
  // 12. Affiliate Links
  // ─────────────────────────────────────────
  console.log('🔗 Creating affiliate links...');
  for (let i = 0; i < products.length; i++) {
    const clicks = metricsData[i].clicks;
    const conversions = metricsData[i].conv;

    await prisma.affiliateLink.create({
      data: {
        productId: products[i].id,
        userId: user.id,
        url: `https://${products[i].platform}.com/affiliate/${products[i].externalId}?ref=aiaos`,
        shortUrl: `aiaos.link/${products[i].externalId?.toLowerCase().replace('sku-', '')}`,
        platform: products[i].platform,
        clicks,
        conversions,
      },
    });
  }

  // ─────────────────────────────────────────
  // 13. WhatsApp Templates
  // ─────────────────────────────────────────
  console.log('📱 Creating WhatsApp templates...');
  const templates = [
    {
      name: 'Promo Produk Baru',
      content: 'Hai {{nama}}! 👋\n\nAda produk baru yang lagi viral nih:\n🛍️ {{produk}}\n💰 Harga: {{harga}}\n⭐ Rating: {{rating}}/5\n\nKlik link ini untuk order:\n{{link}}\n\nJangan sampai kehabisan ya! 🔥',
      category: 'promo',
    },
    {
      name: 'Follow Up Klik',
      content: 'Hai {{nama}} 😊\n\nKemarin kamu udah lihat {{produk}} kan?\nMasih ada stok nih, tapi cepet habis lho!\n\n✅ Gratis ongkir\n✅ COD tersedia\n\nOrder sekarang: {{link}}',
      category: 'follow_up',
    },
    {
      name: 'Closing Deal',
      content: 'Hai {{nama}}! 🎉\n\nKhusus hari ini, {{produk}} lagi DISKON {{diskon}}%!\n\n🏷️ Dari {{harga_asli}} jadi {{harga_diskon}}\n⏰ Berlaku sampai jam 23:59\n\nBuruan order: {{link}}\n\nStok terbatas! 🔥',
      category: 'closing',
    },
    {
      name: 'Testimoni Share',
      content: '✨ Testimoni dari customer kami:\n\n"{{testimoni}}"\n- {{nama_customer}}\n\nMau hasil yang sama? Order di sini:\n{{link}}\n\n💯 Dijamin original!',
      category: 'promo',
    },
  ];

  for (const t of templates) {
    await prisma.whatsAppTemplate.create({ data: t });
  }

  // ─────────────────────────────────────────
  // 14. Events (Layer 7 - Feedback Loop)
  // ─────────────────────────────────────────
  console.log('📡 Creating feedback loop events...');
  const eventTypes = ['product_view', 'click', 'conversion', 'content_posted', 'commission_earned'];

  for (let i = 0; i < 50; i++) {
    const eventDate = new Date(now);
    eventDate.setHours(eventDate.getHours() - Math.floor(Math.random() * 168)); // last 7 days

    await prisma.event.create({
      data: {
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        entityId: products[Math.floor(Math.random() * products.length)].id,
        entityType: ['product', 'content', 'link'][Math.floor(Math.random() * 3)],
        payload: JSON.stringify({ source: 'demo_seed' }),
        createdAt: eventDate,
      },
    });
  }

  // ─────────────────────────────────────────
  // 15. AI Content (Generated)
  // ─────────────────────────────────────────
  console.log('✍️ Creating AI-generated content...');
  const aiContents = [
    {
      productIdx: 0, contentType: 'caption', platform: 'tiktok',
      text: '🔥 VIRAL! Serum Vitamin C yang bikin kulit glowing dalam 7 hari!\n\n✨ Mencerahkan kulit kusam\n✨ Menghilangkan bekas jerawat\n✨ Melembapkan 24 jam\n\nHarga cuma Rp79.000 aja! 😱\n\n🛒 Klik link di bio!\n\n#serumvitaminc #skincare #glowingskin #viral #tiktokmall',
    },
    {
      productIdx: 2, contentType: 'hook', platform: 'tiktok',
      text: '3 Hook Terbaik:\n1. "Hijab Rp45rb tapi kualitas Rp200rb"\n2. "Jangan beli hijab sebelum lihat ini"\n3. "Hijab yang bikin semua orang nanya belinya di mana"',
    },
    {
      productIdx: 5, contentType: 'caption', platform: 'tiktok',
      text: '☀️ Sunscreen favorit para dokter kulit!\n\nSPF50+ PA++++ tapi ringan banget!\n✅ Matte finish, no white cast\n✅ Cocok untuk semua jenis kulit\n✅ Bisa dipakai sebelum makeup\n\nCuma Rp65.000! Link di bio 👇\n\n#sunscreen #skincare #spf50 #mattefinish #viral',
    },
  ];

  for (const c of aiContents) {
    await prisma.aIContent.create({
      data: {
        productId: products[c.productIdx].id,
        userId: user.id,
        contentType: c.contentType,
        generatedText: c.text,
        platform: c.platform,
      },
    });
  }

  console.log('\n✅ Seeding complete!');
  console.log(`   📦 ${products.length} products`);
  console.log(`   📸 ${snapshotData.length} snapshots`);
  console.log(`   🎯 ${scores.length} opportunity scores`);
  console.log(`   🎬 ${contentData.length} content assets`);
  console.log(`   🧠 ${patterns.length} winning patterns`);
  console.log(`   💰 ${predictions.length} commission predictions`);
  console.log(`   📱 ${templates.length} WhatsApp templates`);
  console.log(`   📡 50 feedback events`);
  console.log(`   💳 ${plans.length} billing plans`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
