import axios from 'axios';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

/**
 * Generate content using Google Gemini API.
 * Falls back to a placeholder if the API key is not set.
 */
export async function generateContent(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[Gemini] API key not configured, returning placeholder.');
    return getFallbackContent(prompt);
  }

  try {
    const response = await axios.post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || getFallbackContent(prompt);
  } catch (error: any) {
    console.error('[Gemini] API error:', error?.message || error);

    // Retry once with exponential back-off
    try {
      await delay(2000);
      const response = await axios.post<GeminiResponse>(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || getFallbackContent(prompt);
    } catch (retryError: any) {
      console.error('[Gemini] Retry failed:', retryError?.message);
      return getFallbackContent(prompt);
    }
  }
}

/**
 * Generate product-specific AI recommendation prompt
 */
export function buildProductPrompt(product: {
  name: string;
  category?: string;
  price: number;
  platform?: string;
}): string {
  return `Kamu adalah AI affiliate marketing expert Indonesia. Buatkan konten promosi untuk produk berikut:

Nama Produk: ${product.name}
Kategori: ${product.category || 'Umum'}
Harga: Rp ${product.price.toLocaleString('id-ID')}
Platform: ${product.platform || 'TikTok'}

Berikan:
1. Hook yang menarik (1 kalimat pembuka yang viral)
2. Caption lengkap dengan emoji
3. 5 hashtag relevan
4. Call-to-action yang kuat

Gunakan bahasa Indonesia yang natural dan persuasif.`;
}

/**
 * Generate content recommendation with winning patterns
 */
export function buildRecommendationPrompt(product: {
  name: string;
  category?: string;
  opportunityScore: number;
  bestHook?: string;
  expectedCtr?: number;
}): string {
  return `Kamu adalah AI affiliate intelligence system. Berdasarkan data berikut, berikan rekomendasi strategi konten:

Produk: ${product.name}
Kategori: ${product.category || 'Umum'}
Opportunity Score: ${product.opportunityScore}/100
Hook Terbaik: ${product.bestHook || 'Belum ada data'}
Expected CTR: ${product.expectedCtr ? `${product.expectedCtr}%` : 'Belum ada data'}

Berikan rekomendasi dalam format:
1. Target Audience (usia, gender, minat)
2. Platform terbaik dan alasannya
3. 3 variasi hook yang direkomendasikan
4. Tips optimasi konten
5. Estimasi performa

Gunakan bahasa Indonesia yang profesional.`;
}

function getFallbackContent(prompt: string): string {
  if (prompt.includes('konten promosi')) {
    return `🔥 Produk ini lagi viral banget!\n\nDapatkan produk berkualitas dengan harga terbaik. Jangan sampai kehabisan!\n\n✅ Kualitas terjamin\n✅ Harga terjangkau\n✅ Pengiriman cepat\n\n🛒 Klik link di bio untuk order sekarang!\n\n#viral #produkberkualitas #rekomendasiproduk #affiliate #tiktokmall`;
  }

  if (prompt.includes('rekomendasi strategi')) {
    return `📊 Rekomendasi AI:\n\n🎯 Target: Wanita 18-35 tahun\n📱 Platform: TikTok\n🪝 Hook: "Jangan beli sebelum lihat ini"\n📈 Expected CTR: 5-7%\n💰 Potensi Komisi: Rp 500.000 - Rp 2.000.000 per 10.000 views`;
  }

  return '✨ Konten AI sedang dalam proses generasi. Silakan coba lagi.';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
