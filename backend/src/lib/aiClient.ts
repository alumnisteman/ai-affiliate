import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Kirim satu prompt ke Claude dan dapatkan teks respons.
 */
export async function chat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048
): Promise<string> {
  const response = await client.messages.create({
    model: process.env.AI_MODEL || "claude-3-5-sonnet-20241022",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from AI");
  return block.text;
}

/**
 * Kirim prompt dan parse JSON dari respons Claude.
 */
export async function chatJSON<T = any>(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048
): Promise<T> {
  const raw = await chat(
    systemPrompt + "\n\nBALAS HANYA DENGAN JSON VALID. JANGAN TAMBAH TEKS LAIN.",
    userMessage,
    maxTokens
  );

  // Ekstrak blok JSON dari respons
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/({[\s\S]*})/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw;

  try {
    return JSON.parse(jsonStr.trim()) as T;
  } catch {
    throw new Error(`Gagal parse JSON dari AI: ${jsonStr.substring(0, 200)}`);
  }
}

export default { chat, chatJSON };
