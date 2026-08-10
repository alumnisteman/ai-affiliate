import axios from "axios";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || "";

/**
 * Kirim pesan ke Telegram channel/group.
 */
export async function sendTelegram(message: string, chatId?: string): Promise<void> {
  const target = chatId || TELEGRAM_CHAT_ID;
  if (!TELEGRAM_TOKEN || !target) {
    console.warn("[Telegram] Token atau chat ID tidak dikonfigurasi, lewati.");
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: target,
      text: message,
      parse_mode: "HTML",
    });
  } catch (err: any) {
    console.error("[Telegram] Gagal kirim notifikasi:", err?.message);
  }
}

/**
 * Format pesan notifikasi viral alert.
 */
export function formatViralAlert(product: {
  name: string;
  viralScore: number;
  confidence: number;
  salesTrend: number;
}): string {
  const confidencePct = Math.round(product.confidence * 100);
  return (
    `🔥 <b>VIRAL EARLY WARNING</b>\n\n` +
    `📦 <b>${product.name}</b>\n` +
    `🚀 Skor Viral: <b>${product.viralScore.toFixed(0)}/100</b>\n` +
    `💪 Confidence: <b>${confidencePct}%</b>\n` +
    `📈 Sales Trend: <b>+${product.salesTrend.toFixed(1)}%</b>\n\n` +
    `⏱ Prediksi viral dalam <b>72 jam ke depan</b>\n` +
    `🔗 Cek di: http://${process.env.SERVER_IP || "192.168.1.13"}/viral`
  );
}
