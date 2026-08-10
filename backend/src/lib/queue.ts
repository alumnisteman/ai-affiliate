import * as amqplib from "amqplib";

let connection: any = null;
let channel: any = null;

export const QUEUES = {
  VIRAL:      "affiliate.viral",
  COACH:      "affiliate.coach",
  CONTENT_DNA:"affiliate.contentDNA",
  COMPETITOR: "affiliate.competitor",
  AGENT:      "affiliate.agent",
  LEARNING:   "affiliate.learning",
  SCORE:      "affiliate.score",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export async function getChannel(): Promise<any> {
  if (channel) return channel;

  const url = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";
  connection = await amqplib.connect(url);
  channel = await connection.createChannel();

  // Assert semua queue agar tersedia
  for (const q of Object.values(QUEUES)) {
    await channel.assertQueue(q, { durable: true });
  }

  console.log("✅ RabbitMQ terhubung, semua queue tersedia");
  return channel;
}

export async function publish(queue: QueueName, payload: object): Promise<void> {
  const ch = await getChannel();
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
}

export async function consume(
  queue: QueueName,
  handler: (payload: any) => Promise<void>
): Promise<void> {
  const ch = await getChannel();
  await ch.consume(
    queue,
    async (msg: amqplib.ConsumeMessage | null) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await handler(payload);
        ch.ack(msg);
      } catch (err) {
        console.error(`[Worker:${queue}] Error:`, err);
        ch.nack(msg, false, false); // dead-letter tanpa requeue
      }
    },
    { noAck: false }
  );
  console.log(`👂 Worker mendengarkan queue: ${queue}`);
}

export async function closeConnection(): Promise<void> {
  try {
    await channel?.close();
    await connection?.close();
  } catch {}
}
